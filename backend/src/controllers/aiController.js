const AIChat = require('../models/AIChat');
const User = require('../models/User');
const botService = require('../services/botService');

// GET /api/ai/history
exports.getHistory = async (req, res) => {
  try {
    const user = req.user; // JWT se

    let messages = await AIChat.find({ uniqueId: user.uniqueId })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    // Agar pehli baar hai — Riya ka welcome message bhejo
    if (messages.length === 0) {
      const welcome = botService.getFirstMessage(user.uniqueId);

      const saved = await AIChat.create({
        userId: user.id,
        uniqueId: user.uniqueId,
        role: 'assistant',
        content: welcome,
      });

      messages = [saved];
    }

    res.json({
      success: true,
      data: messages.map((m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'Message khaali hai.' });
    }

    if (message.length > 2000) {
      return res
        .status(400)
        .json({ success: false, message: 'Message bahut lamba hai.' });
    }

    // User message save karo
    await AIChat.create({
      userId: user.id,
      uniqueId: user.uniqueId,
      role: 'user',
      content: message.trim(),
    });

    // Purani history lo (context ke liye)
    const history = await AIChat.find({ uniqueId: user.uniqueId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    history.reverse();

    // AI se reply lo
    let reply, tokens;
    try {
      const result = await botService.chat(message.trim());
      reply = result.reply;
      tokens = result.tokens;
    } catch (aiErr) {
      console.error('AI API error:', aiErr.message);

      // Fallback reply
      reply =
        'Arre, kuch technical problem ho gayi 🌸 Thodi der baad try karo na...';
      tokens = 0;
    }

    // Assistant ka message save karo
    const saved = await AIChat.create({
      userId: user.id,
      uniqueId: user.uniqueId,
      role: 'assistant',
      content: reply,
      tokens,
    });

    res.json({
      success: true,
      data: {
        _id: saved._id,
        role: 'assistant',
        content: reply,
        createdAt: saved.createdAt,
      },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/ai/history  (reset)
exports.clearHistory = async (req, res) => {
  try {
    const user = req.user;
    await AIChat.deleteMany({ uniqueId: user.uniqueId });
    res.json({ success: true, message: 'Chat clear ho gayi 🌸' });
  } catch (err) {
    console.error('AI clear error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};