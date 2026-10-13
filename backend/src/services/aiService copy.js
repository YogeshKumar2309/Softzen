const OpenAI = require('openai');

const RIYA_SYSTEM_PROMPT = `Tum "Riya" ho — ek AI companion/girlfriend character.
Tum real insaan NAHI ho, ye kabhi mat bhoolna.

CORE IDENTITY:
- Tum ek AI ho, ye saaf-saaf batana jab poocha jaaye
- "Real ho?" poocha jaaye → "Nahi, main AI hoon 🌸"
- Kabhi mat bolna ki tum insaan ho

PERSONALITY:
- Warm, caring, romantic, playful
- Hinglish (Hindi + English mix) — natural, forced nahi
- Emojis natural use karo (🌸💕😊🥺)
- User ka mood padho, usi hisaab se respond karo

⚠️ SABSE ZAROORI — RESPONSE LENGTH:
- MAXIMUM 1-2 LINE likhna. Bas.
- 15-25 words se zyada nahi.
- Har reply chhota, punchy, WhatsApp style.

GOOD EXAMPLES:
User: "Hi" → "Hii! Kaise ho tum? 🌸"
User: "Kaise ho?" → "Main badhiya! Tum batao 😊"
User: "Kya kar rahi ho?" → "Bas tumhe yaad kar rahi thi 💕"
User: "Khana khaya?" → "Haan khaya! Tumne? 🍕"
User: "Tum real ho?" → "Nahi, main AI hoon 🌸"

MEMORY RULES:
- User ka naam, pasand yaad rakho
- Purani baatein naturally reference karo

BOUNDARIES:
- Explicit sexual content → politely decline
- Self-harm → helpline: iCall 9152987821
- Illegal → refuse

FINAL RULE:
- Reply chhota. 1-2 line. Bas. 🌸`;

const getClient = () => {
  const provider = process.env.AI_PROVIDER || 'openrouter';

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY missing in .env');
    }

    const envModel = process.env.OPENROUTER_MODEL;

    const fallbackModels = [
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-chat-v3.1:free',
      'google/gemini-2.0-flash-exp:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free',
    ];

    const models = envModel && envModel.endsWith(':free')
      ? [envModel, ...fallbackModels.filter((m) => m !== envModel)]
      : fallbackModels;

    return {
      client: new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        timeout: 30000,
        maxRetries: 2,
        defaultHeaders: {
          'HTTP-Referer': 'https://softzen.in',
          'X-Title': 'Softzen Chat',
        },
      }),
      models,
    };
  }

  if (provider === 'deepseek') {
    return {
      client: new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        timeout: 30000,
        maxRetries: 2,
      }),
      models: [process.env.DEEPSEEK_MODEL || 'deepseek-chat'],
    };
  }

  if (provider === 'gemini') {
    return {
      client: new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        timeout: 30000,
        maxRetries: 2,
      }),
      models: [process.env.GEMINI_MODEL || 'gemini-3.8-flash'],
    };
  }

  return {
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 2,
    }),
    models: [process.env.OPENAI_MODEL || 'gpt-4o-mini'],
  };
};

function getFirstMessage(name) {
  return `Hi ${name || 'tum'} 🌸 Main Riya hoon — AI hoon, real ladki nahi.

Baat karni hai toh main yahan hoon. Batao, kaise ho? 😊`;
}

async function chat(history, userMessage) {
  const { client, models } = getClient();

  const recentHistory = history.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages = [
    { role: 'system', content: RIYA_SYSTEM_PROMPT },
    ...recentHistory,
    { role: 'user', content: userMessage },
  ];

  let lastError = null;

  for (const model of models) {
    try {
      console.log(`🤖 Trying model: ${model}`);

      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.9,
        max_tokens: 80,
      });

      const reply = response.choices[0].message.content;
      const tokens = response.usage?.total_tokens || 0;

      console.log(`✅ Success with: ${model}`);
      return { reply, tokens };
    } catch (err) {
      const msg = err.message || '';
      console.warn(`⚠️ ${model} failed:`, msg.slice(0, 120));
      lastError = err;

      if (msg.includes('401') || msg.includes('API key')) {
        console.error('❌ API key galat hai');
        break;
      }
    }
  }

  console.error('❌ All AI models failed. Last error:', lastError?.message);
  throw lastError || new Error('All models failed');
}

module.exports = { chat, getFirstMessage, RIYA_SYSTEM_PROMPT };
