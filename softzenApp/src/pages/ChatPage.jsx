import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { api } from '../lib/api';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';

function ChatPage() {
  const { user, token } = useAuthStore();
  const { setMessages, activeChat } = useChatStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

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

          if (activeChat !== 'general') {
            const socket = useChatStore.getState().socket;
            if (socket) socket.emit('mark_read', { from: activeChat });
          }
        }
      })
      .catch((err) => console.error('Messages load fail:', err));
  }, [activeChat, token]);

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar — mobile slide-in, desktop fixed */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:transform-none`}
      >
        <ChatSidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
        />
      )}

      {/* Main chat window */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <ChatWindow onMenuClick={() => setSidebarOpen(true)} />
      </main>
    </div>
  );
}

export default ChatPage;