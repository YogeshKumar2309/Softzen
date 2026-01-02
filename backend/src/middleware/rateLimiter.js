// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // same IP can only make 5 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,   // Disable X-RateLimit-* headers
});

module.exports = contactLimiter;
