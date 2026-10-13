const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.get('/history', authMiddleware, aiController.getHistory);
router.post('/chat', authMiddleware, aiController.chat);
router.delete('/history', authMiddleware, aiController.clearHistory);

module.exports = router;