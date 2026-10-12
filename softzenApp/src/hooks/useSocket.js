import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { api, SOCKET_URL } from '../lib/api';
import { playNotificationSound, showBrowserNotification } from '../lib/notify';

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

      api.get('/message/conversations').then((res) => {
        if (res.data.success) {
          useChatStore.getState().setConversations(res.data.data);
        }
      }).catch(() => {});
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

    socket.on('new_message', (m) => {
      console.log('📩 General:', m);
      const isOwn = m.senderId === user.uniqueId;
      const isCurrentChat = useChatStore.getState().activeChat === 'general';
      const windowActive = document.visibilityState === 'visible';

      useChatStore.getState().addMessage('general', m, isCurrentChat);

      if (!isOwn && !(isCurrentChat && windowActive)) {
        playNotificationSound();
        showBrowserNotification(
          `#general — ${m.senderId}`,
          m.text,
          () => useChatStore.getState().setActiveChat('general')
        );
      }
    });

    socket.on('new_private_message', (m) => {
      console.log('📩 DM:', m);
      const other = m.senderId === user.uniqueId ? m.receiverId : m.senderId;
      const isOwn = m.senderId === user.uniqueId;
      const isCurrentChat = useChatStore.getState().activeChat === other;
      const windowActive = document.visibilityState === 'visible';

      useChatStore.getState().addMessage(other, m, isCurrentChat);
      useChatStore.getState().upsertConversation(other, m.text, m.senderId, m.createdAt);

      console.log('🟡 After add — unreadCounts:', useChatStore.getState().unreadCounts);

      if (!isOwn && !(isCurrentChat && windowActive)) {
        playNotificationSound();
        showBrowserNotification(
          `💬 ${m.senderId}`,
          m.text,
          () => useChatStore.getState().setActiveChat(other)
        );
      }

      if (isCurrentChat && !isOwn) {
        socket.emit('mark_read', { from: m.senderId });
      }
    });

    socket.on('messages_read', ({ by }) => {
      useChatStore.getState().markMessagesAsRead(by);
    });

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

  useEffect(() => {
    if (!token) return;
    const fetch = () => {
      api.get('/message/conversations').then((res) => {
        if (res.data.success) useChatStore.getState().setConversations(res.data.data);
      }).catch(() => {});
    };
    fetch();
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, [token]);
}