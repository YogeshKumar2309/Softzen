import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';

function UserCard({ user }) {
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const setActiveChat = useChatStore((s) => s.setActiveChat);

  const levelBadgeClass = {
    1: 'badge-warning',
    2: 'badge-info',
    3: 'badge-ghost',
  };

  const initial = user.uniqueId.charAt(0).toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isMe = me?.uniqueId === user.uniqueId;

  const handleClick = () => {
    if (!me) return navigate('/login');
    if (isMe) return;
    setActiveChat(user.uniqueId);
    navigate('/chat');
  };

  return (
    <div
      onClick={handleClick}
      className={`card-brand ${
        !isMe && me ? 'cursor-pointer hover:border-brand-500' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-lg">
            {initial}
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
              {user.uniqueId}
              {isMe && <span className="text-xs text-gray-400 ml-1">(you)</span>}
            </h3>
            <span className={`badge badge-sm ${levelBadgeClass[user.level] || 'badge-ghost'}`}>
              L{user.level}
            </span>
            {user.isOnline && (
              <span className="badge badge-sm badge-success badge-outline">
                Online
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-1">Joined {joinedDate}</p>

          {user.message && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              "{user.message}"
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-amber-600">
              <span className="text-base">🪙</span>
              <span className="font-semibold text-sm">
                {(user.tokens || 0).toLocaleString('en-IN')}
              </span>
            </div>

            {!isMe && me && (
              <span className="text-xs font-semibold text-brand-600">
                Message →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserCard;