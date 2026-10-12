const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    const { uniqueId, password, message } = req.body;

    if (!uniqueId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID aur Password dono zaroori hain.'
      });
    }

    const id = uniqueId.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID me sirf letters, numbers aur underscore (_) allowed hai (3-20).'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password kam se kam 6 characters ka hona chahiye.'
      });
    }

    const existing = await User.findOne({ uniqueId: id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ye Unique ID pehle se li gayi hai. Kuch aur try karein.'
      });
    }

    const user = await User.create({ uniqueId: id, password, message });
    const totalMembers = await User.countDocuments();

    res.status(201).json({
      success: true,
      message: `Badhai ho ${user.uniqueId}! Aap Level 1 founding member ban gaye hain 🎉`,
      data: {
        uniqueId: user.uniqueId,
        level: user.level,
        totalMembers
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Thodi der baad try karein.'
    });
  }
};

exports.getMemberCount = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments();
    res.status(200).json({ success: true, totalMembers });
  } catch (err) {
    console.error('Count error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};