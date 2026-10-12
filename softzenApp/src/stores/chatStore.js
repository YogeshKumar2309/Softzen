import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  socket: null,
  activeChat: 'general',
  messagesByChat: {},
  onlineUsers: [],
  typingByChat: {},
  connected: false,

  setSocket: (socket) => set({ socket }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  setConnected: (v) => set({ connected: v }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addMessage: (chat, message) => {
    const key = chat === 'general' ? 'general' : `dm:${chat}`;
    set((s) => {
      const existing = s.messagesByChat[key] || [];
      if (message._id && existing.some((m) => m._id === message._id)) {
        return s;
      }
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [key]: [...existing, message],
        },
      };
    });
  },

  setMessages: (chat, messages) => {
    const key = chat === 'general' ? 'general' : `dm:${chat}`;
    set((s) => ({
      messagesByChat: { ...s.messagesByChat, [key]: messages },
    }));
  },

  setTyping: (chat, user, isTyping) => {
    const key = chat === 'general' ? 'general' : `dm:${chat}`;
    set((s) => {
      const current = s.typingByChat[key];
      let next;

      if (chat === 'general') {
        const list = Array.isArray(current) ? current : [];
        next = isTyping
          ? list.includes(user)
            ? list
            : [...list, user]
          : list.filter((u) => u !== user);
      } else {
        next = isTyping;
      }

      return {
        typingByChat: { ...s.typingByChat, [key]: next },
      };
    });
  },

  // ✅ NEW: jab dusre user ne messages padh liye
  markMessagesAsRead: (chatWith) => {
    const key = `dm:${chatWith}`;
    set((s) => {
      const msgs = s.messagesByChat[key];
      if (!msgs) return s;

      const updated = msgs.map((m) =>
        m.receiverId === chatWith && !m.read ? { ...m, read: true } : m
      );

      return {
        messagesByChat: { ...s.messagesByChat, [key]: updated },
      };
    });
  },
}));