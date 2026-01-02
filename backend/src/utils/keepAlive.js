// Keep-alive function to prevent Render free tier from sleeping
const startKeepAlive = () => {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render sleeps after 15 min inactivity)

  if (!RENDER_URL) {
    console.log('⚠️  RENDER_EXTERNAL_URL not set in environment variables');
    console.log('💡 Self-ping disabled. Please set up external cron job:');
    console.log('   - UptimeRobot: https://uptimerobot.com');
    console.log('   - Cron-job.org: https://cron-job.org');
    return;
  }

  console.log('✅ Self-ping enabled');
  console.log(`📍 Ping URL: ${RENDER_URL}/health`);
  console.log(`⏱️  Interval: Every 14 minutes`);

  // Initial ping after 1 minute
  setTimeout(() => {
    console.log('🔄 Starting first self-ping...');
    pingServer();
  }, 60 * 1000);

  // Regular ping every 14 minutes
  setInterval(() => {
    pingServer();
  }, PING_INTERVAL);
};

const pingServer = async () => {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${RENDER_URL}/health`);
    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: true 
    });
    
    console.log('━'.repeat(50));
    console.log(`✅ Self-Ping Successful`);
    console.log(`🕐 Time: ${timestamp}`);
    console.log(`⚡ Response: ${responseTime}ms`);
    console.log(`📊 Status: ${data.status}`);
    console.log(`⏱️  Uptime: ${Math.floor(data.uptime / 60)} minutes`);
    console.log('━'.repeat(50));
  } catch (error) {
    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: true 
    });
    
    console.error('━'.repeat(50));
    console.error(`❌ Self-Ping Failed`);
    console.error(`🕐 Time: ${timestamp}`);
    console.error(`💥 Error: ${error.message}`);
    console.error('━'.repeat(50));
  }
};

module.exports = { startKeepAlive };