import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { updateTitleUnread } from '../lib/notify';

function Header() {
  const { user, logout } = useAuthStore();
  const { setActiveChat, unreadCounts } = useChatStore();
  const navigate = useNavigate();

  // Total unread = general + saare DM
  const totalUnread = Object.values(unreadCounts).reduce(
    (sum, n) => sum + (n || 0),
    0
  );

  // Browser tab title update — (3) Softzen
  useEffect(() => {
    updateTitleUnread(totalUnread);
  }, [totalUnread]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goToChat = () => {
    setActiveChat('general');
    navigate('/chat');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent"
        >
          Softzen
        </Link>

     
        {/* Nav */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-brand-500 px-2 sm:px-3 py-2"
          >
            Members
          </Link>

          {user ? (
            <>
              {/* Chat button with yellow dot + count */}
              <button
                onClick={goToChat}
                className="relative text-sm font-medium text-gray-600 hover:text-brand-500 px-2 sm:px-3 py-2 flex items-center gap-1.5"
              >
                <span>Chat</span>

                {totalUnread > 0 && (
                  <span className="flex items-center gap-1">
                    {/* 🟡 Pulsing yellow dot */}
                    <span className="relative flex">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400 shadow-md" />
                    </span>

                    {/* Count badge */}
                    <span className="bg-yellow-400 text-gray-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  </span>
                )}
              </button>

              {/* User avatar + logout */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold text-sm">
                  {user.uniqueId.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-500 font-medium hover:underline"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-brand-500 px-2 sm:px-3 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-gradient-to-r from-brand-500 to-brand-700 text-white px-3 sm:px-4 py-2 rounded-lg"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;