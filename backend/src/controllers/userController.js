const User = require('../models/User');
const presence = require('../socket/presence');
const jwt = require('jsonwebtoken');

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


// POST /api/user/login
exports.loginUser = async (req, res) => {
  try {
    const { uniqueId, password } = req.body;

    if (!uniqueId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Unique ID aur Password dono chahiye.'
      });
    }

    const id = uniqueId.trim().toLowerCase();
    const user = await User.findOne({ uniqueId: id });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Galat ID ya password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Galat ID ya password.'
      });
    }

    // JWT token banao (7 din ke liye valid)
    const token = jwt.sign(
      { id: user._id, uniqueId: user.uniqueId, level: user.level },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: `Welcome back ${user.uniqueId}! 🎉`,
      data: {
        token,
        uniqueId: user.uniqueId,
        level: user.level
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
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


exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const search = (req.query.search || '').trim().toLowerCase();
    const level = req.query.level ? parseInt(req.query.level) : null;
    const status = req.query.status; // 'online' | 'offline' | undefined
    const sortBy = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const filter = {};
    if (search) {
      filter.uniqueId = { $regex: search, $options: 'i' };
    }
    if (level && [1, 2, 3].includes(level)) {
      filter.level = level;
    }

    // Online/offline filter
    const onlineIds = presence.getOnlineIds();
    if (status === 'online') {
      filter.uniqueId = {
        ...(filter.uniqueId || {}),
        $in: onlineIds.length ? onlineIds : ['___none___']
      };
    } else if (status === 'offline') {
      filter.uniqueId = {
        ...(filter.uniqueId || {}),
        $nin: onlineIds
      };
    }

    const allowedSorts = ['createdAt', 'uniqueId', 'level', 'tokens'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
    const skip = (page - 1) * limit;

    const [users, totalMembers] = await Promise.all([
      User.find(filter)
        .select('uniqueId level tokens message createdAt')
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalMembers / limit) || 1;

    // Har user ke saath isOnline bhi bhejo
    const enriched = users.map(u => ({
      ...u,
      isOnline: presence.isOnline(u.uniqueId)
    }));

    res.status(200).json({
      success: true,
      onlineCount: presence.getCount(),
      pagination: {
        currentPage: page,
        perPage: limit,
        totalMembers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      data: enriched
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// GET /api/user/online - kitne online hain + list
exports.getOnlineUsers = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: presence.getCount(),
      data: presence.getOnlineList()
    });
  } catch (err) {
    console.error('Online users error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};