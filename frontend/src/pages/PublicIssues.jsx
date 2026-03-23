// UNIFIX – PublicIssues.jsx
import React, { useState, useEffect, useRef } from 'react';
import { apiPublicIssues, apiMeta } from '../api';
import IssueCard from '../components/IssueCard';
import { Spinner, EmptyState } from '../components/Toast';

export function PublicIssues() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [depts, setDepts]       = useState([]);
  const [deptF, setDeptF]       = useState('');
  const [prioF, setPrioF]       = useState('');

  useEffect(() => {
    apiMeta().then(r => setDepts(r.data)).catch(() => {});
    apiPublicIssues()
      .then(r => setIssues(r.data))
      .catch(() => window.showToast?.('❌', 'Error', 'Failed to load public issues', true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = issues.filter(i => {
    if (deptF && String(i.department_id) !== deptF) return false;
    if (prioF && i.priority !== prioF) return false;
    return true;
  });

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Public Issues</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Campus-wide complaints with public visibility</div>
        </div>
      </div>
      <div style={{ padding: '24px 28px' }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <select className="filter-select" value={deptF} onChange={e => setDeptF(e.target.value)}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="filter-select" value={prioF} onChange={e => setPrioF(e.target.value)}>
            <option value="">All Priority</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
        <div style={{ marginTop: 0 }}>
          {loading ? <Spinner /> :
           !filtered.length ? <EmptyState icon="🌍" message="No public issues" sub="Public issues appear here when users set visibility to Public" /> :
           filtered.map(i => <IssueCard key={i.id} issue={i} />)}
        </div>
      </div>
    </div>
  );
}

export default PublicIssues;


// ─────────────────────────────────────────────────────────────────────────────
// LOST & FOUND PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function LostFound() {
  const items = [
    { id: 1, type: 'lost',  title: 'Black Dell Laptop Bag', location: 'Library, 2nd Floor', desc: 'Has stickers, charger inside', contact: 'arjun@uni.edu', date: '17 Jan' },
    { id: 2, type: 'found', title: 'Blue Water Bottle',      location: 'Near Canteen B',     desc: 'Sipper bottle with name tag', contact: '9876543210',   date: '16 Jan' },
    { id: 3, type: 'lost',  title: 'Student ID Card – 22CS045', location: 'Academic Block', desc: 'Arjun Reddy ID card', contact: 'arjun@uni.edu',    date: '15 Jan' },
    { id: 4, type: 'found', title: 'Gray Hoodie – XL',       location: 'Sports Ground',      desc: 'Left near cricket nets',     contact: '9123456780',   date: '14 Jan' },
  ];
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all' ? items : items.filter(i => i.type === tab);

  return (
    <div style={{ background: 'var(--gray-50)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Lost &amp; Found</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Post and find lost items on campus</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => window.showToast?.('📦', 'Post Item', 'Feature available in full build')}>+ Post Item</button>
      </div>
      <div style={{ padding: '24px 28px' }}>
        <div className="tab-bar">
          {['all','lost','found'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)} Items</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderLeft: `4px solid ${item.type === 'lost' ? 'var(--red-dark)' : 'var(--green-dark)'}`, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${item.type === 'lost' ? 'badge-high' : 'badge-low'}`}>{item.type.toUpperCase()}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</span>
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--gray-400)' }}>{item.date}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>{item.desc}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--gray-400)' }}>
                <span>📍 {item.location}</span>
                <span>📞 {item.contact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT PAGE
// ─────────────────────────────────────────────────────────────────────────────

export function Chat() {
  const [messages, setMessages] = useState([{
    role: 'ai', text: "Hello! I'm the UNIFIX AI Assistant. I can help you:\n\n• Track your issue status\n• Submit or escalate issues\n• Find the right department\n• Answer campus FAQs\n\nWhat can I help you with today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  const AI_RESP = {
    'my issues':    () => "📋 You can view all your submitted issues in **My Issues** page. I'll take you there now!",
    'status':       () => "🔍 To check issue status:\n1. Go to **My Issues** from the navbar\n2. Find your issue by ID\n3. Status shows: Pending → In Progress → Resolved",
    'wifi':         () => "📡 **WiFi Issues → ITKM Department**\n\nContact: itkm@university.edu\nSLA: 12h (High) / 36h (Medium)\n\nTip: Include your block/room number and when it started.",
    'urgent':       () => "🚨 **Reporting Urgent Issues:**\n\n1. Click **+ Report Issue** in the navbar\n2. Describe clearly — mention location & danger\n3. AI auto-detects hazards and sets HIGH priority\n4. CLM/Electrical team notified immediately",
    'department':   () => "🏢 **Campus Departments:**\n• CLM — Hostel, AC, Water, Building\n• ITKM — WiFi, Computers, Projectors\n• Electrical — Power, Switchboard, Lights\n• Maintenance — Furniture, Plumbing\n• Transport — Bus, Parking\n• Sports — Ground, Court, Gym",
    'escalate':     () => "⬆️ To escalate an issue:\n1. Go to **My Issues**\n2. Open the issue\n3. Contact the Super Admin if SLA is breached\n4. Or use the AI assistant to flag urgency",
    'lost':         () => "🔍 Found or lost something? Go to **Lost & Found** in the navbar to post or search for items.",
    'hello':        () => "👋 Hello! How can I assist you with the UNIFIX campus system today?",
    'hi':           () => "👋 Hi there! Ask me about your issues, departments, or campus services.",
    'sla':          () => "⏱️ **SLA Policy:**\n• High Priority: 24 hours\n• Medium Priority: 48 hours\n• Low Priority: 72 hours\n\nBreached SLAs trigger automatic admin alerts.",
  };

  function sendMsg() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const low = input.toLowerCase();
      let reply = "🤔 I can help with issue tracking, campus departments, and reporting problems. Try asking 'show my issues' or 'which department handles WiFi?'";
      for (const [key, fn] of Object.entries(AI_RESP)) {
        if (low.includes(key)) { reply = fn(); break; }
      }
      const aiMsg = { role: 'ai', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(m => [...m, aiMsg]);
      setTyping(false);
    }, 600 + Math.random() * 500);
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const chips = ['My open issues', 'Track issue status', 'Report urgent issue', 'Department info', 'SLA policy'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--gray-200)', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', fontFamily: 'var(--mono)', fontWeight: 700 }}>AI</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>UNIFIX AI Assistant</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--green-dark)', display: 'inline-block' }}></span>
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--gray-50)' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', maxWidth: 600 }}>
            <div style={{ width: 30, height: 30, background: m.role === 'user' ? 'var(--green-dark)' : 'var(--blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--white)', flexShrink: 0 }}>
              {m.role === 'user' ? 'U' : 'AI'}
            </div>
            <div>
              <div style={{ padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: 480, border: '1px solid var(--border)', background: m.role === 'user' ? 'var(--blue-dark)' : 'var(--white)', color: m.role === 'user' ? 'var(--white)' : 'var(--black)' }}
                dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') }}
              />
              <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 3, fontFamily: 'var(--mono)', textAlign: m.role === 'user' ? 'right' : 'left' }}>{m.time}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-start' }}>
            <div style={{ width: 30, height: 30, background: 'var(--blue-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--white)' }}>AI</div>
            <div style={{ padding: '12px 14px', border: '1px solid var(--border)', background: 'var(--white)', display: 'flex', gap: 4 }}>
              {[0, 200, 400].map(delay => (
                <div key={delay} style={{ width: 5, height: 5, background: 'var(--gray-400)', animation: `tdot 1.2s ${delay}ms infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px', background: 'var(--white)', borderTop: '2px solid var(--gray-200)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {chips.map(c => (
            <button key={c} onClick={() => { setInput(c); }} style={{ padding: '5px 12px', border: '1px solid var(--border-dark)', background: 'var(--white)', color: 'var(--gray-600)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue-dark)'; e.currentTarget.style.color = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--blue-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--gray-600)'; e.currentTarget.style.borderColor = 'var(--border-dark)'; }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, border: '2px solid var(--border)', padding: '8px 12px' }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--blue-dark)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <input style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font)', fontSize: 13, background: 'transparent' }}
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()} />
          <button onClick={sendMsg} style={{ background: 'var(--green-dark)', border: 'none', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--white)' }}>➤</button>
        </div>
      </div>
      <style>{`@keyframes tdot { 0%,60%,100%{opacity:.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-4px)} }`}</style>
    </div>
  );
}
