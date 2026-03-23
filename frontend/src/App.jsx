// UNIFIX – App.jsx (React Router v6)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login        from './pages/Login';
import Register     from './pages/Register';
import Dashboard    from './pages/Dashboard';
import SubmitIssue  from './pages/SubmitIssue';
import MyIssues     from './pages/MyIssues';
import PublicIssues from './pages/PublicIssues';
import LostFound    from './pages/LostFound';
import AdminDash    from './pages/AdminDash';
import SuperAdmin   from './pages/SuperAdmin';
import Chat         from './pages/Chat';
import Navbar       from './components/Navbar';
import Toast        from './components/Toast';
import { getToken, getUser } from './api';

// ── Protected Route Wrapper ───────────────────────────────────────
function Protected({ children, roles }) {
  const token = getToken();
  const user  = getUser();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [toast, setToast] = useState(null);

  // Global toast helper — attach to window for use anywhere
  useEffect(() => {
    window.showToast = (icon, title, sub, isError = false) => {
      setToast({ icon, title, sub, isError });
      setTimeout(() => setToast(null), 3500);
    };
  }, []);

  const user = getUser();

  return (
    <BrowserRouter>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <Routes>
        {/* Public */}
        <Route path="/"        element={<Navigate to={getToken() ? '/dashboard' : '/login'} replace />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student / Faculty */}
        <Route path="/dashboard" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><Dashboard />
          </Protected>
        }/>
        <Route path="/submit" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><SubmitIssue />
          </Protected>
        }/>
        <Route path="/my-issues" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><MyIssues />
          </Protected>
        }/>
        <Route path="/public" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><PublicIssues />
          </Protected>
        }/>
        <Route path="/lost-found" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><LostFound />
          </Protected>
        }/>
        <Route path="/chat" element={
          <Protected roles={['student','faculty']}>
            <Navbar /><Chat />
          </Protected>
        }/>

        {/* Department Admin */}
        <Route path="/admin" element={
          <Protected roles={['dept_admin']}>
            <AdminDash />
          </Protected>
        }/>

        {/* Super Admin */}
        <Route path="/superadmin" element={
          <Protected roles={['super_admin']}>
            <SuperAdmin />
          </Protected>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
