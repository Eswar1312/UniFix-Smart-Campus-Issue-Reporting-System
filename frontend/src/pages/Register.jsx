// UNIFIX – Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRegister } from '../api';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    const { name, email, password, role } = form;
    if (!name || !email || !password) {
      window.showToast?.('⚠️', 'Required', 'Please fill all fields', true);
      return;
    }
    if (password.length < 8) {
      window.showToast?.('⚠️', 'Weak Password', 'Must be at least 8 characters', true);
      return;
    }
    setLoading(true);
    try {
      await apiRegister({ name, email, password, role });
      window.showToast?.('✅', 'Registered!', 'Your account is pending admin approval');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      window.showToast?.('❌', 'Error', msg, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '400px 1fr' }}>
      {/* Left */}
      <div style={{ background: 'var(--blue-dark)', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--white)' }}>UF</div>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, color: 'var(--white)' }}>UNIFIX</span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--white)', letterSpacing: -1, lineHeight: 1.1, marginBottom: 14 }}>
          Join the<br />Campus System
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65 }}>
          Create your account to start reporting campus issues. Your account will be reviewed and activated by the Super Admin.
        </p>
        <div style={{ marginTop: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Registration Process</div>
          {['Submit registration form', 'Wait for Super Admin approval', 'Receive email confirmation', 'Login and start reporting'].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ width: 20, height: 20, background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'var(--white)' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Create Account</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 28 }}>Register for UNIFIX access</p>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input type="text" className="form-control" placeholder="Arjun Reddy"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">University Email <span className="req">*</span></label>
                <input type="email" className="form-control" placeholder="22cs001@university.edu"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Password <span className="req">*</span></label>
                <input type="password" className="form-control" placeholder="Min. 8 characters"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                <div className="form-hint">Min 8 characters with a number</div>
              </div>
              <div className="form-group">
                <label className="form-label">Role <span className="req">*</span></label>
                <select className="form-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)', marginTop: 16 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--blue-dark)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>

          <div style={{ marginTop: 16, background: 'var(--amber-light)', border: '1px solid var(--amber-border)', borderLeft: '4px solid #d97706', padding: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--amber-dark)', lineHeight: 1.5 }}>
              ⚠️ <strong>Note:</strong> New accounts require Super Admin approval before you can log in. This usually takes a few hours during business hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
