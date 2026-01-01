import express from "express";
import cors from "cors";
import submitRoute from "./routes/submit.js";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
dotenv.config();  // load .env variables

const app = express();

connectDB();
app.use(cors());
app.use(express.json());

// API route
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

app.use("/api/submit", submitRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
