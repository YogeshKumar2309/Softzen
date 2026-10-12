const express = require('express');
const router = express.Router();
const { registerUser, getMemberCount } = require('../controllers/userController');

router.post('/register', registerUser);
router.get('/count', getMemberCount);

module.exports = router;