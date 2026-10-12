const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  receiverId: {
    type: String,
    lowercase: true,
    default: null,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    default: 'general',
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);