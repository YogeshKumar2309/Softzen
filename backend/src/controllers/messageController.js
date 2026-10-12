const Message = require('../models/Message');

// GET /api/message/:roomId?limit=50&before=<id>
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    let query = { roomId };
    if (before) {
      const beforeMsg = await Message.findById(before);
      if (beforeMsg) query.createdAt = { $lt: beforeMsg.createdAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/message/dm/:otherUser?limit=50
// User aur otherUser ke beech ki private chat
exports.getPrivateMessages = async (req, res) => {
  try {
    const me = req.user.uniqueId; // JWT se aata hai
    const other = req.params.otherUser.toLowerCase();
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.reverse()
    });
  } catch (err) {
    console.error('Get DM error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/message/conversations
// Meri saari private chats ki list (kis se kitne messages)
exports.getConversations = async (req, res) => {
  try {
    const me = req.user.uniqueId;

    const convos = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: me, receiverId: { $ne: null } },
            { receiverId: me }
          ]
        }
      },
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ['$senderId', me] }, '$receiverId', '$senderId']
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$otherUser',
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
          lastSender: { $first: '$senderId' }
        }
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 }
    ]);

    res.status(200).json({ success: true, data: convos });
  } catch (err) {
    console.error('Conversations error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};


// POST /api/message/read/:otherUser
// DM ke saare unread messages ko read mark karo
exports.markAsRead = async (req, res) => {
  try {
    const me = req.user.uniqueId;
    const other = req.params.otherUser.toLowerCase();

    const result = await Message.updateMany(
      {
        senderId: other,
        receiverId: me,
        read: false,
      },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};