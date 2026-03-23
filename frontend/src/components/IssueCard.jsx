// UNIFIX – IssueCard.jsx
export default function IssueCard({ issue, onClick, actions }) {
  const priorityColor = { High: 'var(--red-dark)', Medium: '#d97706', Low: 'var(--green-dark)' };
  const statusMap = {
    'Pending':     { cls: 'badge-pending',  label: 'PENDING' },
    'In Progress': { cls: 'badge-progress', label: 'IN PROGRESS' },
    'Resolved':    { cls: 'badge-resolved', label: 'RESOLVED' },
    'Closed':      { cls: 'badge-closed',   label: 'CLOSED' },
  };
  const prioMap = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  const st = statusMap[issue.status] || { cls: 'badge-closed', label: issue.status };

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${priorityColor[issue.priority] || 'var(--border-dark)'}`,
        padding: '16px 18px',
        marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = 'var(--shadow)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--blue-dark)', fontWeight: 600 }}>
          #UNF-{issue.id}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge ${prioMap[issue.priority] || 'badge-low'}`}>{issue.priority?.toUpperCase()}</span>
          <span className={`badge ${st.cls}`}>{st.label}</span>
          {issue.visibility && (
            <span className={`badge ${issue.visibility === 'public' ? 'badge-public' : 'badge-private'}`}>
              {issue.visibility.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        {issue.title || '(No title)'}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: 'var(--gray-500)', marginBottom: 10,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 600,
      }}>
        {issue.description}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        {issue.department_name && (
          <span style={{ fontSize: 11, color: 'var(--blue-dark)', fontWeight: 600 }}>
            🏢 {issue.department_name}
          </span>
        )}
        {issue.location && (
          <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>📍 {issue.location}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--gray-400)', fontFamily: 'var(--mono)' }}>
          {new Date(issue.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
        </span>
        {issue.reporter_name && (
          <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>by {issue.reporter_name}</span>
        )}
      </div>

      {/* SLA bar */}
      {issue.sla_deadline && issue.status !== 'Resolved' && (
        <div style={{ marginTop: 10 }}>
          <SlaBar deadline={issue.sla_deadline} />
        </div>
      )}

      {/* Actions (admin) */}
      {actions && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

function SlaBar({ deadline }) {
  const now       = Date.now();
  const end       = new Date(deadline).getTime();
  const diffMs    = end - now;
  const diffHours = Math.max(0, Math.floor(diffMs / 3600000));
  const pct       = Math.min(100, Math.max(0, (diffMs / (48 * 3600000)) * 100));
  const cls       = pct < 20 ? 'sla-breach' : pct < 50 ? 'sla-warn' : 'sla-ok';
  const label     = diffMs < 0 ? 'SLA Breached!' : `${diffHours}h remaining`;

  return (
    <div>
      <div className="sla-bar"><div className={`sla-fill ${cls}`} style={{ width: `${pct}%` }}></div></div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, marginTop: 3, color: pct < 20 ? 'var(--red-dark)' : 'var(--gray-400)' }}>
        {label}
      </div>
    </div>
  );
}
