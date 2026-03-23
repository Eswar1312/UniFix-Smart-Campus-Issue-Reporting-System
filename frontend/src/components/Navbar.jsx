// UNIFIX – Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../api';

export default function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const user      = getUser();

  const links = [
    { to: '/dashboard',  label: 'Dashboard' },
    { to: '/submit',     label: '+ Report Issue' },
    { to: '/my-issues',  label: 'My Issues' },
    { to: '/public',     label: 'Public Issues' },
    { to: '/lost-found', label: 'Lost & Found' },
    { to: '/chat',       label: 'AI Chat' },
  ];

  function logout() {
    clearAuth();
    navigate('/login');
    window.showToast?.('👋', 'Signed out', 'See you soon!');
  }

  return (
    <nav style={{
      background: 'var(--blue-dark)', color: 'var(--white)',
      borderBottom: '2px solid #0f2a4a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: '56px', position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, background: 'var(--green-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--white)',
        }}>UF</div>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 2, color: 'var(--white)' }}>UNIFIX</span>
      </Link>

      {/* Links */}
      <div style={{ display: 'flex', gap: 2 }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={{
            padding: '8px 14px',
            fontSize: 13, fontWeight: 500,
            color: location.pathname === l.to ? 'var(--white)' : 'rgba(255,255,255,0.6)',
            textDecoration: 'none',
            borderBottom: location.pathname === l.to ? '2px solid var(--green-mid)' : '2px solid transparent',
            background: location.pathname === l.to ? 'rgba(255,255,255,0.07)' : 'transparent',
          }}>{l.label}</Link>
        ))}
      </div>

      {/* User + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--mono)', textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.7)', padding: '7px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>Sign Out</button>
      </div>
    </nav>
  );
}
