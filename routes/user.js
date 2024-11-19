import express from "express";
import User from "../models/user.js";
import Word from "../models/word.js";
import {
  askGemini,
  geminiController,
} from "../controllers/gemini.controller.js";

const router = express.Router();

router.post("/save", async (req, res) => {
  const { word, extensionKey } = req.body;
  if (!word || !extensionKey) {
    return res.status(400).json({
      message: "Please provide a word or extensionKey",
      status: "error",
    });
  }

  try {
    const user = await User.findOne({
      extensionKey: extensionKey,
    });

    if (!user) {
      console.log("User not found", firstName);
      return res.status(404).json({
        message: "User not found",
        status: "error",
      });
    }

    const newWord = await Word.create({
      word,
      userId: user.clerkId,
    });
    return res.status(201).json({
      message: "Word saved successfully",
      status: "success",
      word: newWord,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error occurred while finding user",
      status: "error",
    });
  }
});
router.post("/register", async (req, res) => {
  const { email, clerkId, firstName, lastName, extensionKey } = req.body;
  console.log(email, clerkId, firstName, lastName, extensionKey);
  if (!email || !clerkId || !firstName || !lastName) {
    return res.status(400).json({
      message:
        "Please provide all required fields (email, clerkId, firstName, lastName)",
      status: "error",
    });
  }

  try {
    const isExists = await User.findOne({
      clerkId: clerkId,
    });

    if (isExists) {
      console.log("already exist", firstName);
      return res.status(201).json({
        message: "User already exists",
        status: "success",
      });
    }

    const user = await User.create({
      email,
      clerkId,
      firstName,
      lastName,
      extensionKey,
    });

    return res.status(201).json({
      message: "User registered successfully",
      status: "success",
      user,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
      error: error.message,
    });
  }
});

router.get("/words/len", async (req, res) => {
  const userId = req.query.id;

  if (!userId) {
    return res.status(400).json({
      message: "Please provide user id",
      status: "error",
    });
  }

  const wordsLength = await Word.countDocuments({
    userId: userId,
  });

  const length = wordsLength.length;
  console.log(length);
  return res.status(200).json({
    message: "Total number of words",
    totalLength: length,
  });
});

router.get("/words/recent", async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const recentWords = await Word.find({
      userId: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    return res.status(200).json({
      message: "Recent words",
      status: "success",
      recentWords,
    });
  } catch (error) {
    console.error("Error fetching recent words:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});
router.get("/words/streak", async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }

    const words = await Word.find({ userId })
      .sort({ createdAt: -1 })
      .select("createdAt");

    if (words.length === 0) {
      return res.status(200).json({
        message: "No streak",
        status: "success",
        streak: 0,
      });
    }

    const dates = words.map((word) => {
      const date = new Date(word.createdAt);
      return date.toISOString().split("T")[0];
    });

    const uniqueDates = [...new Set(dates)];

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const streakDate = new Date(uniqueDates[i]);
      if (
        currentDate.toISOString().split("T")[0] ===
        streakDate.toISOString().split("T")[0]
      ) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return res.status(200).json({
      message: "Current active streak",
      status: "success",
      streak,
    });
  } catch (error) {
    console.error("Error calculating streak:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});

router.get("/words/random", async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }

    const randomWordResult = await Word.aggregate([{ $sample: { size: 1 } }]);

    return res.status(200).json({
      message: "random word",
      word: randomWordResult,
    });
  } catch (error) {
    console.error("Error fetching random word:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});
router.get("/words", async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }

    const words = await Word.find({
      userId,
    });

    return res.status(200).json({
      message: "random word",
      words,
    });
  } catch (error) {
    console.error("Error fetching words:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});
router.get("/word/info", async (req, res) => {
  try {
    const { userId, word } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }

    const response = await askGemini(word);

    return res.status(200).json({
      message: "word info",
      text: response,
    });
  } catch (error) {
    console.error("Error fetching word info:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});
router.get("/word/remove", async (req, res) => {
  try {
    const { userId, wordId } = req.query;

    if (!userId && !wordId) {
      return res.status(400).json({
        message: "Please provide a user ID",
        status: "error",
      });
    }

    const response = await Word.deleteOne({
      _id: wordId,
      userId: userId,
    });

    return res.status(200).json({
      message: "word deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching word info:", error);
    return res.status(500).json({
      message: "Internal server error",
      status: "error",
    });
  }
});

export default router;
