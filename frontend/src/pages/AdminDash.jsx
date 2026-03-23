// UNIFIX – AdminDash.jsx (Department Admin)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDeptIssues, apiUpdateIssue, getUser, clearAuth } from '../api';
import IssueCard from '../components/IssueCard';
import { Spinner, EmptyState, Modal } from '../components/Toast';

export default function AdminDash() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({ status: '', resolution_notes: '' });
  const [statusF, setStatusF]   = useState('');
  const [prioF, setPrioF]       = useState('');
  const [view, setView]         = useState('all');
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  function load() {
    apiDeptIssues()
      .then(r => setIssues(r.data))
      .catch(() => window.showToast?.('❌', 'Error', 'Failed to load issues', true))
      .finally(() => setLoading(false));
  }

  function openIssue(issue) {
    setSelected(issue);
    setUpdateForm({ status: issue.status, resolution_notes: issue.resolution_notes || '' });
    setModal(true);
  }

  async function handleUpdate() {
    if (!updateForm.status) return;
    setUpdating(true);
    try {
      await apiUpdateIssue(selected.id, updateForm);
      window.showToast?.('✅', 'Updated!', 'Issue status updated & email sent to reporter');
      setModal(false);
      load();
    } catch (err) {
      window.showToast?.('❌', 'Error', err.response?.data?.error || 'Update failed', true);
    } finally {
      setUpdating(false);
    }
  }

  function logout() { clearAuth(); navigate('/login'); }

  const filtered = issues.filter(i => {
    if (view === 'high' && i.priority !== 'High') return false;
    if (view === 'resolved' && i.status !== 'Resolved') return false;
    if (view === 'open' && i.status === 'Resolved') return false;
    if (statusF && i.status !== statusF) return false;
    if (prioF && i.priority !== prioF) return false;
    return true;
  });

  const total     = issues.length;
  const highCount = issues.filter(i => i.priority === 'High' && i.status !== 'Resolved').length;
  const inProg    = issues.filter(i => i.status === 'In Progress').length;
  const resolved  = issues.filter(i => i.status === 'Resolved').length;

  const statusMap = { 'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-mark">UF</div>
            <div><div className="brand-name" style={{ fontSize: 16 }}>UNIFIX</div><div className="brand-sub">Dept Admin</div></div>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">My Department</div>
          {[
            { id: 'all',      icon: '⊞', label: 'All Issues',       badge: total },
            { id: 'open',     icon: '≡', label: 'Open Issues',      badge: total - resolved },
            { id: 'high',     icon: '▲', label: 'High Priority',    badge: highCount },
            { id: 'resolved', icon: '✓', label: 'Resolved',         badge: null },
          ].map(n => (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <span className="nav-icon">{n.icon}</span> {n.label}
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info-block">
            <div className="user-avatar" style={{ background: 'var(--blue-dark)' }}>{user?.name?.[0]}</div>
            <div><div className="user-info-name">{user?.name}</div><div className="user-info-role">Dept Admin</div></div>
          </div>
          <button className="nav-item mt-8" onClick={logout}><span className="nav-icon">⇲</span> Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrap">
        <div className="topbar">
          <div>
            <div className="topbar-title">Department Dashboard</div>
            <div className="topbar-subtitle">AI-sorted issue queue</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="">All Status</option>
              <option>Pending</option><option>In Progress</option><option>Resolved</option>
            </select>
            <select className="filter-select" value={prioF} onChange={e => setPrioF(e.target.value)}>
              <option value="">All Priority</option>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
          </div>
        </div>

        <div className="content">
          {/* Metrics */}
          <div className="grid-4 mb-16">
            <div className="metric-card red"><div className="metric-label">High Priority Open</div><div className="metric-value" style={{ color: 'var(--red-dark)' }}>{highCount}</div></div>
            <div className="metric-card amber"><div className="metric-label">In Progress</div><div className="metric-value">{inProg}</div></div>
            <div className="metric-card green"><div className="metric-label">Resolved</div><div className="metric-value" style={{ color: 'var(--green-dark)' }}>{resolved}</div></div>
            <div className="metric-card blue"><div className="metric-label">Total Issues</div><div className="metric-value" style={{ color: 'var(--blue-dark)' }}>{total}</div></div>
          </div>

          {/* Issue table */}
          <div className="table-wrap">
            {loading ? <Spinner /> :
             !filtered.length ? <EmptyState icon="✅" message="No issues" sub="All clear!" /> :
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Issue</th><th>Reporter</th><th>Priority</th><th>Status</th><th>SLA</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td className="issue-id-cell">#UNF-{i.id}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{i.title || '(No title)'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{i.location ? `📍 ${i.location}` : i.description?.slice(0, 50) + '...'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{i.reporter_name}</td>
                    <td><span className={`badge badge-${i.priority?.toLowerCase()}`}>{i.priority?.toUpperCase()}</span></td>
                    <td><span className={`badge ${statusMap[i.status] || 'badge-closed'}`}>{i.status?.toUpperCase()}</span></td>
                    <td style={{ fontSize: 11, fontFamily: 'var(--mono)', color: i.priority === 'High' ? 'var(--red-dark)' : 'var(--gray-400)' }}>
                      {i.sla_deadline ? new Date(i.sla_deadline).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openIssue(i)}>View</button>
                        {i.status !== 'Resolved' && (
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            setSelected(i);
                            setUpdateForm({ status: i.status === 'Pending' ? 'In Progress' : 'Resolved', resolution_notes: '' });
                            setModal(true);
                          }}>
                            {i.status === 'Pending' ? 'Start' : 'Resolve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={`Issue #UNF-${selected?.id}`} subtitle={selected?.title}>
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`badge badge-${selected.priority?.toLowerCase()}`}>{selected.priority?.toUpperCase()}</span>
              <span className={`badge ${statusMap[selected.status] || 'badge-closed'}`}>{selected.status?.toUpperCase()}</span>
            </div>
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderLeft: '4px solid var(--blue-dark)', padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.65, fontStyle: 'italic' }}>
              "{selected.description}"
            </div>
            <table className="detail-table" style={{ marginBottom: 16 }}>
              <tbody>
                <tr><th>Reporter</th><td>{selected.reporter_name}</td></tr>
                <tr><th>Location</th><td>{selected.location || '—'}</td></tr>
                <tr><th>Category</th><td>{selected.category_name || '—'}</td></tr>
                <tr><th>SLA Deadline</th><td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red-dark)' }}>{selected.sla_deadline ? new Date(selected.sla_deadline).toLocaleString() : '—'}</td></tr>
              </tbody>
            </table>
            <div style={{ height: 1, background: 'var(--gray-200)', margin: '16px 0' }}></div>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Update Issue</div>
            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-control" value={updateForm.status} onChange={e => setUpdateForm({...updateForm, status: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Resolution Notes</label>
              <textarea className="form-control" placeholder="Describe action taken..." style={{ minHeight: 80 }}
                value={updateForm.resolution_notes} onChange={e => setUpdateForm({...updateForm, resolution_notes: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={updating}>{updating ? 'Saving...' : 'Save & Notify Reporter'}</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
