import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToDB } from "./utils/connectToDb.js";
import userRouter from "./routes/user.js";
import geminiRouter from "./routes/gemini.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOptions = {
  origin: "*",
  credentials: false,
};

app.use(cors(corsOptions));
connectToDB();

export const genAI = new GoogleGenerativeAI(
  process.env.NEXT_GEMINI_API_KEY || ""
);
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/", (req, res) => {
  console.log("GET request received");
  res.json({
    message: "Welcome to the Express API",
    status: "success",
  });
});

app.use("/api/user", userRouter);
app.use("/api/gemini", geminiRouter);

app.listen(4000, () => {
  console.log("Server is running on port 4000");
});

export default app;
