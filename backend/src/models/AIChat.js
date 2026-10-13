const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  uniqueId: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  tokens: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

aiChatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIChat', aiChatSchema);