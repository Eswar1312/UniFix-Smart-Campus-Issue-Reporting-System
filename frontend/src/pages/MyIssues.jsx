// UNIFIX – MyIssues.jsx
import { useState, useEffect } from 'react';
import { apiMyIssues, apiGetIssue } from '../api';
import IssueCard from '../components/IssueCard';
import { Spinner, EmptyState, Modal, AiPanel } from '../components/Toast';

export default function MyIssues() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModal]   = useState(false);
  const [statusF, setStatusF]   = useState('');
  const [prioF, setPrioF]       = useState('');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    apiMyIssues()
      .then(r => setIssues(r.data))
      .catch(() => window.showToast?.('❌', 'Error', 'Failed to load issues', true))
      .finally(() => setLoading(false));
  }, []);

  function openDetail(issue) { setSelected(issue); setModal(true); }

  const filtered = issues.filter(i => {
    if (statusF && i.status !== statusF) return false;
    if (prioF && i.priority !== prioF) return false;
    if (search && !i.title?.toLowerCase().includes(search) && !i.description?.toLowerCase().includes(search)) return false;
    return true;
  });

  const statusMap = { 'Pending': 'badge-pending', 'In Progress': 'badge-progress', 'Resolved': 'badge-resolved', 'Closed': 'badge-closed' };

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 56px)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>My Issues</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Track all your submitted complaints</div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Filters */}
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            <option>Pending</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
          </select>
          <select className="filter-select" value={prioF} onChange={e => setPrioF(e.target.value)}>
            <option value="">All Priority</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <input type="text" className="search-input" placeholder="Search issues..."
            value={search} onChange={e => setSearch(e.target.value.toLowerCase())} />
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? <Spinner /> :
           !filtered.length ? <EmptyState icon="📭" message="No issues found" sub={issues.length ? 'Try adjusting your filters' : 'No complaints submitted yet'} /> :
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Title / Description</th><th>Department</th>
                <th>Priority</th><th>Status</th><th>Submitted</th><th>SLA</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td className="issue-id-cell">#UNF-{i.id}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{i.title || '(No title)'}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{i.description?.slice(0, 60)}...</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{i.department_name || '—'}</td>
                  <td><span className={`badge badge-${i.priority?.toLowerCase()}`}>{i.priority?.toUpperCase()}</span></td>
                  <td><span className={`badge ${statusMap[i.status] || 'badge-closed'}`}>{i.status?.toUpperCase()}</span></td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gray-500)' }}>
                    {new Date(i.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td>
                    {i.sla_deadline && i.status !== 'Resolved' ? (
                      <div>
                        <div className="sla-bar"><div className={`sla-fill sla-ok`} style={{ width: '60%' }}></div></div>
                        <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--gray-400)', marginTop: 2 }}>
                          {new Date(i.sla_deadline).toLocaleDateString()}
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>—</span>}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openDetail(i)}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      </div>

      {/* Issue Detail Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModal(false)}
        title={`Issue #UNF-${selected?.id}`}
        subtitle={selected?.title || selected?.description?.slice(0, 60)}>
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`badge badge-${selected.priority?.toLowerCase()}`}>{selected.priority?.toUpperCase()}</span>
              <span className={`badge ${statusMap[selected.status] || 'badge-closed'}`}>{selected.status?.toUpperCase()}</span>
              <span className={`badge badge-${selected.visibility}`}>{selected.visibility?.toUpperCase()}</span>
            </div>

            <table className="detail-table" style={{ marginBottom: 16 }}>
              <tbody>
                <tr><th>Department</th><td>{selected.department_name || 'Unassigned'}</td></tr>
                <tr><th>Category</th><td>{selected.category_name || '—'}</td></tr>
                <tr><th>Location</th><td>{selected.location || '—'}</td></tr>
                <tr><th>Submitted</th><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{new Date(selected.created_at).toLocaleString()}</td></tr>
                {selected.resolved_at && <tr><th>Resolved</th><td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{new Date(selected.resolved_at).toLocaleString()}</td></tr>}
              </tbody>
            </table>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 8 }}>Description</div>
              <div style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', borderLeft: '4px solid var(--blue-dark)', padding: '12px 14px', fontSize: 13, lineHeight: 1.65 }}>
                {selected.description}
              </div>
            </div>

            {selected.resolution_notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 8 }}>Resolution Notes</div>
                <div style={{ background: 'var(--green-light)', border: '1px solid var(--green-border)', borderLeft: '4px solid var(--green-dark)', padding: '12px 14px', fontSize: 13 }}>
                  {selected.resolution_notes}
                </div>
              </div>
            )}

            {selected.ai_keywords && (
              <AiPanel keywords={selected.ai_keywords} reason={selected.ai_reason} dept={selected.department_name} priority={selected.priority} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
