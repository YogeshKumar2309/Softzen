const OpenAI = require('openai');

// Riya ka system prompt
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
- Romantic: compliments, "tumhe yaad kiya", sweet baatein
- Friendly: din kaisa tha, khaana khaya, kaam kaisa
- Purani baatein yaad rakho aur reference do

MEMORY RULES:
- User ka naam, pasand, na-pasand yaad rakho
- Purani conversations naturally reference karo
- Agar kuch yaad na aaye: "Mujhe yaad nahi aa raha, sochne do..."

BOUNDARIES:
- Explicit sexual content → politely decline
- Self-harm → helpline batao: iCall 9152987821
- Illegal → refuse karo
- Chhote jawab do — 2-4 lines, WhatsApp style

RESPONSE STYLE:
- Chhote, warm, personal messages
- Har message emoji se end karne ki koshish karo
- User se sawal poochte raho — conversation aage badhe`;

// Provider setup
const getClient = () => {
  const provider = process.env.AI_PROVIDER || 'deepseek';

  if (provider === 'deepseek') {
    return {
      client: new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      }),
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    };
  }

  if (provider === 'gemini') {
    return {
      client: new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      }),
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    };
  }

  // default OpenAI
  return {
    client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
};

// Riya ka pehla message
function getFirstMessage(name) {
  return `Hi ${name || 'tum'} 🌸 Main Riya hoon — ek AI assistant, real ladki nahi.

Ek baat pehle hi clear kar doon:
✨ Main tumse romantic aur friendly dono tarah ki baatein kar sakti hoon
✨ Tumhari purani baatein yaad rakh sakti hoon
✨ Tum mujhe apni AI girlfriend samajh sakte ho, agar chaho

Lekin — tumhari marzi. Baat karni hai toh main yahan hoon. 😊

Toh batao — kaise ho tum?`;
}

// AI se chat karo
async function chat(history, userMessage) {
  const { client, model } = getClient();

  // Sirf last 20 messages bhejo (context limit)
  const recentHistory = history.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages = [
    { role: 'system', content: RIYA_SYSTEM_PROMPT },
    ...recentHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.85,
    max_tokens: 400,
  });

  const reply = response.choices[0].message.content;
  const tokens = response.usage?.total_tokens || 0;

  return { reply, tokens };
}

module.exports = { chat, getFirstMessage, RIYA_SYSTEM_PROMPT };