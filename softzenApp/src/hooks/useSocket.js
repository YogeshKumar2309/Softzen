import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { api, SOCKET_URL } from '../lib/api';
import { playNotificationSound, showBrowserNotification } from '../lib/notify';

// Helper: user chat page par hai ya nahi
const isOnChatPage = () => window.location.pathname.startsWith('/chat');

// Riya ki ID
const RIYA_ID = 'riya_22';

export function useSocket() {
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;

    const oldSocket = useChatStore.getState().socket;
    if (oldSocket) oldSocket.disconnect();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    useChatStore.getState().setSocket(socket);

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      useChatStore.getState().setConnected(true);

      api
        .get('/message/conversations')
        .then((res) => {
          if (res.data.success) {
            useChatStore.getState().setConversations(res.data.data);
          }
        })
        .catch(() => {});
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      useChatStore.getState().setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      useChatStore.getState().setConnected(false);
    });

    socket.on('online_users', (users) => {
      useChatStore.getState().setOnlineUsers(users || []);
    });

    // ============================================================
    // ===== GENERAL =====
    // ============================================================
    socket.on('new_message', (m) => {
      console.log('📩 General:', m);
      const isOwn = m.senderId === user.uniqueId;

      const activeOnChatPage = isOnChatPage();
      const isCurrentChat =
        activeOnChatPage &&
        useChatStore.getState().activeChat === 'general';

      const windowActive = document.visibilityState === 'visible';

      useChatStore.getState().addMessage('general', m, isCurrentChat);

      console.log(
        '🟡 unread after general:',
        useChatStore.getState().unreadCounts
      );

      if (!isOwn && !(isCurrentChat && windowActive)) {
        playNotificationSound();
        showBrowserNotification(
          `#general — ${m.senderId}`,
          m.text,
          () => useChatStore.getState().setActiveChat('general')
        );
      }
    });

    // ============================================================
    // ===== DM (with Riya special handling) =====
    // ============================================================
    socket.on('new_private_message', (m) => {
      console.log('📩 DM:', m);

      const other = m.senderId === user.uniqueId ? m.receiverId : m.senderId;
      const isOwn = m.senderId === user.uniqueId;
      const isRiya = other === RIYA_ID;

      const activeOnChatPage = isOnChatPage();
      const isCurrentChat =
        activeOnChatPage && useChatStore.getState().activeChat === other;

      const windowActive = document.visibilityState === 'visible';

      // Message add + conversation update
      useChatStore.getState().addMessage(other, m, isCurrentChat);
      useChatStore
        .getState()
        .upsertConversation(other, m.text, m.senderId, m.createdAt);

      console.log(
        '🟡 unread after DM:',
        useChatStore.getState().unreadCounts
      );

      // ===== NOTIFICATION =====
      if (!isOwn && !(isCurrentChat && windowActive)) {
        playNotificationSound();

        // Riya ke liye special title + emoji
        const title = isRiya ? '🌸 Riya_22' : `💬 ${m.senderId}`;

        // Riya ke message ka preview — 60 characters tak
        const body =
          m.text.length > 80 ? m.text.slice(0, 80) + '...' : m.text;

        showBrowserNotification(title, body, () =>
          useChatStore.getState().setActiveChat(other)
        );
      }

      // Auto read mark agar wahi chat khuli hai
      if (isCurrentChat && !isOwn) {
        socket.emit('mark_read', { from: m.senderId });
      }
    });

    // ============================================================
    // ===== READ RECEIPTS =====
    // ============================================================
    socket.on('messages_read', ({ by }) => {
      useChatStore.getState().markMessagesAsRead(by);
    });

    // ============================================================
    // ===== TYPING =====
    // ============================================================
    socket.on('user_typing', ({ uniqueId, isTyping }) => {
      if (uniqueId !== user.uniqueId) {
        useChatStore.getState().setTyping('general', uniqueId, isTyping);
      }
    });

    socket.on('user_typing_private', ({ from, isTyping }) => {
      if (from !== user.uniqueId) {
        useChatStore.getState().setTyping(from, from, isTyping);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('online_users');
      socket.off('new_message');
      socket.off('new_private_message');
      socket.off('messages_read');
      socket.off('user_typing');
      socket.off('user_typing_private');
      socket.disconnect();
      useChatStore.getState().setSocket(null);
    };
  }, [token, user?.uniqueId]);

  // ===== Conversations Background Refresh =====
  useEffect(() => {
    if (!token) return;

    const fetch = () => {
      api
        .get('/message/conversations')
        .then((res) => {
          if (res.data.success) {
            useChatStore.getState().setConversations(res.data.data);
          }
        })
        .catch(() => {});
    };

    fetch();
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, [token]);
}