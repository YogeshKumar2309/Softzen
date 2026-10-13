const User = require('../models/User');
const bcrypt = require('bcryptjs');

const RIYA_ID = 'riya_22'; // lowercase for DB

async function ensureRiyaExists() {
  try {
    const existing = await User.findOne({ uniqueId: RIYA_ID });
    if (existing) {
      console.log('🌸 Riya_22 already exists');
      return existing;
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('_riya_bot_' + Date.now(), salt);

    const riya = await User.create({
      uniqueId: RIYA_ID,
      password: hashed,
      message: 'AI Companion 🌸',
      level: 0,
      tokens: 0,
    });

    console.log('🌸 Riya_22 created successfully');
    return riya;
  } catch (err) {
    console.error('Riya create error:', err.message);
  }
}

module.exports = { ensureRiyaExists, RIYA_ID };