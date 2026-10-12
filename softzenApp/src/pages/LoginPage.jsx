import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function LoginPage() {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(uniqueId, password);
      if (res.ok) {
        navigate('/');
      } else {
        setError(res.message || 'Login fail hua.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">
          Apni ID aur password se login karein
        </p>

        {error && (
          <div className="alert alert-error mb-4 text-sm"><span>{error}</span></div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Unique ID
            </label>
            <input
              type="text"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="rahul_007"
              required
              className="input-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              className="input-brand"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-brand">
            {loading ? 'Login ho raha hai...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Naya ho?{' '}
          <Link to="/register" className="text-brand-600 font-semibold">
            Register karein
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;