// UNIFIX – Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiMyIssues, getUser } from '../api';
import IssueCard from '../components/IssueCard';
import { Spinner, EmptyState } from '../components/Toast';

export default function Dashboard() {
  const [issues, setIssues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const user    = getUser();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    apiMyIssues()
      .then(r => setIssues(r.data))
      .catch(() => window.showToast?.('❌', 'Error', 'Failed to load issues', true))
      .finally(() => setLoading(false));
  }, []);

  const total    = issues.length;
  const high     = issues.filter(i => i.priority === 'High').length;
  const pending  = issues.filter(i => i.status === 'Pending').length;
  const resolved = issues.filter(i => i.status === 'Resolved').length;
  const recent   = issues.slice(0, 3);

  const actions = [
    { icon: '＋', label: 'Report Issue',    sub: 'Submit a new complaint',    to: '/submit',     color: 'var(--green-dark)' },
    { icon: '≡',  label: 'My Issues',       sub: 'Track your complaints',     to: '/my-issues',  color: 'var(--blue-dark)' },
    { icon: '◎',  label: 'Public Issues',   sub: 'View campus-wide issues',   to: '/public',     color: 'var(--blue-dark)' },
    { icon: '◈',  label: 'Lost & Found',    sub: 'Post or find items',        to: '/lost-found', color: '#6b7685' },
    { icon: '◇',  label: 'AI Assistant',    sub: 'Chat with UNIFIX AI',       to: '/chat',       color: 'var(--green-dark)' },
  ];

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{greeting}, {user?.name?.split(' ')[0]}</h1>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Here's your UNIFIX issue overview</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/submit')}>+ Report Issue</button>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Reported', value: total, sub: 'All time', cls: 'blue' },
            { label: 'High Priority',  value: high,  sub: 'Active',   cls: 'red' },
            { label: 'Pending',        value: pending, sub: 'Awaiting action', cls: 'amber' },
            { label: 'Resolved',       value: resolved, sub: 'Completed',   cls: 'green' },
          ].map(m => (
            <div key={m.label} className={`metric-card ${m.cls}`}>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
              <div className="metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Recent issues */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Issues</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-issues')}>View All →</button>
            </div>
            {loading ? <Spinner /> :
             !recent.length ? <EmptyState icon="📭" message="No issues yet" sub="Click 'Report Issue' to submit your first complaint" /> :
             recent.map(i => <IssueCard key={i.id} issue={i} onClick={() => navigate('/my-issues')} />)}
          </div>

          {/* Quick actions */}
          <div>
            <div className="card">
              <div className="card-header"><div className="card-title">Quick Actions</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actions.map(a => (
                  <button key={a.to} onClick={() => navigate(a.to)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'border-color 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = a.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ width: 36, height: 36, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{a.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
