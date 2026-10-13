import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';

function RiyaPage() {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  // History load
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    api
      .get('/ai/history')
      .then((res) => {
        if (res.data.success) setMessages(res.data.data);
      })
      .catch((err) => setError('Chat load nahi ho payi.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setError('');

    // Optimistic UI — user message turant dikhao
    const tempUserMsg = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Kuch gadbad ho gayi 🌸 Thodi der baad try karo.'
      );
      // Failed message hata do
      setMessages((prev) =>
        prev.filter((m) => m._id !== tempUserMsg._id)
      );
      setInput(userMsg); // Wapas input me daal do
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!confirm('Poori chat clear karni hai?')) return;
    try {
      await api.delete('/ai/history');
      setMessages([]);
      // Refresh to get welcome message
      const res = await api.get('/ai/history');
      if (res.data.success) setMessages(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-pink-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-xl shadow">
            🌸
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Riya</h1>
            <span className="text-xs text-pink-500">● AI Companion</span>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-xs text-gray-500 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-3">Riya aa rahi hai... 🌸</p>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const own = m.role === 'user';
              return (
                <div
                  key={m._id}
                  className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                >
                  {!own && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-sm mr-2 shrink-0 self-end">
                      🌸
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap ${
                      own
                        ? 'bg-pink-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <div className="text-sm leading-relaxed break-words">
                      {m.content}
                    </div>
                    <div
                      className={`text-[10px] mt-1 ${
                        own ? 'text-pink-100' : 'text-gray-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-sm mr-2 shrink-0">
                  🌸
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 bg-red-50 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={send}
        className="bg-white border-t border-pink-100 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Riya se kuch bhi poocho..."
          maxLength={2000}
          disabled={sending}
          className="flex-1 px-4 py-3 rounded-full border-2 border-pink-200 outline-none focus:border-pink-400 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold text-sm disabled:opacity-50 shadow-lg shadow-pink-200"
        >
          Bhejo
        </button>
      </form>
    </div>
  );
}

export default RiyaPage;