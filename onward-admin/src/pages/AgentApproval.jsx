import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listAgents, approveAgent, rejectAgent } from '../services/agentService';

// Map a backend agent record to the row shape this page renders.
const ST_MAP = { pending: 'pend', approved: 'app', rejected: 'rej' };
function toRow(a) {
  return {
    _id: a.id,
    n: a.fullName || a.username, em: a.email || '', u: a.username,
    ph: a.phone || '—', ap: (a.createdAt || '').slice(0, 10),
    rate: `${Math.round((a.commissionRate || 0.2) * 100)}%`, rsub: 'Revenue Share',
    ref: '—', st: ST_MAP[a.status] || 'pend',
    docs: a.status === 'approved' ? 'ver' : a.status === 'rejected' ? 'rej' : 'pend',
  };
}

// Ported from V["agent-approval"] (APPS array + AA_SES session counters).
const APPS_INIT = [
  { n: 'Carlo Mendoza', em: 'carlo@email.com', u: 'carlo_m', ph: '+63 912 111 2233', ap: '2026-06-01', rate: '5%', rsub: 'Revenue Share', ref: 'marco88', st: 'pend', docs: 'ver', prop: { type: 'Revenue Share', rate: '5%', applies: 'GGR' } },
  { n: 'Lisa Tan', em: 'lisa@email.com', u: 'lisatan', ph: '+63 917 444 5566', ap: '2026-06-02', rate: '4% + ₱100 CPA', rsub: 'Hybrid', ref: '—', st: 'pend', docs: 'pend', prop: { type: 'Hybrid', rate: '4% + ₱100 CPA', applies: 'GGR' } },
  { n: 'Roberto Cruz', em: 'bert@email.com', u: 'bert88', ph: '+63 918 777 8899', ap: '2026-05-28', rate: '3.5%', rsub: 'Revenue Share', ref: 'jenny_l', st: 'app', docs: 'ver', prop: { type: 'Revenue Share', rate: '3.5%', applies: 'GGR' } },
  { n: 'Maria Reyes', em: 'maria@email.com', u: 'mariareyes', ph: '+63 919 000 1122', ap: '2026-05-25', rate: '₱120 CPA', rsub: 'CPA', ref: '—', st: 'rej', docs: 'rej', prop: { type: 'CPA', rate: '₱120 CPA', applies: 'FTD' } },
];

const docBadge = (docs) =>
  docs === 'ver' ? <span className="aa-status2 s-ver">Verified</span>
  : docs === 'pend' ? <span className="aa-status2 s-pend">Pending</span>
  : <span className="aa-status2 s-rej">Rejected</span>;

const stBadge = (st) =>
  st === 'pend' ? <span className="aa-status2 s-pend">⏳ Pending</span>
  : st === 'app' ? <span className="aa-status2 s-app">✅ Approved</span>
  : <span className="aa-status2 s-rej">✗ Rejected</span>;

