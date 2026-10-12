const express = require('express');
const router = express.Router();
const { registerUser, getMemberCount, getAllUsers, getOnlineUsers, loginUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/count', getMemberCount);
router.get('/all', getAllUsers);
router.get('/online', getOnlineUsers);

module.exports = router;