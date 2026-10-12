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

  const onlineIds = new Set(onlineUsers.map((u) => u.uniqueId));

  // Conversations set me merge karo (localStorage + API)
  const conversationMap = new Map();

  // Pehle conversations se
  conversations.forEach((c) => {
    if (c.uniqueId !== me?.uniqueId) {
      conversationMap.set(c.uniqueId, { ...c });
    }
  });

  // Phir messagesByChat se bhi add karo (agar koi missing ho)
  Object.keys(messagesByChat).forEach((key) => {
    if (key.startsWith('dm:')) {
      const u = key.slice(3);
      if (u === me?.uniqueId) return;

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

  // Online users bhi include karo
  onlineUsers.forEach((u) => {
    if (u.uniqueId !== me?.uniqueId && !conversationMap.has(u.uniqueId)) {
      conversationMap.set(u.uniqueId, {
        uniqueId: u.uniqueId,
        lastMessage: 'Chat shuru karo',
        lastMessageAt: new Date().toISOString(),
        lastSender: null,
      });
    }
  });

  // Sort: online first, phir latest message time
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

  const generalUnread = unreadCounts['general'] || 0;

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffH = diffMs / 1000 / 60 / 60;

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

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold">
            {me?.uniqueId?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {me?.uniqueId}
            </div>
            <div className="text-xs text-green-500">
              ● {onlineUsers.length} online
            </div>
          </div>
        </div>
      </div>

      {/* Chats list */}
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

        {sorted.length > 0 && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Direct Messages
          </div>
        )}

        {sorted.map((c) => {
          const isOnline = onlineIds.has(c.uniqueId);
          const isActive = activeChat === c.uniqueId;
          const unread = unreadCounts[`dm:${c.uniqueId}`] || 0;
          const isOwnLast = c.lastSender === me?.uniqueId;

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
                  className={`text-xs truncate mt-0.5 ${
                    unread > 0
                      ? 'font-semibold text-gray-800'
                      : 'text-gray-500'
                  }`}
                >
                  {isOwnLast && (
                    <span className="text-gray-400 mr-1">✓</span>
                  )}
                  {c.lastMessage}
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