import express from "express";
import { geminiController } from "../controllers/gemini.controller.js";
const router = express.Router();

router.post("/generate", geminiController);
export default router;