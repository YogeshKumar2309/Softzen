import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

function ChatSidebar({ onClose }) {
  const {
    activeChat,
    setActiveChat,
    onlineUsers,
    conversations,
    messagesByChat,
    unreadCounts,
  } = useChatStore();
  const me = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const onlineIds = new Set(onlineUsers.map((u) => u.uniqueId));

  const conversationMap = new Map();

  conversations.forEach((c) => {
    if (c.uniqueId !== me?.uniqueId && c.uniqueId !== 'riya_22') {
      conversationMap.set(c.uniqueId, { ...c });
    }
  });

  Object.keys(messagesByChat).forEach((key) => {
    if (key.startsWith('dm:')) {
      const u = key.slice(3);
      if (u === me?.uniqueId || u === 'riya_22') return;

      const msgs = messagesByChat[key];
      const last = msgs?.[msgs.length - 1];

      if (!conversationMap.has(u)) {
        conversationMap.set(u, {
          uniqueId: u,
          lastMessage: last?.text || 'Chat shuru karo',
          lastMessageAt: last?.createdAt || new Date().toISOString(),
          lastSender: last?.senderId,
        });
      }
    }
  });

  onlineUsers.forEach((u) => {
    if (
      u.uniqueId !== me?.uniqueId &&
      u.uniqueId !== 'riya_22' &&
      !conversationMap.has(u.uniqueId)
    ) {
      conversationMap.set(u.uniqueId, {
        uniqueId: u.uniqueId,
        lastMessage: 'Chat shuru karo',
        lastMessageAt: new Date().toISOString(),
        lastSender: null,
      });
    }
  });

  const sorted = Array.from(conversationMap.values()).sort((a, b) => {
    const ao = onlineIds.has(a.uniqueId);
    const bo = onlineIds.has(b.uniqueId);
    if (ao !== bo) return bo - ao;
    return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
  });

  const handleSelect = (chat) => {
    setActiveChat(chat);
    onClose?.();
  };

  const goHome = () => {
    navigate('/');
    onClose?.();
  };

  const generalUnread = unreadCounts['general'] || 0;
  const riyaUnread = unreadCounts['dm:riya_22'] || 0;

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now - d) / 1000 / 60 / 60;

    if (diffH < 24) {
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffH < 24 * 7) {
      return d.toLocaleDateString('en-IN', { weekday: 'short' });
    }
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Kya last message read ho chuka hai?
  const isLastMessageRead = (uniqueId) => {
    const key = `dm:${uniqueId}`;
    const msgs = messagesByChat[key] || [];
    if (msgs.length === 0) return false;

    // Last message jo maine bheja hai
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].senderId === me?.uniqueId) {
        return msgs[i].read === true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* ===== Top Header (Home + Profile) ===== */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={goHome}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-xl shrink-0"
            title="Home"
          >
            🏠
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold shrink-0">
            {me?.uniqueId?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {me?.uniqueId}
            </div>
            <div className="text-xs text-green-500">
              ● {onlineUsers.length} online
            </div>
          </div>
        </div>
      </div>

      {/* ===== Chat List ===== */}
      <div className="flex-1 overflow-y-auto">
        {/* General */}
        <button
          onClick={() => handleSelect('general')}
          className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 transition-colors ${
            activeChat === 'general'
              ? 'bg-brand-50 border-l-4 border-l-brand-500'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl shrink-0">
            #
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900 truncate">
                General
              </div>
              {generalUnread > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-md animate-pulse" />
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Sab log yahan message kar sakte hain
            </div>
          </div>
        </button>

        {/* 🌸 Riya_22 */}
        <button
          onClick={() => handleSelect('riya_22')}
          className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-100 transition-colors ${
            activeChat === 'riya_22'
              ? 'bg-pink-50 border-l-4 border-l-pink-500'
              : 'hover:bg-pink-50/50'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-2xl">
              🌸
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900 truncate">
                Riya_22
              </div>
              <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold">
                AI
              </span>
              {riyaUnread > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-md animate-pulse" />
              )}
            </div>
            <div className="text-xs text-pink-600 truncate">
              Hamesha baat karne ke liye ready 🌸
            </div>
          </div>
        </button>

        {/* DM label */}
        {sorted.length > 0 && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Direct Messages
          </div>
        )}

        {/* DM list */}
        {sorted.map((c) => {
          const isOnline = onlineIds.has(c.uniqueId);
          const isActive = activeChat === c.uniqueId;
          const unread = unreadCounts[`dm:${c.uniqueId}`] || 0;
          const isOwnLast = c.lastSender === me?.uniqueId;
          const lastRead = isOwnLast ? isLastMessageRead(c.uniqueId) : false;

          return (
            <button
              key={c.uniqueId}
              onClick={() => handleSelect(c.uniqueId)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                isActive
                  ? 'bg-brand-50 border-l-4 border-l-brand-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                  {c.uniqueId.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 truncate text-sm flex-1">
                    {c.uniqueId}
                  </div>

                  {unread > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0 shadow-md animate-pulse" />
                  )}

                  <div className="text-[10px] text-gray-400 shrink-0">
                    {formatTime(c.lastMessageAt)}
                  </div>
                </div>
                <div
                  className={`text-xs truncate mt-0.5 flex items-center gap-1 ${
                    unread > 0
                      ? 'font-semibold text-gray-800'
                      : 'text-gray-500'
                  }`}
                >
                  {isOwnLast && (
                    <span
                      className={`shrink-0 ${
                        lastRead ? 'text-sky-500 font-bold' : 'text-gray-400'
                      }`}
                    >
                      {lastRead ? '✓✓' : '✓'}
                    </span>
                  )}
                  <span className="truncate">{c.lastMessage}</span>
                </div>
              </div>
            </button>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-8 px-4">
            Abhi koi DM nahi. Members page se kisi user par click karke shuru karo.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;