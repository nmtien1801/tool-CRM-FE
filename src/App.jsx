import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Login from './page/Login';
import Dashboard from './page/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationPage from './page/NotificationPage';

// ─────────────────────────────────────────────
// Component con — nằm TRONG <Router> nên dùng được useNavigate
// ─────────────────────────────────────────────
function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Lắng nghe event navigate từ Electron menu bar
    if (window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((path) => {
        navigate(path);
      });
    }

    // Cleanup khi component unmount
    return () => {
      window.electronAPI?.removeNavigateListener?.();
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Route Đăng nhập */}
      <Route path="/login" element={<Login />} />

      {/* Route Dashboard (Trang chính) - Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Route Notification */}
      <Route
        path="/Notification"
        element={
          <ProtectedRoute>
            <NotificationPage />
          </ProtectedRoute>
        }
      />

      {/* Route mặc định */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Route không tồn tại */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

// ─────────────────────────────────────────────
// Root App — bọc Router + AuthProvider bên ngoài
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;