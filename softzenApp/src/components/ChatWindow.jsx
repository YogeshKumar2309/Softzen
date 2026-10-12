import { useEffect, useRef, useState } from 'react';
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
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatKey = activeChat === 'general' ? 'general' : `dm:${activeChat}`;
  const messages = messagesByChat[chatKey] || [];
  const typing = typingByChat[chatKey];

  const isGeneral = activeChat === 'general';
  const isDM = !isGeneral;

  const otherOnline =
    isDM && onlineUsers.some((u) => u.uniqueId === activeChat);

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

  const title = isGeneral ? 'General' : activeChat;
  const subtitle = isGeneral
    ? `${onlineUsers.length} log online`
    : otherOnline
    ? 'Online'
    : 'Offline';

  const typingText = (() => {
    if (isGeneral) {
      if (!Array.isArray(typing) || typing.length === 0) return null;
      return `${typing.join(', ')} likh raha hai...`;
    }
    return typing ? `${activeChat} likh raha hai...` : null;
  })();

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ===== Header ===== */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onMenuClick}
          className="lg:hidden btn btn-sm btn-ghost"
        >
          ☰
        </button>

        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
            isGeneral
              ? 'bg-gradient-to-br from-brand-500 to-brand-700'
              : 'bg-gradient-to-br from-brand-400 to-brand-600'
          }`}
        >
          {isGeneral ? '#' : title.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-900 truncate">{title}</h1>
          <span
            className={`text-xs ${
              isGeneral || otherOnline ? 'text-green-500' : 'text-gray-400'
            }`}
          >
            ● {subtitle}
          </span>
        </div>

        <span
          className={`text-xs font-semibold ${
            connected ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {connected ? '● Connected' : '● Offline'}
        </span>
      </div>

      {/* ===== Messages ===== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">
            {isGeneral
              ? 'General chat me pehla message bhejo! 🚀'
              : `${activeChat} ke saath chat shuru karo 👋`}
          </div>
        )}

        {messages.map((m, i) => {
          const own = m.senderId === user.uniqueId;
          const isRead = m.read === true;

          return (
            <div
              key={m._id || i}
              className={`flex ${own ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  own
                    ? 'bg-gradient-to-r from-brand-500 to-brand-700 text-white'
                    : 'bg-white border border-gray-100 text-gray-800'
                }`}
              >
                {/* Sender name — sirf general + non-own */}
                {!own && isGeneral && (
                  <div className="text-xs font-bold opacity-80 mb-1">
                    {m.senderId}
                  </div>
                )}

                <div className="text-sm break-words">{m.text}</div>

                {/* Time + ticks */}
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

                  {/* ✅ Double tick — sirf apne DM messages par */}
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
        className="bg-white border-t border-gray-100 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={handleChange}
          placeholder={`Message ${isGeneral ? '#general' : activeChat}...`}
          className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 outline-none focus:border-brand-500 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || !connected}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 text-white font-semibold text-sm disabled:opacity-50"
        >
          Bhejo
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;