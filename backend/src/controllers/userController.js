const User = require('../models/User');

exports.registerUser = async (req, res) => {
  try {
    const { uniqueId, password, message } = req.body;

    if (!uniqueId || !password) {
      return res.status(400).json({ success: false, message: 'Unique ID and password are required' });
    }

    if (uniqueId.length < 3) {
      return res.status(400).json({ success: false, message: 'Unique ID must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ uniqueId: uniqueId.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Ye Unique ID already liya ja chuka hai. Kuch aur try karein.' });
    }

    const user = await User.create({ uniqueId, password, message });

    // Total count
    const totalMembers = await User.countDocuments();

    res.status(201).json({
      success: true,
      message: 'Aap safaltapoorvak jud gaye hain! 🎉',
      data: {
        uniqueId: user.uniqueId,
        level: user.level,
        totalMembers
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

exports.getMemberCount = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments();
    res.status(200).json({ success: true, totalMembers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};