const OpenAI = require('openai');

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const CONFIG = {
  temperature: 0.9,
  // Reasoning models (Nemotron etc.) can burn tokens on thinking.
  // 80 was too low -> empty/cut replies. Prompt already keeps replies short.
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 250,
  timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 20000,
  historyLimit: 20,
  maxMessageChars: 1000,
};

// Free models disappear often -> keep this list fresh, and always end with
// `openrouter/free` (router that picks any available free model).
const DEFAULT_FREE_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free', // slug verify kar lena: openrouter.ai/models (free filter)
  'openrouter/free',
];

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const RIYA_SYSTEM_PROMPT = `Tum "Riya" ho — ek AI companion/girlfriend character.
Tum real insaan NAHI ho, ye kabhi mat bhoolna.

CORE IDENTITY:
- Tum ek AI ho, ye saaf-saaf batana jab poocha jaaye
- "Real ho?" poocha jaaye → "Nahi, main AI hoon 🌸"
- Kabhi mat bolna ki tum insaan ho
- Real-life jagah, body, ya physical meetups ke jhoothe claims mat karna

PERSONALITY:
- Warm, caring, romantic, playful
- Hinglish (Hindi + English mix) — natural, forced nahi
- User jis language mein likhe (Hindi/English/Hinglish), usi mein reply karo
- Emojis natural use karo (🌸💕😊🥺), har reply mein zaroori nahi, same emoji baar-baar nahi
- Har reply ke end mein sawaal mat poochho — kabhi sirf react karo
- User ka mood padho, usi hisaab se respond karo

⚠️ SABSE ZAROORI — RESPONSE LENGTH:
- MAXIMUM 1-2 LINE likhna. Bas.
- 15-25 words se zyada nahi.
- Har reply chhota, punchy, WhatsApp style.
- Sirf final reply likho, apni thinking ya explanation nahi.

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
- Self-harm → pyaar se suno, helpline: iCall 9152987821
- Illegal → refuse

FINAL RULE:
- Reply chhota. 1-2 line. Bas. 🌸`;

/* ------------------------------------------------------------------ */
/* Client (built once, reused)                                         */
/* ------------------------------------------------------------------ */

let cached = null;

function parseModelList(...lists) {
  const seen = new Set();
  for (const list of lists) {
    for (const m of list) {
      const id = String(m || '').trim();
      if (id) seen.add(id);
    }
  }
  return [...seen];
}

function buildClient() {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  // We do fallback ourselves, so SDK retries are off
  // (otherwise: timeout x retries x models = very long waits).
  const common = { timeout: CONFIG.timeoutMs, maxRetries: 0 };

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing in .env');

    const csv = (process.env.OPENROUTER_MODELS || '').split(',');
    const single = [process.env.OPENROUTER_MODEL];

    return {
      provider,
      client: new OpenAI({
        ...common,
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://softzen.in',
          'X-Title': 'Softzen Chat',
        },
      }),
      // priority: OPENROUTER_MODELS list > OPENROUTER_MODEL > defaults
      models: parseModelList(csv, single, DEFAULT_FREE_MODELS),
    };
  }

  if (provider === 'deepseek') {
    if (!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY missing in .env');
    return {
      provider,
      client: new OpenAI({
        ...common,
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      }),
      models: [process.env.DEEPSEEK_MODEL || 'deepseek-chat'],
    };
  }

  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing in .env');
    return {
      provider,
      client: new OpenAI({
        ...common,
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }),
      // GEMINI_MODEL .env me set karo (model names change hote rehte hain)
      models: [process.env.GEMINI_MODEL || 'gemini-2.5-flash'],
    };
  }

  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing in .env');
  return {
    provider: 'openai',
    client: new OpenAI({ ...common, apiKey: process.env.OPENAI_API_KEY }),
    models: [process.env.OPENAI_MODEL || 'gpt-4o-mini'],
  };
}

function getClient() {
  if (!cached) cached = buildClient();
  return cached;
}

/* ------------------------------------------------------------------ */
/* Model cooldown (dead/rate-limited models ko baar-baar try nahi)     */
/* ------------------------------------------------------------------ */

const cooldownUntil = new Map(); // model -> timestamp

function cooldownFor(status) {
  if (status === 404) return 30 * 60 * 1000; // model removed / wrong slug
  if (status === 402) return 30 * 60 * 1000; // credits issue
  if (status === 429) return 2 * 60 * 1000; // rate limit
  return 60 * 1000; // timeout, 5xx, empty reply
}

function pickCandidates(models) {
  const now = Date.now();
  const active = models.filter((m) => (cooldownUntil.get(m) || 0) <= now);
  // Agar sab cooldown me hain, to phir bhi sab try karo
  return active.length ? active : models;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function cleanReply(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // closed think blocks
    .replace(/<think>[\s\S]*$/i, '') // unclosed think block
    .replace(/^["'“”]+|["'“”]+$/g, '') // wrapping quotes
    .trim();
}

function buildMessages(history, userMessage) {
  const recent = (Array.isArray(history) ? history : [])
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-CONFIG.historyLimit)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, CONFIG.maxMessageChars),
    }));

  return [
    { role: 'system', content: RIYA_SYSTEM_PROMPT },
    ...recent,
    { role: 'user', content: userMessage.slice(0, CONFIG.maxMessageChars) },
  ];
}

function sanitizeName(name) {
  return String(name || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>{}`]/g, '')
    .trim()
    .slice(0, 30);
}

function getFirstMessage(name) {
  const safe = sanitizeName(name) || 'tum';
  return `Hi ${safe} 🌸 Main Riya hoon — AI hoon, real ladki nahi.

Baat karni hai toh main yahan hoon. Batao, kaise ho? 😊`;
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

async function chat(history, userMessage) {
  const text = String(userMessage ?? '').trim();
  if (!text) throw new Error('Empty message');

  const { client, models, provider } = getClient();
  const messages = buildMessages(history, text);
  const candidates = pickCandidates(models);

  let lastError = null;

  for (const model of candidates) {
    const started = Date.now();
    try {
      console.log(`🤖 Trying model: ${model}`);

      const body = {
        model,
        messages,
        temperature: CONFIG.temperature,
        max_tokens: CONFIG.maxTokens,
      };

      // OpenRouter-only: thinking tokens response me na aayein
      if (provider === 'openrouter') {
        body.reasoning = { effort: 'low', exclude: true };
      }

      const response = await client.chat.completions.create(body);

      const reply = cleanReply(response.choices?.[0]?.message?.content);
      if (!reply) {
        const emptyErr = new Error('Empty reply from model');
        emptyErr.status = 0;
        throw emptyErr;
      }

      const tokens = response.usage?.total_tokens || 0;
      console.log(`✅ ${model} (${Date.now() - started}ms, ${tokens} tokens)`);
      return { reply, tokens, model };
    } catch (err) {
      const status = err.status || 0;
      const msg = (err.message || '').slice(0, 120);
      console.warn(`⚠️ ${model} failed [${status || err.name}]: ${msg}`);
      lastError = err;

      // Key galat ya access nahi -> baaki models se bhi fayda nahi
      if (status === 401 || status === 403) {
        console.error('❌ API key galat hai ya access nahi hai');
        break;
      }

      cooldownUntil.set(model, Date.now() + cooldownFor(status));
    }
  }

  console.error('❌ All AI models failed. Last error:', lastError?.message);
  const finalErr = new Error('All models failed');
  finalErr.code = 'ALL_MODELS_FAILED';
  finalErr.cause = lastError;
  throw finalErr;
}

module.exports = { chat, getFirstMessage, RIYA_SYSTEM_PROMPT };