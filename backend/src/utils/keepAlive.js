// Keep-alive: multiple Render services ko ping karta hai
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (Render 15 min me sota hai)
const TIMEOUT = 60 * 1000; // cold start ke liye 60s

const getTargets = () => {
  const targets = [];

  if (process.env.RENDER_EXTERNAL_URL) {
    targets.push({
      name: 'Softzen Backend',
      url: `${process.env.RENDER_EXTERNAL_URL}/health`,
      json: true,
    });
  }

  targets.push({
    name: 'ChatbotAI',
    url: 'https://chatbotai-5te2.onrender.com/health',
    json: false,
  });

  return targets;
};

const timestamp = () =>
  new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

const pingOne = async ({ name, url, json }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  const start = Date.now();

  try {
    const res = await fetch(url, { signal: controller.signal });
    const ms = Date.now() - start;

    let extra = '';
    if (json) {
      const data = await res.json();
      extra = ` | status: ${data.status} | uptime: ${Math.floor(data.uptime / 60)} min`;
    }

    console.log(`✅ [${name}] ${res.status} in ${ms}ms${extra} | ${timestamp()}`);
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : error.message;
    console.error(`❌ [${name}] Failed: ${reason} | ${timestamp()}`);
  } finally {
    clearTimeout(timer);
  }
};

const pingAll = async () => {
  console.log('━'.repeat(50));
  await Promise.allSettled(getTargets().map(pingOne));
  console.log('━'.repeat(50));
};

const startKeepAlive = () => {
  if (!process.env.RENDER_EXTERNAL_URL) {
    console.log('⚠️  RENDER_EXTERNAL_URL set nahi hai — sirf external targets ping honge');
    console.log('💡 Backup ke liye UptimeRobot (https://uptimerobot.com) ya cron-job.org use karo');
  }

  const targets = getTargets();
  console.log(`✅ Keep-alive enabled for ${targets.length} target(s), every 14 min`);
  targets.forEach((t) => console.log(`📍 ${t.name}: ${t.url}`));

  setTimeout(pingAll, 60 * 1000);       // pehla ping 1 min baad
  setInterval(pingAll, PING_INTERVAL);  // phir har 14 min
};

module.exports = { startKeepAlive };