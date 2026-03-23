// UNIFIX – LostFound.jsx  (fully wired to backend)
import { useState, useEffect, useRef } from 'react';
import { apiLostFound, apiPostLostFound, apiResolveLostFound, apiDeleteLostFound, getUser } from '../api';
import { Spinner, EmptyState, Modal } from '../components/Toast';

export default function LostFound() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('all');
  const [modal, setModal]       = useState(false);
  const [submitting, setSubmit] = useState(false);
  const [preview, setPreview]   = useState(null);
  const [form, setForm]         = useState({ item_type:'lost', title:'', description:'', location:'', contact_info:'' });
  const fileRef                 = useRef(null);
  const user                    = getUser();

  useEffect(() => { load(); }, [tab]);

  function load() {
    setLoading(true);
    const params = {};
    if (tab !== 'all') params.type = tab;
    apiLostFound(params)
      .then(r => setItems(r.data))
      .catch(() => window.showToast?.('❌','Error','Failed to load items', true))
      .finally(() => setLoading(false));
  }

  async function handlePost(e) {
    e.preventDefault();
    if (!form.title.trim()) { window.showToast?.('⚠️','Required','Title is required', true); return; }
    setSubmit(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (fileRef.current?.files[0]) fd.append('image', fileRef.current.files[0]);
      await apiPostLostFound(fd);
      window.showToast?.('✅','Posted!',`Your ${form.item_type} item has been posted`);
      setModal(false);
      setForm({ item_type:'lost', title:'', description:'', location:'', contact_info:'' });
      setPreview(null);
      load();
    } catch(err) {
      window.showToast?.('❌','Error', err.response?.data?.error || 'Post failed', true);
    } finally { setSubmit(false); }
  }

  async function handleResolve(id) {
    await apiResolveLostFound(id);
    window.showToast?.('✅','Resolved','Item marked as found/resolved');
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this item?')) return;
    await apiDeleteLostFound(id);
    window.showToast?.('🗑️','Deleted','Item removed');
    load();
  }

  const typeColor = { lost:'var(--red-dark)', found:'var(--green-dark)' };

  return (
    <div style={{ background:'var(--gray-50)', minHeight:'calc(100vh - 56px)' }}>
      <div style={{ background:'var(--white)', borderBottom:'2px solid var(--gray-200)', padding:'0 28px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700 }}>Lost &amp; Found</div>
          <div style={{ fontSize:12, color:'var(--gray-500)' }}>Post and find lost items on campus</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Post Item</button>
      </div>

      <div style={{ padding:'24px 28px' }}>
        <div className="tab-bar">
          {['all','lost','found'].map(t => (
            <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)} Items
            </button>
          ))}
        </div>

        {loading ? <Spinner /> :
         !items.length ? <EmptyState icon="🔍" message="No items posted yet" sub={`No ${tab === 'all' ? '' : tab+' '}items found`} /> :
         <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
           {items.map(item => (
             <div key={item.id} style={{ background:'var(--white)', border:'1px solid var(--border)', borderLeft:`4px solid ${typeColor[item.item_type]}`, padding:'16px 18px' }}>
               <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                 <div style={{ flex:1 }}>
                   <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                     <span className={`badge ${item.item_type==='lost'?'badge-high':'badge-low'}`}>{item.item_type.toUpperCase()}</span>
                     <span style={{ fontSize:14, fontWeight:600 }}>{item.title}</span>
                     {item.is_resolved && <span className="badge badge-resolved">RESOLVED</span>}
                   </div>
                   {item.description && <div style={{ fontSize:13, color:'var(--gray-500)', marginBottom:8 }}>{item.description}</div>}
                   <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--gray-400)', flexWrap:'wrap' }}>
                     {item.location     && <span>📍 {item.location}</span>}
                     {item.contact_info && <span>📞 {item.contact_info}</span>}
                     <span>👤 {item.poster_name}</span>
                     <span style={{ fontFamily:'var(--mono)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                   </div>
                   {item.image_path && (
                     <img src={`/uploads/${item.image_path}`} alt="item"
                       style={{ marginTop:10, maxWidth:200, maxHeight:140, border:'1px solid var(--border)', objectFit:'cover', display:'block' }} />
                   )}
                 </div>
                 {(item.poster_name === user?.name || user?.role === 'super_admin') && !item.is_resolved && (
                   <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:12 }}>
                     <button className="btn btn-outline btn-sm" onClick={() => handleResolve(item.id)}>Mark Resolved</button>
                     <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                   </div>
                 )}
               </div>
             </div>
           ))}
         </div>
        }
      </div>

      {/* Post Item Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Post a Lost / Found Item">
        <form onSubmit={handlePost}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Type <span className="req">*</span></label>
              <select className="form-control" value={form.item_type} onChange={e => setForm({...form, item_type:e.target.value})}>
                <option value="lost">Lost — I lost something</option>
                <option value="found">Found — I found something</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title <span className="req">*</span></label>
              <input type="text" className="form-control" placeholder="e.g. Black Dell laptop bag"
                value={form.title} onChange={e => setForm({...form, title:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" style={{ minHeight:80 }} placeholder="Describe the item in detail..."
              value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Last Seen / Found Location</label>
              <input type="text" className="form-control" placeholder="Library, 2nd Floor"
                value={form.location} onChange={e => setForm({...form, location:e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Info</label>
              <input type="text" className="form-control" placeholder="Phone or email"
                value={form.contact_info} onChange={e => setForm({...form, contact_info:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Photo (optional)</label>
            <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }}
              onChange={e => { const f = e.target.files[0]; if(f) setPreview(URL.createObjectURL(f)); }} />
            <div style={{ border:'2px dashed var(--border-dark)', padding:20, textAlign:'center', cursor:'pointer', background:'var(--gray-50)' }}
              onClick={() => fileRef.current.click()}>
              {preview
                ? <img src={preview} alt="preview" style={{ maxHeight:120, maxWidth:'100%', objectFit:'cover' }} />
                : <div><div style={{ fontSize:24, marginBottom:6 }}>📷</div><div className="text-sm text-muted">Click to attach a photo</div></div>
              }
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Posting...' : 'Post Item'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
