import express from "express";
import { connectDB } from "../config/db.js";
import Message from "../models/Message.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    await Message.create({ name });
    res.status(200).json({ message: "Message saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
