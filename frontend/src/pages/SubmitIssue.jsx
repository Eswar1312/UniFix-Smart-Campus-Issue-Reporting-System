// UNIFIX – SubmitIssue.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiSubmitIssue, apiSubmitIssueWithFile, apiMeta } from '../api';

// ── Client-side AI simulation (mirrors backend rule engine) ────────
const HIGH_KW  = ['leak','leaking','electric','switchboard','fire','smoke','gas','unsafe','hazard','dangerous','injury','sparking','shock','flood','flooding','burst','emergency','urgent','contaminated','poison'];
const MED_KW   = ['wifi','internet','projector','computer','server','printer','classroom','exam','broken','not working','ac','network','lab','faculty','seminar','course'];
const DEPT_MAP = {
  CLM:        ['hostel','water','pipe','ceiling','door','ac','lift','building','room','accommodation'],
  ITKM:       ['wifi','internet','projector','computer','server','printer','software','network','portal','tech','login','access'],
  Electrical: ['electric','switchboard','power','light','bulb','fan','sparking','wire','generator','current','voltage'],
  Maintenance:['repair','broken','damage','flush','toilet','furniture','desk','bench','plumbing','cleaning'],
  Transport:  ['bus','transport','vehicle','shuttle','parking','route','cab','driver'],
  Sports:     ['sports','ground','court','cricket','football','gym','equipment','stadium'],
};

function clientAI(text) {
  const low = text.toLowerCase();
  let priority = 'Low', reason = 'No urgent keywords detected. Assigned LOW priority.', dept = 'CLM', maxScore = 0;
  const keywords = [];

  for (const kw of HIGH_KW) if (low.includes(kw)) {
    priority = 'High'; reason = `Safety keyword "${kw}" detected. Priority elevated to HIGH automatically.`;
    keywords.push({ w: kw, flagged: true }); break;
  }
  if (priority !== 'High') for (const kw of MED_KW) if (low.includes(kw)) {
    priority = 'Medium'; reason = `Equipment keyword "${kw}" detected. Assigned MEDIUM priority.`;
    keywords.push({ w: kw, flagged: false }); break;
  }
  for (const [d, words] of Object.entries(DEPT_MAP)) {
    const score = words.filter(w => low.includes(w)).length;
    if (score > maxScore) { maxScore = score; dept = d; }
    words.filter(w => low.includes(w) && !keywords.find(k => k.w === w)).forEach(w => keywords.push({ w, flagged: HIGH_KW.includes(w) }));
  }
  return { priority, reason, dept, keywords: keywords.slice(0, 8) };
}

