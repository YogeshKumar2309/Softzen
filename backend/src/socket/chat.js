const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const AIChat = require('../models/AIChat');
const User = require('../models/User');
const presence = require('./presence');
const aiService = require('../services/aiService');

const RIYA_ID = 'riya_22';

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
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

    socket.join('general');
    socket.join(`user:${uniqueId}`);

    // ===== Public message =====
    socket.on('send_message', async (data) => {
      try {
        const { text, roomId = 'general' } = data;
        if (!text?.trim() || text.length > 1000) return;

        const message = await Message.create({
          senderId: uniqueId,
          roomId,
          text: text.trim(),
        });

        io.to(roomId).emit('new_message', {
          _id: message._id,
          senderId: message.senderId,
          text: message.text,
          roomId: message.roomId,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('Send message error:', err);
      }
    });

    // ===== Private message (with Riya handling) =====
    socket.on('send_private_message', async (data) => {
      try {
        const { to, text } = data;
        if (!to || !text?.trim() || text.length > 2000) return;
        if (to === uniqueId) return;

        const receiver = to.toLowerCase();

        // ============ RIYA_22 SPECIAL HANDLING ============
        if (receiver === RIYA_ID) {
          const userMsg = await Message.create({
            senderId: uniqueId,
            receiverId: RIYA_ID,
            roomId: `dm:${[uniqueId, RIYA_ID].sort().join('_')}`,
            text: text.trim(),
          });

          emitToUser(uniqueId, 'new_private_message', {
            _id: userMsg._id,
            senderId: userMsg.senderId,
            receiverId: userMsg.receiverId,
            text: userMsg.text,
            createdAt: userMsg.createdAt,
          });

          // Typing indicator
          emitToUser(uniqueId, 'user_typing_private', {
            from: RIYA_ID,
            isTyping: true,
          });

          try {
            const userDoc = await User.findOne({ uniqueId });

            const riyaHistory = await AIChat.find({ uniqueId })
              .sort({ createdAt: -1 })
              .limit(20)
              .lean();
            riyaHistory.reverse();

            await AIChat.create({
              userId: userDoc?._id,
              uniqueId,
              role: 'user',
              content: text.trim(),
            });

            const { reply, tokens } = await aiService.chat(
              riyaHistory,
              text.trim()
            );

            await AIChat.create({
              userId: userDoc?._id,
              uniqueId,
              role: 'assistant',
              content: reply,
              tokens,
            });

            // Natural delay
            await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

            const riyaMsg = await Message.create({
              senderId: RIYA_ID,
              receiverId: uniqueId,
              roomId: `dm:${[uniqueId, RIYA_ID].sort().join('_')}`,
              text: reply,
            });

            emitToUser(uniqueId, 'user_typing_private', {
              from: RIYA_ID,
              isTyping: false,
            });

            emitToUser(uniqueId, 'new_private_message', {
              _id: riyaMsg._id,
              senderId: riyaMsg.senderId,
              receiverId: riyaMsg.receiverId,
              text: riyaMsg.text,
              createdAt: riyaMsg.createdAt,
            });
          } catch (aiErr) {
            console.error('Riya AI error:', aiErr.message);

            emitToUser(uniqueId, 'user_typing_private', {
              from: RIYA_ID,
              isTyping: false,
            });

            const fallback = await Message.create({
              senderId: RIYA_ID,
              receiverId: uniqueId,
              roomId: `dm:${[uniqueId, RIYA_ID].sort().join('_')}`,
              text: 'Arre, kuch problem ho gayi 🌸 Thodi der baad try karo na...',
            });

            emitToUser(uniqueId, 'new_private_message', {
              _id: fallback._id,
              senderId: fallback.senderId,
              receiverId: fallback.receiverId,
              text: fallback.text,
              createdAt: fallback.createdAt,
            });
          }

          return;
        }
        // ============ END RIYA HANDLING ============

        // ===== Normal DM =====
        const message = await Message.create({
          senderId: uniqueId,
          receiverId: receiver,
          roomId: `dm:${[uniqueId, receiver].sort().join('_')}`,
          text: text.trim(),
        });

        const payload = {
          _id: message._id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          createdAt: message.createdAt,
        };

        emitToUser(uniqueId, 'new_private_message', payload);
        if (receiver !== uniqueId) {
          emitToUser(receiver, 'new_private_message', payload);
        }
      } catch (err) {
        console.error('Send private error:', err);
      }
    });

    // ===== Typing =====
    socket.on('typing', ({ roomId = 'general', isTyping }) => {
      socket.to(roomId).emit('user_typing', { uniqueId, isTyping });
    });

    socket.on('typing_private', ({ to, isTyping }) => {
      if (!to) return;
      if (to.toLowerCase() === RIYA_ID) return; // Riya ko typing mat bhejo
      emitToUser(to.toLowerCase(), 'user_typing_private', {
        from: uniqueId,
        isTyping,
      });
    });

    // ===== Mark as read =====
    socket.on('mark_read', async ({ from }) => {
      try {
        if (!from) return;
        const sender = from.toLowerCase();

        const result = await Message.updateMany(
          { senderId: sender, receiverId: uniqueId, read: false },
          { $set: { read: true } }
        );

        if (result.modifiedCount > 0) {
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