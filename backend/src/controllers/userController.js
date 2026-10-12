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


// GET /api/user/all?page=1&limit=20&key=ADMIN_KEY
// Pagination ke saath saare users (password ke bina)
exports.getAllUsers = async (req, res) => {
  try {
    // ===== Admin key check =====
    const adminKey = req.headers['x-admin-key'] || req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin key required.'
      });
    }

    // ===== Pagination params =====
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;

    // Validation
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 100) limit = 100; // max 100 per page

    const skip = (page - 1) * limit;

    // ===== Sort options =====
    const sortBy = req.query.sort || 'createdAt';  // createdAt | uniqueId | level
    const order = req.query.order === 'desc' ? -1 : 1;

    const allowedSorts = ['createdAt', 'uniqueId', 'level'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';

    // ===== DB queries =====
    const totalMembers = await User.countDocuments();
    const totalPages = Math.ceil(totalMembers / limit);

    const users = await User.find({})
      .select('-password -__v')
      .sort({ [sortField]: order })
      .skip(skip)
      .limit(limit);

    // ===== Response =====
    res.status(200).json({
      success: true,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalMembers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      },
      data: users.map(u => ({
        uniqueId: u.uniqueId,
        message: u.message || '(koi message nahi)',
        level: u.level,
        joinedAt: u.createdAt
      }))
    });
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};