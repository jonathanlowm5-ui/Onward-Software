import { useEffect, useMemo, useState } from 'react';
import { BOk } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listAgents } from '../services/agentService';

// Map a backend agent record to this page's row shape.
const toRow = (a) => ({
  _id: a.id, n: a.fullName || a.username, em: a.email || '', u: a.username,
  ct: 'Rev Share · GGR', rate: `${Math.round((a.commissionRate || 0.2) * 100)}%`,
  dl: 0, earn: `₱${Number(a.earned || 0).toLocaleString()}`, pend: `₱${Number(a.pending || 0).toLocaleString()}`,
  on: a.status === 'approved' ? 1 : 0,
});

// Ported from V["agent-list"] (AGENTS module array).
const AGENTS_INIT = [
  { n: 'Marco Rivera', em: 'marco@onward.com', u: 'marco88', ct: 'Rev Share · GGR', rate: '5%', dl: 184, earn: '₱22,400', pend: '₱3,200', on: 1 },
  { n: 'Jenny Lim', em: 'jenny@onward.com', u: 'jenny_l', ct: 'Rev Share · GGR', rate: '4%', dl: 97, earn: '₱14,800', pend: '₱2,100', on: 1 },
  { n: 'Rey Santos', em: 'rey@onward.com', u: 'reysantos', ct: 'Rev Share · GGR', rate: '3.5%', dl: 63, earn: '₱8,640', pend: '₱1,400', on: 1 },
  { n: 'Dana Cruz', em: 'dana@onward.com', u: 'danacruz', ct: 'Rev Share · Deposit', rate: '3%', dl: 28, earn: '₱3,920', pend: '₱0', on: 0 },
];

export default function AgentList() {
  const { toast } = useUI();
  const [agents, setAgents] = useState(AGENTS_INIT);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  // Load live agents (approved ones created via the frontend apply + admin approval).
  useEffect(() => {
    let alive = true;
    listAgents({ status: 'approved' })
      .then((rows) => { if (alive && Array.isArray(rows) && rows.length) setAgents(rows.map(toRow)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return agents.filter((a) => {
      const hay = (a.n + ' ' + a.u + ' ' + a.em).toLowerCase();
      return hay.includes(ql) && (status === '' || String(a.on) === status);
    });
  }, [agents, q, status]);

  const exportAgents = () => toast('Agents exported 📋');

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">👤 Agent List</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage all agents, commission rates and downline players</div>
        </div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Add Agent — demo')}>＋ Add Agent</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Agents</div><div className="val">24</div><div className="trend" style={{ color: 'var(--muted)' }}>active accounts</div></div>
        <div className="card kpi g"><div className="lbl">Total Downline</div><div className="val">1,248</div><div className="trend" style={{ color: 'var(--muted)' }}>registered players</div></div>
        <div className="card kpi"><div className="lbl">Total Commission</div><div className="val">₱84,200</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Payout</div><div className="val">₱12,400</div><div className="trend" style={{ color: 'var(--muted)' }}>awaiting release</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>👥 All Agents</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <input className="qsearch" placeholder="Search agent…" value={q} onInput={(e) => setQ(e.target.value)} />
            <select className="qsearch" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
            <button className="mini-btn" onClick={exportAgents}>📋 Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1060 }}>
            <thead><tr><th>Agent</th><th>Username</th><th>Comm. Type</th><th>Comm. Rate</th><th>Downline</th><th>Total Earned</th><th>Pending</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map((a, i) => (
                <tr key={i}>
                  <td><div className="ag-name">{a.n}</div><div className="ag-email">{a.em}</div></td>
                  <td><span className="ag-user">{a.u}</span></td>
                  <td><span className="ag-type">{a.ct}</span></td>
                  <td><span className="ag-rate">{a.rate}</span></td>
                  <td>{a.dl}</td>
                  <td><span className="ag-earn">{a.earn}</span></td>
                  <td><span className={a.pend === '₱0' ? '' : 'ag-pend'}>{a.pend}</span></td>
                  <td>{a.on ? <BOk>Active</BOk> : <span className="sms-draft">Inactive</span>}</td>
                  <td>
                    <button className="icon-eye" onClick={() => toast(`Agent profile: ${a.n} — ${a.dl} downline · earned ${a.earn} · pending ${a.pend}`)}>👁</button>{' '}
                    <button className="icon-edit" onClick={() => toast(`Edit agent: ${a.n} — demo`)}>✏️</button>
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
