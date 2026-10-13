import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

function UserCard({ user }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { setActiveChat, unreadCounts } = useChatStore();

  const isRiya = user.uniqueId === 'riya_22';
  const isMe = me?.uniqueId === user.uniqueId;
  const displayName = isRiya ? 'Riya_22' : user.uniqueId;
  const unread = unreadCounts[`dm:${user.uniqueId}`] || 0;

  const levelBadgeClass = {
    1: 'badge-warning',
    2: 'badge-info',
    3: 'badge-ghost',
  };

  const initial = displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleClick = () => {
    if (!me) return navigate('/login');
    if (isMe) return;
    setActiveChat(user.uniqueId);
    navigate('/chat');
  };

  return (
    <div
      onClick={handleClick}
      className={`card-brand relative ${
        !isMe && me ? 'cursor-pointer hover:border-brand-500' : ''
      } ${isRiya ? 'ring-2 ring-pink-200 bg-pink-50/30' : ''}`}
    >
      {/* ✅ Unread badge — top right */}
      {unread > 0 && (
        <div className="absolute -top-1 -right-1 z-10">
          <span className="flex items-center gap-1">
            <span className="relative flex">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400 shadow-md" />
            </span>
            <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
              {unread > 99 ? '99+' : unread}
            </span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-lg ${
              isRiya
                ? 'bg-gradient-to-br from-pink-400 to-pink-600 text-2xl'
                : 'bg-gradient-to-br from-brand-500 to-brand-700'
            }`}
          >
            {isRiya ? '🌸' : initial}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">
              {displayName}
              {isMe && <span className="text-xs text-gray-400 ml-1">(you)</span>}
            </h3>

            {isRiya ? (
              <span className="badge badge-sm bg-pink-100 text-pink-700 border-pink-200">
                AI Companion
              </span>
            ) : (
              <span
                className={`badge badge-sm ${
                  levelBadgeClass[user.level] || 'badge-ghost'
                }`}
              >
                L{user.level}
              </span>
            )}

            {user.isOnline && !isRiya && (
              <span className="badge badge-sm badge-success badge-outline">
                Online
              </span>
            )}

            {/* ✅ "New message" badge */}
            {unread > 0 && (
              <span className="badge badge-sm bg-yellow-100 text-yellow-800 border-yellow-300 font-semibold">
                {unread} naya
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {isRiya
              ? 'Baatein karne ke liye hamesha ready 🌸'
              : `Joined ${joinedDate}`}
          </p>

          {user.message && !isRiya && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              "{user.message}"
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            {isRiya ? (
              <div className="text-xs text-pink-600 font-semibold">
                Chat shuru karo →
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 text-amber-600">
                  <span className="text-base">🪙</span>
                  <span className="font-semibold text-sm">
                    {(user.tokens || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {!isMe && me && (
                  <span
                    className={`text-xs font-semibold ${
                      unread > 0 ? 'text-yellow-600' : 'text-brand-600'
                    }`}
                  >
                    {unread > 0 ? 'Naya message →' : 'Message →'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCard;