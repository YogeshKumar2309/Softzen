import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

function RegisterPage() {
  const [uniqueId, setUniqueId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await register(uniqueId, password, message);
      if (data.success) {
        alert(data.message);
        navigate('/login');
      } else {
        setError(data.message || 'Register fail hua.');
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
        <h1 className="text-2xl font-bold text-center text-gray-900">Join Softzen</h1>
        <p className="text-sm text-gray-500 text-center mt-1 mb-6">
          Level 1 founding member bane — free
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
              minLength={3}
              maxLength={20}
              required
              className="input-brand"
            />
            <p className="text-xs text-gray-400 mt-1">
              Sirf letters, numbers, underscore (_)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="input-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Why join? (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className="input-brand resize-none"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-brand">
            {loading ? 'Register ho raha hai...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pehle se member ho?{' '}
          <Link to="/login" className="text-brand-600 font-semibold">
            Login karein
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;