// UNIFIX – SuperAdmin.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAllIssues, apiDeleteIssue, apiAllUsers, apiApproveUser, apiDeleteUser, apiMeta, apiAddDept, apiDeleteDept, apiAddCategory, apiAnalytics, apiUpdateIssue, clearAuth, getUser } from '../api';
import { Spinner, EmptyState, Modal } from '../components/Toast';

export default function SuperAdmin() {
  const [view, setView]         = useState('overview');
  const [issues, setIssues]     = useState([]);
  const [users, setUsers]       = useState([]);
  const [depts, setDepts]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const [modal, setModal]       = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', email: '' });
  const [catForm, setCatForm]   = useState({ name: '', department_id: '' });
  const [updateForm, setUpdateForm] = useState({ status: '', resolution_notes: '', priority: '', department_id: '' });
  const [filterDept, setFilterDept] = useState('');
  const [filterPrio, setFilterPrio] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]     = useState('');
  const user = getUser();
  const navigate = useNavigate();

  useEffect(() => { loadView(view); }, [view]);

  function loadView(v) {
    setLoading(true);
    if (v === 'overview' || v === 'analytics') {
      apiAnalytics().then(r => setAnalytics(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (v === 'issues') {
      apiAllIssues().then(r => setIssues(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (v === 'users') {
      apiAllUsers().then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else if (v === 'departments') {
      apiMeta().then(r => setDepts(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else setLoading(false);
  }

  async function deleteIssue(id) { if (!confirm('Delete this issue?')) return; await apiDeleteIssue(id); window.showToast?.('🗑️','Deleted','Issue removed'); loadView('issues'); }
  async function approveUser(id)  { await apiApproveUser(id); window.showToast?.('✅','Approved','User activated'); loadView('users'); }
  async function deleteUser(id)   { if (!confirm('Delete user?')) return; await apiDeleteUser(id); loadView('users'); }
  async function addDept()        { if (!deptForm.name) return; await apiAddDept(deptForm); window.showToast?.('✅','Done','Department added'); setDeptForm({ name: '', email: '' }); loadView('departments'); }
  async function addCat()         { if (!catForm.name || !catForm.department_id) return; await apiAddCategory(catForm); window.showToast?.('✅','Done','Category added'); setCatForm({ name: '', department_id: '' }); loadView('departments'); }
  async function deleteDept(id)   { if (!confirm('Delete department?')) return; await apiDeleteDept(id); loadView('departments'); }
  async function updateIssue()    { await apiUpdateIssue(selected.id, updateForm); window.showToast?.('✅','Updated','Issue updated'); setModal(false); loadView('issues'); }

  function logout() { clearAuth(); navigate('/login'); }

  const navItems = [
    { id: 'overview',     icon: '⊞', label: 'System Overview' },
    { id: 'issues',       icon: '≡', label: 'All Issues',     badge: analytics?.total_issues },
    { id: 'users',        icon: '◎', label: 'Users',          badge: analytics?.pending_approvals },
    { id: 'departments',  icon: '◇', label: 'Departments' },
    { id: 'analytics',    icon: '▦', label: 'Analytics' },
  ];

  const filteredIssues = issues.filter(i => {
    if (filterDept && String(i.department_id) !== filterDept) return false;
    if (filterPrio && i.priority !== filterPrio) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    if (search && !i.title?.toLowerCase().includes(search) && !i.reporter_name?.toLowerCase().includes(search)) return false;
    return true;
  });

  const statusMap = { 'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-mark">SA</div>
            <div><div className="brand-name" style={{ fontSize: 16 }}>UNIFIX</div><div className="brand-sub">Super Admin</div></div>
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">System Control</div>
          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
              <span className="nav-icon">{n.icon}</span> {n.label}
              {n.badge > 0 && <span className="nav-badge">{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info-block">
            <div className="user-avatar" style={{ background: 'var(--green-dark)' }}>SA</div>
            <div><div className="user-info-name">{user?.name}</div><div className="user-info-role">Super Admin</div></div>
          </div>
          <button className="nav-item mt-8" onClick={logout}><span className="nav-icon">⇲</span> Sign Out</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrap">

        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        {view === 'overview' && (
          <>
            <div className="topbar"><div><div className="topbar-title">System Overview</div><div className="topbar-subtitle">All systems operational</div></div></div>
            <div className="content">
              {loading ? <Spinner /> : analytics && (
                <>
                  <div className="grid-4 mb-16">
                    <div className="metric-card blue"><div className="metric-label">Total Issues</div><div className="metric-value" style={{ color: 'var(--blue-dark)' }}>{analytics.total_issues}</div></div>
                    <div className="metric-card red"><div className="metric-label">High Priority Open</div><div className="metric-value" style={{ color: 'var(--red-dark)' }}>{analytics.by_priority?.High}</div></div>
                    <div className="metric-card green"><div className="metric-label">Resolved</div><div className="metric-value" style={{ color: 'var(--green-dark)' }}>{analytics.by_status?.Resolved}</div></div>
                    <div className="metric-card amber"><div className="metric-label">Pending Approvals</div><div className="metric-value">{analytics.pending_approvals}</div></div>
                  </div>
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header"><div className="card-title">Department Breakdown</div></div>
                      <table className="data-table">
                        <thead><tr><th>Dept</th><th>Total</th><th>High</th><th>Resolved</th></tr></thead>
                        <tbody>
                          {analytics.dept_breakdown?.map(d => (
                            <tr key={d.name}>
                              <td className="fw-600">{d.name}</td>
                              <td className="mono">{d.total}</td>
                              <td className="mono" style={{ color: d.high > 0 ? 'var(--red-dark)' : 'inherit', fontWeight: d.high > 0 ? 700 : 400 }}>{d.high}</td>
                              <td className="mono text-green">{d.resolved}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="card">
                      <div className="card-header"><div className="card-title">System Status</div></div>
                      <table className="detail-table"><tbody>
                        <tr><th>Total Users</th><td className="mono fw-600">{analytics.total_users}</td></tr>
                        <tr><th>Pending Approvals</th><td className="mono" style={{ color: analytics.pending_approvals > 0 ? 'var(--red-dark)' : 'inherit' }}>{analytics.pending_approvals}</td></tr>
                        <tr><th>Emails Sent</th><td className="mono">{analytics.emails_sent}</td></tr>
                        <tr><th>Issues Pending</th><td className="mono">{analytics.by_status?.Pending}</td></tr>
                        <tr><th>Issues In Progress</th><td className="mono">{analytics.by_status?.['In Progress']}</td></tr>
                        <tr><th>AI Engine</th><td><span className="badge badge-low">ACTIVE</span></td></tr>
                      </tbody></table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── ALL ISSUES ───────────────────────────────────────────── */}
        {view === 'issues' && (
          <>
            <div className="topbar">
              <div><div className="topbar-title">All Issues — System-wide</div></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value.toLowerCase())} />
              </div>
            </div>
            <div className="content">
              <div className="filter-bar" style={{ marginBottom: 0 }}>
                <select className="filter-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select className="filter-select" value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
                  <option value="">All Priority</option>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option>Pending</option><option>In Progress</option><option>Resolved</option>
                </select>
              </div>
              <div className="table-wrap">
                {loading ? <Spinner /> :
                 !filteredIssues.length ? <EmptyState icon="📭" message="No issues found" /> :
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Issue</th><th>Reporter</th><th>Dept</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredIssues.map(i => (
                      <tr key={i.id}>
                        <td className="issue-id-cell">#UNF-{i.id}</td>
                        <td><div style={{ fontWeight: 500, fontSize: 13 }}>{i.title || '(No title)'}</div><div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{i.description?.slice(0,55)}...</div></td>
                        <td style={{ fontSize: 13 }}>{i.reporter_name}</td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{i.department_name || '—'}</td>
                        <td><span className={`badge badge-${i.priority?.toLowerCase()}`}>{i.priority?.toUpperCase()}</span></td>
                        <td><span className={`badge ${statusMap[i.status] || 'badge-closed'}`}>{i.status?.toUpperCase()}</span></td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gray-400)' }}>{new Date(i.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => { setSelected(i); setUpdateForm({ status: i.status, resolution_notes: i.resolution_notes || '', priority: i.priority, department_id: i.department_id || '' }); setModal(true); }}>View</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deleteIssue(i.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
              </div>
            </div>
          </>
        )}

        {/* ── USERS ────────────────────────────────────────────────── */}
        {view === 'users' && (
          <>
            <div className="topbar"><div><div className="topbar-title">User Management</div></div></div>
            <div className="content">
              <div className="table-wrap">
                {loading ? <Spinner /> :
                <table className="data-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="fw-600">{u.name}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{u.email}</td>
                        <td><span className="badge badge-closed">{u.role?.toUpperCase()}</span></td>
                        <td><span className={`badge ${u.is_approved ? 'badge-resolved' : 'badge-pending'}`}>{u.is_approved ? 'ACTIVE' : 'PENDING'}</span></td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gray-400)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {!u.is_approved && <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)}>Approve</button>}
                            {u.role !== 'super_admin' && <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
              </div>
            </div>
          </>
        )}

        {/* ── DEPARTMENTS ──────────────────────────────────────────── */}
        {view === 'departments' && (
          <>
            <div className="topbar"><div><div className="topbar-title">Department Management</div></div></div>
            <div className="content">
              <div className="grid-2 mb-16">
                <div className="card">
                  <div className="card-header"><div className="card-title">Add Department</div></div>
                  <div className="form-group">
                    <label className="form-label">Name <span className="req">*</span></label>
                    <input type="text" className="form-control" placeholder="e.g. Library Management" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" placeholder="dept@university.edu" value={deptForm.email} onChange={e => setDeptForm({...deptForm, email: e.target.value})} />
                  </div>
                  <button className="btn btn-primary" onClick={addDept}>+ Add Department</button>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title">Add Category</div></div>
                  <div className="form-group">
                    <label className="form-label">Department <span className="req">*</span></label>
                    <select className="form-control" value={catForm.department_id} onChange={e => setCatForm({...catForm, department_id: e.target.value})}>
                      <option value="">Select Department</option>
                      {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category Name <span className="req">*</span></label>
                    <input type="text" className="form-control" placeholder="e.g. Book Inquiry" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                  </div>
                  <button className="btn btn-secondary" onClick={addCat}>+ Add Category</button>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">All Departments</div></div>
                {loading ? <Spinner /> :
                <table className="data-table">
                  <thead><tr><th>Department</th><th>Email</th><th>Categories</th><th>SLA (H/M/L hrs)</th><th>Actions</th></tr></thead>
                  <tbody>
                    {depts.map(d => (
                      <tr key={d.id}>
                        <td className="fw-600">{d.name}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{d.email || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-500)', maxWidth: 200 }}>{d.categories?.map(c => c.name).join(', ') || '—'}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{d.sla_high}h / {d.sla_medium}h / {d.sla_low}h</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => deleteDept(d.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
              </div>
            </div>
          </>
        )}

        {/* ── ANALYTICS ────────────────────────────────────────────── */}
        {view === 'analytics' && (
          <>
            <div className="topbar"><div><div className="topbar-title">Analytics Dashboard</div></div></div>
            <div className="content">
              {loading ? <Spinner /> : analytics && (
                <>
                  <div className="grid-3 mb-16">
                    <div className="metric-card blue"><div className="metric-label">Total Issues</div><div className="metric-value" style={{ color: 'var(--blue-dark)' }}>{analytics.total_issues}</div></div>
                    <div className="metric-card green"><div className="metric-label">Resolved</div><div className="metric-value" style={{ color: 'var(--green-dark)' }}>{analytics.by_status?.Resolved}</div></div>
                    <div className="metric-card blue"><div className="metric-label">Emails Sent</div><div className="metric-value" style={{ color: 'var(--blue-dark)' }}>{analytics.emails_sent}</div></div>
                  </div>
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header"><div className="card-title">Issues by Priority</div></div>
                      <table className="data-table"><thead><tr><th>Priority</th><th>Count</th></tr></thead>
                      <tbody>
                        <tr><td><span className="badge badge-high">HIGH</span></td><td className="mono fw-600">{analytics.by_priority?.High}</td></tr>
                        <tr><td><span className="badge badge-medium">MEDIUM</span></td><td className="mono fw-600">{analytics.by_priority?.Medium}</td></tr>
                        <tr><td><span className="badge badge-low">LOW</span></td><td className="mono fw-600">{analytics.by_priority?.Low}</td></tr>
                      </tbody></table>
                    </div>
                    <div className="card">
                      <div className="card-header"><div className="card-title">Issues by Status</div></div>
                      <table className="data-table"><thead><tr><th>Status</th><th>Count</th></tr></thead>
                      <tbody>
                        <tr><td><span className="badge badge-pending">PENDING</span></td><td className="mono fw-600">{analytics.by_status?.Pending}</td></tr>
                        <tr><td><span className="badge badge-progress">IN PROGRESS</span></td><td className="mono fw-600">{analytics.by_status?.['In Progress']}</td></tr>
                        <tr><td><span className="badge badge-resolved">RESOLVED</span></td><td className="mono fw-600">{analytics.by_status?.Resolved}</td></tr>
                      </tbody></table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Issue Update Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={`Issue #UNF-${selected?.id}`} subtitle="Super Admin Override">
        {selected && (
          <div>
            <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderLeft: '4px solid var(--blue-dark)', padding: 14, marginBottom: 16, fontSize: 13, lineHeight: 1.65 }}>
              {selected.description}
            </div>
            <div className="grid-2 mb-12">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={updateForm.status} onChange={e => setUpdateForm({...updateForm, status: e.target.value})}>
                  <option>Pending</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority (Override)</label>
                <select className="form-control" value={updateForm.priority} onChange={e => setUpdateForm({...updateForm, priority: e.target.value})}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Resolution Notes</label>
              <textarea className="form-control" style={{ minHeight: 80 }}
                value={updateForm.resolution_notes} onChange={e => setUpdateForm({...updateForm, resolution_notes: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={updateIssue}>Save & Notify</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
