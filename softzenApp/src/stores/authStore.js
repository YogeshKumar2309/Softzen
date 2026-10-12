import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  socket: null,
  activeChat: 'general',
  messagesByChat: {},
  onlineUsers: [],
  typingByChat: {},
  connected: false,
  unreadCounts: {},
  conversations: [],

  setSocket: (socket) => set({ socket }),

  setActiveChat: (chat) => {
    set({ activeChat: chat });
    const key = chat === 'general' ? 'general' : `dm:${chat}`;
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [key]: 0 },
    }));
  },

  setConnected: (v) => set({ connected: v }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setConversations: (list) => {
    const normalized = (list || []).map((c) => ({
      uniqueId: c._id,
      lastMessage: c.lastMessage,
      lastMessageAt: c.lastMessageAt,
      lastSender: c.lastSender,
    }));
    set({ conversations: normalized });
  },

  upsertConversation: (uniqueId, text, senderId, createdAt) => {
    set((s) => {
      const existing = s.conversations.filter((c) => c.uniqueId !== uniqueId);
      const updated = [
        {
          uniqueId,
          lastMessage: text,
          lastMessageAt: createdAt || new Date().toISOString(),
          lastSender: senderId,
        },
        ...existing,
      ];
      return { conversations: updated };
    });
  },

  addMessage: (chat, message, isActiveChat = false) => {
    const key = chat === 'general' ? 'general' : `dm:${chat}`;
    set((s) => {
      const existing = s.messagesByChat[key] || [];
      if (message._id && existing.some((m) => m._id === message._id)) {
        return s;
      }

      const newUnread = { ...s.unreadCounts };
      if (!isActiveChat) {
        newUnread[key] = (newUnread[key] || 0) + 1;
      }

      return {
        messagesByChat: {
          ...s.messagesByChat,
          [key]: [...existing, message],
        },
        unreadCounts: newUnread,
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

  clearAll: () =>
    set({
      messagesByChat: {},
      unreadCounts: {},
      conversations: [],
      typingByChat: {},
      activeChat: 'general',
      onlineUsers: [],
    }),

  getTotalUnread: () => {
    const counts = get().unreadCounts;
    return Object.values(counts).reduce((a, b) => a + b, 0);
  },
}));

// Debug — browser console se access karne ke liye
if (typeof window !== 'undefined') {
  window.__softzenStore = useChatStore;
}