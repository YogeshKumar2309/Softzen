import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
