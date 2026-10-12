const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Bahut zyada requests. 15 minute baad try karein.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = contactLimiter;