export default function AgentApproval() {
  const { toast } = useUI();
  const [apps, setApps] = useState(APPS_INIT);
  const [ses, setSes] = useState({ app: 1, rej: 0 });
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');

  // Load live agent applications from the backend (frontend "apply" flow).
  useEffect(() => {
    let alive = true;
    listAgents()
      .then((rows) => { if (alive && Array.isArray(rows) && rows.length) setApps(rows.map(toRow)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  // Approve / reject a single live application.
  const decide = async (row, ok) => {
    if (row._id) {
      try { await (ok ? approveAgent(row._id) : rejectAgent(row._id)); }
      catch (e) { toast(e.message || 'Action failed'); return; }
    }
    setApps((prev) => prev.map((a) => (a === row ? { ...a, st: ok ? 'app' : 'rej', docs: ok ? 'ver' : 'rej' } : a)));
    setSes((prev) => ({ app: prev.app + (ok ? 1 : 0), rej: prev.rej + (ok ? 0 : 1) }));
    toast(ok ? `Approved ${row.n} ✅ — agent activated` : `Rejected ${row.n} ✗`);
  };

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return apps.filter((a) => (a.n + ' ' + a.u + ' ' + a.em).toLowerCase().includes(ql) && (!st || a.st === st));
  }, [apps, q, st]);

  const pendingCount = apps.filter((a) => a.st === 'pend').length;

  const bulk = async (ok) => {
    const pend = apps.filter((a) => a.st === 'pend');
    if (!pend.length) { toast('No pending applications'); return; }
    await Promise.all(pend.filter((a) => a._id).map((a) => (ok ? approveAgent(a._id) : rejectAgent(a._id)).catch(() => {})));
    setApps((prev) => prev.map((a) => (a.st === 'pend' ? { ...a, st: ok ? 'app' : 'rej', docs: ok ? 'ver' : 'rej' } : a)));
    setSes((prev) => ({ app: prev.app + (ok ? pend.length : 0), rej: prev.rej + (ok ? 0 : pend.length) }));
    toast(ok ? `Approved ${pend.length} applications ✅ — agents activated` : `Rejected ${pend.length} applications ✗`);
  };

  const reset = () => { setQ(''); setSt(''); };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">✅ Agent Approval</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Review and approve / reject new agent registration requests</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn green" onClick={() => bulk(1)}>✅ Approve All</button>
          <button className="btn-cancel-red" style={{ padding: '8px 14px' }} onClick={() => bulk(0)}>✗ Reject All</button>
        </span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Review</div><div className="val">{pendingCount}</div><div className="trend" style={{ color: 'var(--muted)' }}>awaiting decision</div></div>
        <div className="card kpi g"><div className="lbl">Approved Today</div><div className="val">{ses.app}</div><div className="trend" style={{ color: 'var(--muted)' }}>this session</div></div>
        <div className="card kpi r"><div className="lbl">Rejected Today</div><div className="val">{ses.rej}</div><div className="trend" style={{ color: 'var(--muted)' }}>this session</div></div>
        <div className="card kpi b"><div className="lbl">Total Approved</div><div className="val">24</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="form-grid" style={{ gridTemplateColumns: '3fr 1fr 1fr auto', alignItems: 'end' }}>
          <div className="fld"><label>Search</label><input placeholder="Name, username, email…" value={q} onInput={(e) => setQ(e.target.value)} /></div>
          <div className="fld"><label>Status</label>
            <select value={st} onChange={(e) => setSt(e.target.value)}>
              <option value="">All</option><option value="pend">Pending</option><option value="app">Approved</option><option value="rej">Rejected</option>
            </select>
          </div>
          <div className="fld"><label>Date Range</label>
            <select><option>All Time</option><option>Today</option><option>7 Days</option><option>30 Days</option></select>
          </div>
          <button className="gl-reset" onClick={reset} title="Reset">↺</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📄 Agent Applications</div>
          <span className="pr"><button className="mini-btn" onClick={() => toast('Exported! ⬇ agent-applications.csv')}>📋 Export</button></span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1100 }}>
            <thead><tr><th>Applicant</th><th>Username</th><th>Contact</th><th>Applied</th><th>Comm. Rate</th><th>Referrer</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map((a, i) => (
                <tr key={i}>
                  <td><div className="ag-name">{a.n}</div><div className="ag-email">{a.em}</div></td>
                  <td><span className="ag-user">{a.u}</span></td>
                  <td>{a.ph}</td><td style={{ color: '#aab4cc' }}>{a.ap}</td>
                  <td><span className="rate-cell">{a.rate}</span><span className="rate-sub">{a.rsub}</span></td>
                  <td><span className="ag-user" style={{ color: '#aab4cc' }}>{a.ref}</span></td>
                  <td>{stBadge(a.st)}{docBadge(a.docs)}</td>
                  <td>
                    {a.st === 'pend'
                      ? <span style={{ display: 'flex', gap: 6 }}>
                          <button className="mini-btn green" style={{ padding: '7px 12px', fontSize: '.72rem' }} onClick={() => decide(a, 1)}>✅ Approve</button>
                          <button className="btn-cancel-red" style={{ padding: '7px 12px', fontSize: '.72rem' }} onClick={() => decide(a, 0)}>✗ Reject</button>
                        </span>
                      : <button className="mini-btn" onClick={() => toast(`Application: ${a.n} — ${a.st === 'app' ? 'approved' : 'rejected'} · ${a.rate}`)}>👁 View</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
