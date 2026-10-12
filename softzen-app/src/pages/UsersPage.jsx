import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUserStore } from '../stores/userStore';
import { useAuthStore } from '../stores/authStore';
import { SOCKET_URL } from '../lib/api';
import UserCard from '../components/UserCard';

function UsersPage() {
  const { token } = useAuthStore();
  const {
    users, loading, error,
    page, totalMembers, totalPages, hasNextPage, hasPrevPage,
    search, level, status, sort, order, onlineCount,
    setSearch, setLevel, setStatus, setSort, setPage, setOnlineCount,
    fetchUsers, reset,
  } = useUserStore();

  const socketRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [page, level, status, sort, order]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
    });
    socketRef.current = socket;

    socket.on('online_count', (n) => {
      setOnlineCount(n);
      const s = useUserStore.getState().status;
      if (s === 'online' || s === 'offline') fetchUsers();
    });

    socket.on('online_users', () => {
      const s = useUserStore.getState().status;
      if (s === 'online' || s === 'offline') fetchUsers();
    });

    return () => socket.disconnect();
  }, [token]);

  const clearAll = () => {
    reset();
    setTimeout(fetchUsers, 0);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Community Members
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            {totalMembers.toLocaleString('en-IN')} log ab tak jude hain
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="text-2xl sm:text-3xl font-bold text-brand-600">
              {totalMembers.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Total Members
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {onlineCount}
              </div>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Online Now
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-3">
          <label className="input input-bordered flex items-center gap-2 w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID..."
              className="grow text-base"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatus(null)}
              className={`btn btn-sm ${!status ? 'btn-primary' : 'btn-ghost border border-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatus('online')}
              className={`btn btn-sm ${status === 'online' ? 'btn-success' : 'btn-ghost border border-gray-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Online
            </button>
            <button
              onClick={() => setStatus('offline')}
              className={`btn btn-sm ${status === 'offline' ? 'btn-neutral' : 'btn-ghost border border-gray-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
              Offline
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={level || ''}
              onChange={(e) => setLevel(e.target.value ? parseInt(e.target.value) : null)}
              className="select select-bordered select-sm flex-1 min-w-[140px]"
            >
              <option value="">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>

            <select
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-');
                setSort(s, o);
              }}
              className="select select-bordered select-sm flex-1 min-w-[140px]"
            >
              <option value="createdAt-desc">Newest first</option>
              <option value="createdAt-asc">Oldest first</option>
              <option value="tokens-desc">Most tokens</option>
              <option value="level-asc">Level (low-high)</option>
              <option value="uniqueId-asc">ID (A-Z)</option>
            </select>
          </div>

          {(search || level || status) && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>{totalMembers} result{totalMembers === 1 ? '' : 's'}</span>
              <button onClick={clearAll} className="link link-primary no-underline font-semibold">
                Clear all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg text-brand-500"></span>
            <p className="text-gray-500 mt-3 text-sm">Loading members...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error"><span>{error}</span></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">🔍</div>
            <p>Koi member nahi mila.</p>
            {(search || level || status) && (
              <button onClick={clearAll} className="btn btn-sm btn-primary mt-4">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <UserCard key={u._id || u.uniqueId} user={u} />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
                className="btn btn-sm btn-outline"
              >
                ← Prev
              </button>

              <div className="join">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) p = i + 1;
                  else if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`join-item btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
                className="btn btn-sm btn-outline"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UsersPage;