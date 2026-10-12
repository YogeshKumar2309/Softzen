const express = require('express');
const router = express.Router();
const {
  getMessages,
  getPrivateMessages,
  getConversations,
  markAsRead
} = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// Sab auth zaroori hai
router.get('/conversations', authMiddleware, getConversations);
router.get('/dm/:otherUser', authMiddleware, getPrivateMessages);
router.post('/read/:otherUser', authMiddleware, markAsRead);
router.get('/:roomId', authMiddleware, getMessages);

module.exports = router;