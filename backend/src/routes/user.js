const express = require('express');
const router = express.Router();
const { registerUser, getMemberCount, getAllUsers } = require('../controllers/userController');

router.post('/register', registerUser);
router.get('/count', getMemberCount);
router.get('/all', getAllUsers);

module.exports = router;