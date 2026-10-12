import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { api, SOCKET_URL } from '../lib/api';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';

function ChatPage() {
  const { user, token } = useAuthStore();
  const {
    setSocket,
    setConnected,
    setOnlineUsers,
    addMessage,
    setMessages,
    setTyping,
    activeChat,
  } = useChatStore();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // ===== Socket connect =====
  useEffect(() => {
    if (!token || !user) return;

    const oldSocket = useChatStore.getState().socket;
    if (oldSocket) oldSocket.disconnect();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    setSocket(socket);

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
      setConnected(false);
    });

    socket.on('online_users', (users) => {
      setOnlineUsers(users || []);
    });

    socket.on('new_message', (m) => {
      console.log('📩 General:', m);
      addMessage('general', m);
    });

    socket.on('new_private_message', (m) => {
      console.log('📩 DM:', m);
      const other =
        m.senderId === user.uniqueId ? m.receiverId : m.senderId;
      addMessage(other, m);

      // ✅ Naya DM aaya — agar wahi chat open hai to turant read mark karo
      const currentChat = useChatStore.getState().activeChat;
      if (currentChat === m.senderId && m.senderId !== user.uniqueId) {
        socket.emit('mark_read', { from: m.senderId });
      }
    });

    // ✅ Read receipts
    socket.on('messages_read', ({ by, count }) => {
      console.log(`✅ ${by} ne ${count} messages read kiye`);
      useChatStore.getState().markMessagesAsRead(by);
    });

    socket.on('user_typing', ({ uniqueId, isTyping }) => {
      if (uniqueId !== user.uniqueId) {
        setTyping('general', uniqueId, isTyping);
      }
    });

    socket.on('user_typing_private', ({ from, isTyping }) => {
      if (from !== user.uniqueId) {
        setTyping(from, from, isTyping);
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
      setSocket(null);
    };
  }, [token, user?.uniqueId]);

  // ===== Active chat change → messages load + read mark =====
  useEffect(() => {
    if (!token || !activeChat) return;

    const endpoint =
      activeChat === 'general'
        ? '/message/general?limit=50'
        : `/message/dm/${activeChat}?limit=50`;

    api
      .get(endpoint)
      .then((res) => {
        if (res.data.success) {
          setMessages(activeChat, res.data.data);

          // ✅ DM ho to read mark karo
          if (activeChat !== 'general') {
            const socket = useChatStore.getState().socket;
            if (socket) {
              socket.emit('mark_read', { from: activeChat });
            }
          }
        }
      })
      .catch((err) => console.error('Messages load fail:', err));
  }, [activeChat, token]);

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
        />
      )}

      <main className="flex-1 min-w-0">
        <ChatWindow onMenuClick={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}

export default ChatPage;