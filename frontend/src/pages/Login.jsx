// UNIFIX – Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiLogin, setAuth } from '../api';

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      window.showToast?.('⚠️', 'Required', 'Please enter email and password', true);
      return;
    }
    setLoading(true);
    try {
      const res  = await apiLogin(form);
      const { token, user } = res.data;
      setAuth(token, user);
      window.showToast?.('👋', `Welcome back, ${user.name}!`, `Signed in as ${user.role}`);
      // Role-based redirect
      if (user.role === 'super_admin') navigate('/superadmin');
      else if (user.role === 'dept_admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      window.showToast?.('❌', 'Error', msg, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '400px 1fr' }}>
      {/* Left panel */}
      <div style={{ background: 'var(--blue-dark)', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>UF</div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: 'var(--white)' }}>UNIFIX</span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--white)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 14 }}>
          Campus Issue<br />Management
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65, marginBottom: 36 }}>
          AI-powered complaint routing that gets the right people working on the right problems — automatically.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['Auto-classification with NLP keyword extraction', 'Role-based access: Student → Dept Admin → Super Admin', 'SLA tracking with automatic breach alerts', 'Email automation for all status changes'].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, background: 'var(--green-mid)', flexShrink: 0 }}></div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--white)' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 28 }}>Enter your credentials to continue</p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address <span className="req">*</span></label>
              <input type="email" className="form-control" placeholder="you@university.edu"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Password <span className="req">*</span></label>
              <input type="password" className="form-control" placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
            <div style={{ height: 1, background: 'var(--gray-200)', position: 'absolute', top: '50%', left: 0, right: 0 }}></div>
            <span style={{ background: 'var(--white)', padding: '0 12px', color: 'var(--gray-400)', fontSize: 12, position: 'relative' }}>or</span>
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--blue-dark)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>

          {/* Demo credentials */}
          <div style={{ marginTop: 24, background: 'var(--gray-50)', border: '1px solid var(--border)', padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 10 }}>Demo Credentials</div>
            {[
              { role: 'Super Admin',  email: 'admin@university.edu',     pwd: 'Admin@123' },
              { role: 'CLM Admin',    email: 'clm.admin@university.edu', pwd: 'Clm@123' },
              { role: 'Student',      email: 'student@university.edu',   pwd: 'Student@123' },
            ].map(c => (
              <div key={c.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}><strong>{c.role}</strong>: {c.email}</span>
                <button
                  type="button"
                  onClick={() => setForm({ email: c.email, password: c.pwd })}
                  style={{ fontSize: 11, padding: '3px 8px', background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--blue-dark)', fontWeight: 600 }}
                >Fill</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
