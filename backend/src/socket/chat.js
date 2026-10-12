const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const presence = require('./presence');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token nahi mila'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Token invalid'));
    }
  });

  // User ke saare sockets me event bhejo
  const emitToUser = (uniqueId, event, data) => {
    const socketIds = presence.getSocketIds(uniqueId);
    socketIds.forEach((sid) => {
      io.to(sid).emit(event, data);
    });
  };

  io.on('connection', (socket) => {
    const { uniqueId, level } = socket.user;
    console.log(`🟢 Connected: ${uniqueId}`);

    presence.addUser(uniqueId, level, socket.id);

    io.emit('online_users', presence.getOnlineList());
    io.emit('online_count', presence.getCount());

    // Default public room
    socket.join('general');
    // Apna personal room join karo (private messages ke liye)
    socket.join(`user:${uniqueId}`);

    // ===== Public message =====
    socket.on('send_message', async (data) => {
      try {
        const { text, roomId = 'general' } = data;
        if (!text?.trim() || text.length > 1000) return;

        const message = await Message.create({
          senderId: uniqueId,
          roomId,
          text: text.trim()
        });

        io.to(roomId).emit('new_message', {
          _id: message._id,
          senderId: message.senderId,
          text: message.text,
          roomId: message.roomId,
          createdAt: message.createdAt
        });
      } catch (err) {
        console.error('Send message error:', err);
      }
    });

    // ===== Private message (DM) =====
    socket.on('send_private_message', async (data) => {
      try {
        const { to, text } = data;
        if (!to || !text?.trim() || text.length > 1000) return;
        if (to === uniqueId) return; // khud ko nahi

        const receiver = to.toLowerCase();

        const message = await Message.create({
          senderId: uniqueId,
          receiverId: receiver,
          roomId: `dm:${[uniqueId, receiver].sort().join('_')}`,
          text: text.trim()
        });

        const payload = {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          createdAt: message.createdAt
        };

        // Sender ko echo
        emitToUser(uniqueId, 'new_private_message', payload);
        // Receiver ko
        if (receiver !== uniqueId) {
          emitToUser(receiver, 'new_private_message', payload);
        }
      } catch (err) {
        console.error('Send private error:', err);
      }
    });

    // ===== Typing (public) =====
    socket.on('typing', ({ roomId = 'general', isTyping }) => {
      socket.to(roomId).emit('user_typing', { uniqueId, isTyping });
    });

    // ===== Typing (private) =====
    socket.on('typing_private', ({ to, isTyping }) => {
      if (!to) return;
      emitToUser(to.toLowerCase(), 'user_typing_private', {
        from: uniqueId,
        isTyping
      });
    });

    // ===== Mark messages as read (DM) =====
socket.on('mark_read', async ({ from }) => {
  try {
    if (!from) return;

    const sender = from.toLowerCase();

    // DB me read mark karo
    const result = await Message.updateMany(
      {
        senderId: sender,
        receiverId: uniqueId,
        read: false,
      },
      { $set: { read: true } }
    );

    if (result.modifiedCount > 0) {
      // Original sender ko notify karo
      emitToUser(sender, 'messages_read', {
        by: uniqueId,
        count: result.modifiedCount,
      });
    }
  } catch (err) {
    console.error('Mark read error:', err);
  }
});

    socket.on('join_room', (roomId) => socket.join(roomId));

    socket.on('disconnect', () => {
      console.log(`🔴 Disconnected: ${uniqueId}`);
      presence.removeUser(uniqueId, socket.id);
      io.emit('online_users', presence.getOnlineList());
      io.emit('online_count', presence.getCount());
    });
  });

  return io;
};

module.exports = { initSocket };