export default function SubmitIssue() {
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef();
  const [form, setForm] = useState({ title: '', description: '', department_id: '', category_id: '', location: '', visibility: 'private' });
  const [departments, setDepts] = useState([]);
  const [categories, setCats]   = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading]   = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiMeta().then(r => setDepts(r.data)).catch(() => {});
  }, []);

  function onDescChange(val) {
    setForm(f => ({ ...f, description: val }));
    clearTimeout(debounceRef.current);
    if (val.trim().length < 10) { setAiResult(null); return; }
    debounceRef.current = setTimeout(() => setAiResult(clientAI(val)), 450);
  }

  function onDeptChange(deptId) {
    setForm(f => ({ ...f, department_id: deptId, category_id: '' }));
    const dept = departments.find(d => String(d.id) === deptId);
    setCats(dept?.categories || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      window.showToast?.('⚠️', 'Required', 'Issue description is mandatory', true);
      return;
    }
    setLoading(true);
    try {
      let res;
      if (imageFile) {
        // multipart upload
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
        fd.append('image', imageFile);
        res = await apiSubmitIssueWithFile(fd);
      } else {
        const payload = { ...form };
        if (!payload.department_id) delete payload.department_id;
        if (!payload.category_id)   delete payload.category_id;
        res = await apiSubmitIssue(payload);
      }
      const { issue, ai } = res.data;
      window.showToast?.('⚡', 'Issue Submitted!', `Priority: ${ai?.priority || issue.priority} · Dept: ${issue.department_name || 'TBD'}`);
      setTimeout(() => navigate('/my-issues'), 1400);
    } catch (err) {
      const msg = err.response?.data?.error || 'Submission failed';
      window.showToast?.('❌', 'Error', msg, true);
    } finally {
      setLoading(false);
    }
  }

  const pMap = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 56px)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Report an Issue</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Describe your problem — AI handles the rest</div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Form */}
          <div className="card">
            <div className="card-header"><div className="card-title">Issue Details</div></div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Issue Title</label>
                <input type="text" className="form-control" placeholder="Brief summary (optional)"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Description <span className="req">*</span></label>
                <textarea className="form-control" placeholder='Describe your problem in detail. E.g. "AC water is leaking near the switchboard in Hostel Block B, Room 204. It looks dangerous."'
                  value={form.description} onChange={e => onDescChange(e.target.value)} style={{ minHeight: 120 }} />
                <div className="form-hint">Be specific — location, time, and severity help AI classify accurately</div>
              </div>

              {/* AI Live Result */}
              {aiResult && (
                <div style={{ background: '#f0fdf4', border: '1px solid var(--green-border)', borderLeft: '4px solid var(--green-dark)', padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green-dark)', marginBottom: 12 }}>
                    🤖 AI Live Analysis
                    <span style={{ background: 'var(--green-dark)', color: 'var(--white)', fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 6px' }}>LIVE</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Priority</div>
                      <span className={`badge ${pMap[aiResult.priority]}`}>{aiResult.priority.toUpperCase()}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Department</div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--blue-dark)' }}>{aiResult.dept}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 6 }}>Keywords</div>
                    <div>{aiResult.keywords.map((k, i) => (
                      <span key={i} style={{ display: 'inline-block', background: k.flagged ? 'var(--red-light)' : 'var(--green-light)', color: k.flagged ? 'var(--red-dark)' : 'var(--green-dark)', border: `1px solid ${k.flagged ? 'var(--red-border)' : 'var(--green-border)'}`, fontFamily: 'var(--mono)', fontSize: 11, padding: '2px 8px', margin: 2 }}>{k.w}</span>
                    ))}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gray-500)', marginBottom: 4 }}>Reasoning</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.55 }}>{aiResult.reason}</div>
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: 'var(--gray-200)', margin: '16px 0' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Department (Optional)</label>
                  <select className="form-control" value={form.department_id} onChange={e => onDeptChange(e.target.value)}>
                    <option value="">AI will auto-assign</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category (Optional)</label>
                  <select className="form-control" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} disabled={!categories.length}>
                    <option value="">Select department first</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location (Optional)</label>
                  <input type="text" className="form-control" placeholder="Block B, Room 204, 2nd Floor"
                    value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visibility</label>
                  <select className="form-control" value={form.visibility} onChange={e => setForm({...form, visibility: e.target.value})}>
                    <option value="private">Private (only you + admins)</option>
                    <option value="public">Public (visible to all users)</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? '⏳ Submitting...' : '⚡ Submit Issue'}
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><div className="card-title">How It Works</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  ['✓', 'done',    'Describe your issue', 'Plain language, no forms to fill'],
                  ['●', 'current', 'AI classifies instantly', 'Priority + Department auto-assigned'],
                  ['3', 'pending', 'Email sent to department', 'Admin notified immediately'],
                  ['4', 'pending', 'Track your issue', 'Live status via My Issues'],
                ].map(([dot, cls, title, sub], i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, paddingBottom: i < 3 ? 18 : 0, position: 'relative' }}>
                    {i < 3 && <div style={{ position: 'absolute', left: 11, top: 24, bottom: 0, width: 1, background: 'var(--gray-200)' }}></div>}
                    <div style={{ width: 24, height: 24, flexShrink: 0, border: '2px solid', borderColor: cls === 'done' ? 'var(--green-dark)' : cls === 'current' ? 'var(--blue-dark)' : 'var(--gray-300)', background: cls === 'done' ? 'var(--green-dark)' : cls === 'current' ? 'var(--blue-dark)' : 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: cls === 'pending' ? 'var(--gray-400)' : 'var(--white)', zIndex: 1, position: 'relative' }}>{dot}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Priority Guide</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { prio: 'HIGH',   bg: 'var(--red-light)',   border: 'var(--red-border)', left: 'var(--red-dark)', text: 'Safety hazards, electrical issues, water leaks, fire, gas leaks' },
                  { prio: 'MEDIUM', bg: 'var(--amber-light)', border: 'var(--amber-border)', left: '#d97706', text: 'WiFi/IT failures, projectors, academic disruptions, exam halls' },
                  { prio: 'LOW',    bg: 'var(--green-light)', border: 'var(--green-border)', left: 'var(--green-dark)', text: 'Minor comfort issues, cosmetic damage, suggestions' },
                ].map(p => (
                  <div key={p.prio} style={{ background: p.bg, border: `1px solid ${p.border}`, borderLeft: `4px solid ${p.left}`, padding: 12 }}>
                    <div style={{ marginBottom: 4 }}><span className={`badge badge-${p.prio.toLowerCase()}`}>{p.prio}</span></div>
                    <div style={{ fontSize: 11, color: p.left, lineHeight: 1.5 }}>{p.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
