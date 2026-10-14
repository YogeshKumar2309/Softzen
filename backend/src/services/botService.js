// Chat App → AI Service (chatBotAi) ko call kare
require("dotenv").config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
const TIMEOUT_MS = 15000;

async function chat(message) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${AI_SERVICE_URL}/api/v1/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) throw new Error(`AI Service ${res.status}`);

    const data = await res.json();
    if (!data?.success || !data?.data?.reply) {
      throw new Error("Invalid response");
    }

    return {
      reply: data.data.reply,
      tokens: 0,
      source: data.data.source || "ai",
      mood: data.data.mood,
    };
  } catch (err) {
    clearTimeout(timer);
    console.error("🤖 AI Service error:", err.message);
    throw err; // upar wala fallback handle karega
  }
}

module.exports = { chat };