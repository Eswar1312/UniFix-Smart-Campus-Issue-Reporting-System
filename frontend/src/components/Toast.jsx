// UNIFIX – Shared UI Components

// ── TOAST ─────────────────────────────────────────────────────────
export function Toast({ icon, title, sub, isError, onClose }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24,
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${isError ? 'var(--red-dark)' : 'var(--green-dark)'}`,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      minWidth: 280, maxWidth: 360,
      animation: 'slideIn 0.3s ease',
    }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--gray-400)', fontSize: 16,
      }}>✕</button>

      <style>{`@keyframes slideIn { from { transform: translateX(120%) } to { transform: translateX(0) } }`}</style>
    </div>
  );
}

export default Toast;

// ── SPINNER ─────────────────────────────────────────────────────────
export function Spinner({ size = 32, color = 'var(--blue-dark)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{
        width: size, height: size,
        border: `3px solid var(--gray-200)`,
        borderTop: `3px solid ${color}`,
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        width: '100%', maxWidth: 700,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{
          background: 'var(--blue-dark)', color: 'var(--white)',
          padding: '16px 22px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, fontFamily: 'var(--mono)' }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none',
            width: 28, height: 28, cursor: 'pointer', color: 'var(--white)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ── STATUS BADGE ─────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    'Pending':     'badge-pending',
    'In Progress': 'badge-progress',
    'Resolved':    'badge-resolved',
    'Closed':      'badge-closed',
  };
  return <span className={`badge ${map[status] || 'badge-closed'}`}>{status?.toUpperCase()}</span>;
}

// ── PRIORITY BADGE ────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return <span className={`badge ${map[priority] || 'badge-low'}`}>{priority?.toUpperCase()}</span>;
}

// ── EMPTY STATE ───────────────────────────────────────────────────
export function EmptyState({ icon = '📭', message = 'Nothing here yet', sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-600)' }}>{message}</div>
      {sub && <div style={{ fontSize: 13, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ── AI PANEL ─────────────────────────────────────────────────────
export function AiPanel({ keywords, reason, dept, priority }) {
  const prioMap = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return (
    <div style={{
      background: '#f0fdf4',
      border: '1px solid var(--green-border)',
      borderLeft: '4px solid var(--green-dark)',
      padding: 16, marginTop: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.8px', color: 'var(--green-dark)', marginBottom: 12,
      }}>
        🤖 AI Classification
        <span style={{
          background: 'var(--green-dark)', color: 'var(--white)',
          fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
          padding: '2px 6px', letterSpacing: '0.5px',
        }}>AUTO</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Priority</div>
          <span className={`badge ${prioMap[priority] || 'badge-low'}`}>{priority?.toUpperCase()}</span>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Routed To</div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--blue-dark)' }}>{dept}</span>
        </div>
      </div>

      {keywords && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Keywords</div>
          <div>
            {keywords.split(',').map((k, i) => (
              <span key={i} style={{
                display: 'inline-block',
                background: 'var(--green-light)', color: 'var(--green-dark)',
                border: '1px solid var(--green-border)',
                fontFamily: 'var(--mono)', fontSize: 11,
                padding: '2px 8px', margin: 2,
              }}>{k.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {reason && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 4 }}>Reasoning</div>
          <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.55 }}>{reason}</div>
        </div>
      )}
    </div>
  );
}
