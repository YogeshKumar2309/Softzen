import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" />;
}

function SocketProvider() {
  // ✅ Ye App level par hai — har page par socket chalega
  useSocket();
  return null;
}

function App() {
  const token = useAuthStore((s) => s.token);

  return (
    <BrowserRouter>
      {/* Socket provider — sirf jab logged in ho */}
      {token && <SocketProvider />}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <UsersPage />
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:uniqueId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;