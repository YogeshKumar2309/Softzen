import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

function ChatSidebar({ onClose }) {
  const {
    activeChat,
    setActiveChat,
    onlineUsers,
    messagesByChat,
    unreadCounts,
  } = useChatStore();
  const me = useAuthStore((s) => s.user);

  // Saare known users (jinse chat hui + online users)
  const knownUsers = new Set();
  Object.keys(messagesByChat).forEach((key) => {
    if (key.startsWith('dm:')) {
      const u = key.slice(3);
      if (u !== me?.uniqueId) knownUsers.add(u);
    }
  });
  onlineUsers.forEach((u) => {
    if (u.uniqueId !== me?.uniqueId) knownUsers.add(u.uniqueId);
  });

  // Sort: online first, then alphabetically
  const onlineIds = new Set(onlineUsers.map((u) => u.uniqueId));
  const sortedUsers = Array.from(knownUsers).sort((a, b) => {
    const ao = onlineIds.has(a);
    const bo = onlineIds.has(b);
    if (ao !== bo) return bo - ao;
    return a.localeCompare(b);
  });

  const handleSelect = (chat) => {
    setActiveChat(chat);
    onClose?.();
  };

  const generalUnread = unreadCounts['general'] || 0;

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

      {/* Chats */}
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
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-gray-900 truncate">
                General
              </div>
              {generalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {generalUnread > 99 ? '99+' : generalUnread}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Sab log yahan message kar sakte hain
            </div>
          </div>
        </button>

        {/* Users label */}
        {sortedUsers.length > 0 && (
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Direct Messages
          </div>
        )}

        {/* Users */}
        {sortedUsers.map((userId) => {
          const isOnline = onlineIds.has(userId);
          const isActive = activeChat === userId;
          const dmKey = `dm:${userId}`;
          const lastMsg = messagesByChat[dmKey]?.slice(-1)[0];
          const unread = unreadCounts[dmKey] || 0;

          return (
            <button
              key={userId}
              onClick={() => handleSelect(userId)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                isActive
                  ? 'bg-brand-50 border-l-4 border-l-brand-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                  {userId.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-gray-900 truncate text-sm">
                    {userId}
                  </div>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs truncate ${
                    unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
                  }`}
                >
                  {lastMsg ? lastMsg.text : 'Chat shuru karo'}
                </div>
              </div>
            </button>
          );
        })}

        {sortedUsers.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-8 px-4">
            Abhi koi DM nahi. Members page se kisi user par click karke shuru karo.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;