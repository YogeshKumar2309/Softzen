import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';

function ChatWindow({ onMenuClick }) {
  const {
    activeChat,
    messagesByChat,
    typingByChat,
    onlineUsers,
    connected,
    socket,
  } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatKey = activeChat === 'general' ? 'general' : `dm:${activeChat}`;
  const messages = messagesByChat[chatKey] || [];
  const typing = typingByChat[chatKey];

  const isGeneral = activeChat === 'general';
  const isRiya = activeChat === 'riya_22';
  const isDM = !isGeneral;

  const otherOnline =
    isDM && (isRiya || onlineUsers.some((u) => u.uniqueId === activeChat));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();

    if (!input.trim()) return;
    if (!socket) {
      alert('Socket connect nahi hai. Backend chalu hai?');
      return;
    }

    if (isGeneral) {
      socket.emit('send_message', {
        text: input.trim(),
        roomId: 'general',
      });
      socket.emit('typing', { roomId: 'general', isTyping: false });
    } else {
      socket.emit('send_private_message', {
        to: activeChat,
        text: input.trim(),
      });
      socket.emit('typing_private', {
        to: activeChat,
        isTyping: false,
      });
    }

    setInput('');
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    if (isRiya) return; // Riya ko typing nahi bhejni

    if (isGeneral) {
      socket.emit('typing', { roomId: 'general', isTyping: true });
    } else {
      socket.emit('typing_private', { to: activeChat, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isGeneral) {
        socket.emit('typing', { roomId: 'general', isTyping: false });
      } else {
        socket.emit('typing_private', { to: activeChat, isTyping: false });
      }
    }, 1500);
  };

  const title = isGeneral ? 'General' : isRiya ? 'Riya_22' : activeChat;
  const subtitle = isRiya
    ? 'Always online'
    : isGeneral
    ? `${onlineUsers.length} log online`
    : otherOnline
    ? 'Online'
    : 'Offline';

  const typingText = (() => {
    if (isGeneral) {
      if (!Array.isArray(typing) || typing.length === 0) return null;
      return `${typing.join(', ')} likh raha hai...`;
    }
    return typing ? `${title} likh rahi hai...` : null;
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ===== Header (FIXED on mobile) ===== */}
      <div
        className={`flex-shrink-0 border-b px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 z-20 ${
          isRiya
            ? 'bg-pink-50 border-pink-100'
            : 'bg-white border-gray-100'
        }`}
      >
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
          aria-label="Menu"
        >
          ☰
        </button>

        {/* Back to home (mobile) */}
        <button
          onClick={() => navigate('/')}
          className="lg:hidden w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
          aria-label="Home"
        >
          ←
        </button>

        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
            isRiya
              ? 'bg-gradient-to-br from-pink-400 to-pink-600 text-2xl'
              : isGeneral
              ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white'
              : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white'
          }`}
        >
          {isRiya ? '🌸' : isGeneral ? '#' : title.charAt(0).toUpperCase()}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 truncate flex items-center gap-1.5">
            <span className="truncate">{title}</span>
            {isRiya && (
              <span className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                AI
              </span>
            )}
          </h1>
          <span
            className={`text-xs ${
              isRiya || isGeneral || otherOnline
                ? 'text-green-500'
                : 'text-gray-400'
            }`}
          >
            ● {subtitle}
          </span>
        </div>

        {/* Connection status (desktop only) */}
        <span
          className={`hidden sm:block text-xs font-semibold ${
            connected ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {connected ? '● Connected' : '● Offline'}
        </span>
      </div>

      {/* ===== Messages ===== */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">
            {isGeneral
              ? 'General chat me pehla message bhejo! 🚀'
              : isRiya
              ? 'Riya se baat shuru karo! 🌸'
              : `${activeChat} ke saath chat shuru karo 👋`}
          </div>
        )}

        {messages.map((m, i) => {
          const own = m.senderId === user.uniqueId;
          const isRead = m.read === true;
          const fromRiya = m.senderId === 'riya_22';

          return (
            <div
              key={m._id || i}
              className={`flex ${own ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {!own && fromRiya && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-sm shrink-0 self-end">
                  🌸
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  own
                    ? 'bg-gradient-to-r from-brand-500 to-brand-700 text-white'
                    : fromRiya
                    ? 'bg-pink-50 border border-pink-200 text-gray-800'
                    : 'bg-white border border-gray-100 text-gray-800'
                }`}
              >
                {!own && isGeneral && (
                  <div className="text-xs font-bold opacity-80 mb-1">
                    {m.senderId}
                  </div>
                )}

                <div className="text-sm break-words whitespace-pre-wrap">
                  {m.text}
                </div>

                <div
                  className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                    own ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  <span>
                    {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {own && isDM && (
                    <span className="ml-0.5">
                      {isRead ? (
                        <span className="text-sky-300 font-bold">✓✓</span>
                      ) : (
                        <span className="opacity-80">✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typingText && (
          <div className="text-xs text-brand-500 italic px-2">
            {typingText}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* ===== Input ===== */}
      <form
        onSubmit={send}
        className="flex-shrink-0 bg-white border-t border-gray-100 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={handleChange}
          placeholder={`Message ${isGeneral ? '#general' : title}...`}
          className={`flex-1 px-4 py-3 rounded-full border-2 outline-none text-sm ${
            isRiya
              ? 'border-pink-200 focus:border-pink-500'
              : 'border-gray-200 focus:border-brand-500'
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || !connected}
          className={`px-5 sm:px-6 py-3 rounded-full text-white font-semibold text-sm disabled:opacity-50 ${
            isRiya
              ? 'bg-gradient-to-r from-pink-500 to-pink-600'
              : 'bg-gradient-to-r from-brand-500 to-brand-700'
          }`}
        >
          Bhejo
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;