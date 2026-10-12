const cron = require('node-cron');
const https = require('https');
const http = require('http');

/**
 * Keep-alive cron job
 * Har 15 minute me apne server ke /ping endpoint ko hit karta hai
 * Render free tier par server 15 min inactivity ke baad sota hai
 * Isliye ye cron use hota hai
 */

let cronTask = null;

const startKeepAlive = () => {
  // Render par RENDER_EXTERNAL_URL automatically milta hai
  // Local me manually set karna padta hai
  const URL = process.env.RENDER_EXTERNAL_URL
    || process.env.RENDER_URL
    || process.env.APP_URL
    || `http://localhost:${process.env.PORT || 5001}`;

  const isLocal = URL.includes('localhost') || URL.includes('127.0.0.1');

  console.log('🔔 Keep-alive cron registered for:', URL);
  console.log('⏰ Schedule: every 15 minutes');

  // Cron expression: "*/15 * * * *" = har 15 minute me
  // Format: minute hour day month weekday
  cronTask = cron.schedule('*/15 * * * *', () => {
    const url = `${URL}/ping`;
    const client = url.startsWith('https') ? https : http;

    const startTime = Date.now();

    client.get(url, (res) => {
      const elapsed = Date.now() - startTime;
      console.log(`💓 [${new Date().toISOString()}] Ping ${url} → ${res.statusCode} (${elapsed}ms)`);
      res.resume(); // response body consume karo
    }).on('error', (err) => {
      console.error(`❌ [${new Date().toISOString()}] Ping failed: ${err.message}`);
    });
  });

  // Server start hote hi ek immediate ping bhejo
  setTimeout(() => {
    const url = `${URL}/ping`;
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
      console.log(`💓 Initial ping → ${res.statusCode}`);
      res.resume();
    }).on('error', (err) => {
      console.error(`❌ Initial ping failed: ${err.message}`);
    });
  }, 5000);

  // Optional: agar local ho, to har 15 min me log mat dikhao
  if (isLocal) {
    console.log('ℹ️  Local mode: ping har 15 min me chalega');
  }
};

const stopKeepAlive = () => {
  if (cronTask) {
    cronTask.stop();
    console.log('🛑 Keep-alive cron stopped');
  }
};

module.exports = { startKeepAlive, stopKeepAlive };