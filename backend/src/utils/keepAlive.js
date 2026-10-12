const https = require('https');

const startKeepAlive = () => {
  const URL = process.env.RENDER_URL || '';

  if (!URL) {
    console.log('ℹ️  Keep-alive skipped (no RENDER_URL set)');
    return;
  }

  setInterval(() => {
    https.get(`${URL}/health`, (res) => {
      console.log(`💓 Keep-alive ping: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Keep-alive error:', err.message);
    });
  }, 14 * 60 * 1000);

  console.log('✅ Keep-alive started (every 14 min)');
};

module.exports = { startKeepAlive };