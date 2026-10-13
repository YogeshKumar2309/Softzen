const OpenAI = require('openai');

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const CONFIG = {
  temperature: 0.9,
  // Reasoning models (Nemotron etc.) thinking me tokens kharch kar sakte hain.
  maxTokens: Number(process.env.AI_MAX_TOKENS) || 300,
  timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 20000,
  historyLimit: 20,
  maxMessageChars: 1000,
  // Free tier ki limit poore API key pe lagti hai (per user nahi),
  // isliye ek saath bahut saari requests mat bhejo.
  maxConcurrent: Number(process.env.AI_MAX_CONCURRENT) || 3,
  // Sab models fail hone pe kitni baar poori list dobara try karni hai
  rounds: Number(process.env.AI_RETRY_ROUNDS) || 2,
  retryDelayMs: Number(process.env.AI_RETRY_DELAY_MS) || 1500,
};

// Free models disappear often -> list fresh rakho, aur end me `openrouter/free`
// (router jo koi bhi available free model chun leta hai).
const DEFAULT_FREE_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free', // slug verify kar lena: openrouter.ai/models (free filter)
  'openrouter/free',
];

// Ye router hai, ise cooldown me mat daalo
const NEVER_COOLDOWN = new Set(['openrouter/free']);

// Controller me ye reply dikha sakte ho jab ALL_MODELS_FAILED aaye
const FALLBACK_REPLY = 'Riya thodi busy hai abhi 🌸 Ek minute baad baat karein?';

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
  // Fallback hum khud sambhalte hain, isliye SDK retries band
  // (warna timeout x retries x models = bahut lamba wait).
  const common = { timeout: CONFIG.timeoutMs, maxRetries: 0 };

  if (provider === 'openrouter') {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY missing in .env');

    const csv = (process.env.OPENROUTER_MODELS || '').split(',');
    const single = [process.env.OPENROUTER_MODEL];
    // Optional sasta paid model, sabse last me: free sab fail ho to bhi Riya chale
    const paid = [process.env.OPENROUTER_FALLBACK_MODEL];

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
      // priority: OPENROUTER_MODELS > OPENROUTER_MODEL > defaults > paid fallback
      models: parseModelList(csv, single, DEFAULT_FREE_MODELS, paid),
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
/* Cooldown (dead/rate-limited models ko baar-baar try nahi)           */
/* ------------------------------------------------------------------ */

const cooldownUntil = new Map(); // model -> timestamp
const reasoningUnsupported = new Set(); // models jinhone `reasoning` param reject kiya

function cooldownFor(status) {
  if (status === 404 || status === 402) return 30 * 60 * 1000; // removed / credits
  if (status === 429) return 60 * 1000; // rate limit
  return 30 * 1000; // timeout, 5xx, empty reply
}

function pickCandidates(models) {
  const now = Date.now();
  const active = models.filter((m) => (cooldownUntil.get(m) || 0) <= now);
  // Agar sab cooldown me hain, to phir bhi sab try karo
  return active.length ? active : models;
}

/* ------------------------------------------------------------------ */
/* Concurrency control                                                 */
/* ------------------------------------------------------------------ */

// 1) Per-user queue: ek user ke messages order me ek ek karke process hon
const userQueues = new Map();

function runExclusive(key, task) {
  if (!key) return task();
  const prev = userQueues.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(task);
  userQueues.set(key, next);
  next
    .finally(() => {
      if (userQueues.get(key) === next) userQueues.delete(key);
    })
    .catch(() => {});
  return next;
}

// 2) Global limit: ek saath max N AI calls (free tier 429 se bachne ke liye)
let activeCalls = 0;
const waiters = [];

async function acquire() {
  if (activeCalls < CONFIG.maxConcurrent) {
    activeCalls++;
    return;
  }
  await new Promise((resolve) => waiters.push(resolve));
  activeCalls++;
}

function release() {
  activeCalls--;
  const next = waiters.shift();
  if (next) next();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Retry ke layak errors: rate limit, server error, timeout, empty reply
function isRetryable(err) {
  const s = err?.status || 0;
  return s === 0 || s === 408 || s === 429 || s >= 500;
}

/* ------------------------------------------------------------------ */
/* One model call (reasoning param auto-fallback ke saath)             */
/* ------------------------------------------------------------------ */

async function callModel({ client, provider, model, messages }) {
  const body = {
    model,
    messages,
    temperature: CONFIG.temperature,
    max_tokens: CONFIG.maxTokens,
  };

  const useReasoning = provider === 'openrouter' && !reasoningUnsupported.has(model);
  if (useReasoning) body.reasoning = { effort: 'low', exclude: true };

  try {
    return await client.chat.completions.create(body);
  } catch (err) {
    // Model ne `reasoning` param reject kiya -> bina uske turant dobara try
    if (useReasoning && err.status === 400) {
      console.warn(`ℹ️ ${model} ne reasoning param reject kiya, bina uske retry`);
      reasoningUnsupported.add(model);
      delete body.reasoning;
      return client.chat.completions.create(body);
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

async function doChat(history, text) {
  const { client, models, provider } = getClient();
  const messages = buildMessages(history, text);

  let lastError = null;
  let fatal = false;

  for (let round = 1; round <= CONFIG.rounds && !fatal; round++) {
    for (const model of pickCandidates(models)) {
      const started = Date.now();
      try {
        console.log(`🤖 Trying model: ${model}${round > 1 ? ` (round ${round})` : ''}`);

        const response = await callModel({ client, provider, model, messages });
        const reply = cleanReply(response.choices?.[0]?.message?.content);

        if (!reply) {
          const emptyErr = new Error(
            `Empty reply (finish_reason: ${response.choices?.[0]?.finish_reason || 'unknown'})`
          );
          emptyErr.status = 0;
          throw emptyErr;
        }

        const tokens = response.usage?.total_tokens || 0;
        console.log(`✅ ${model} (${Date.now() - started}ms, ${tokens} tokens)`);
        return { reply, tokens, model };
      } catch (err) {
        const status = err.status || 0;
        console.warn(
          `⚠️ ${model} failed [${status || err.name}]: ${(err.message || '').slice(0, 120)}`
        );
        lastError = err;

        // Key galat ya access nahi -> baaki models se bhi fayda nahi
        if (status === 401 || status === 403) {
          console.error('❌ API key galat hai ya access nahi hai');
          fatal = true;
          break;
        }

        if (!NEVER_COOLDOWN.has(model)) {
          cooldownUntil.set(model, Date.now() + cooldownFor(status));
        }
      }
    }

    // Poori list fail hui: thoda ruk ke dobara (sirf temporary errors pe)
    if (!fatal && round < CONFIG.rounds && isRetryable(lastError)) {
      console.warn(`⏳ Sab models fail, ${CONFIG.retryDelayMs}ms baad dobara try...`);
      await sleep(CONFIG.retryDelayMs);
    } else {
      break;
    }
  }

  console.error('❌ All AI models failed. Last error:', lastError?.message);
  const finalErr = new Error('All models failed');
  finalErr.code = 'ALL_MODELS_FAILED';
  finalErr.cause = lastError;
  throw finalErr;
}

/**
 * @param {Array}  history      [{role, content}, ...]
 * @param {string} userMessage  user ka naya message
 * @param {string} [userId]     optional: same user ke messages queue me chalenge
 */
async function chat(history, userMessage, userId) {
  const text = String(userMessage ?? '').trim();
  if (!text) throw new Error('Empty message');

  return runExclusive(userId ? String(userId) : null, async () => {
    await acquire();
    try {
      return await doChat(history, text);
    } finally {
      release();
    }
  });
}

module.exports = { chat, getFirstMessage, RIYA_SYSTEM_PROMPT, FALLBACK_REPLY };