import { useEffect, useMemo, useState } from 'react';
import { BOk } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listAgents, agentPlayers, downloadCsv } from '../services/agentService';

/*
 * Agent Players — every player referred by an agent (live downline data:
 * deposits, wager, GGR from the bets ledger).
 */
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function AgentPlayers() {
  const { toast } = useUI();
  const [agents, setAgents] = useState([]);
  const [rows, setRows] = useState([]); // [{...player, agentUsername, agentCode}]
  const [loaded, setLoaded] = useState(false);
  const [ag, setAg] = useState('');
  const [q, setQ] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listAgents();
        if (!alive) return;
        setAgents(Array.isArray(list) ? list : []);
        const all = await Promise.all((list || []).map((a) =>
          agentPlayers(a.id).then((r) => (r.players || []).map((p) => ({ ...p, agentId: a.id, agentUsername: a.username, agentCode: a.code }))).catch(() => [])));
        if (alive) setRows(all.flat());
      } finally { if (alive) setLoaded(true); }
    })();
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return rows.filter((p) =>
      (!ag || String(p.agentId) === ag)
      && (!ql || [p.username, p.playerCode].some((v) => (v || '').toLowerCase().includes(ql)))
      && (!activeOnly || p.depositCount > 0));
  }, [rows, ag, q, activeOnly]);

  const reset = () => { setAg(''); setQ(''); setActiveOnly(false); };

  const exportCsv = () => {
    downloadCsv('agent-players.csv',
      ['Player', 'Code', 'Agent', 'Agent code', 'Registered', 'Deposits (#)', 'Deposit total', 'Withdrawals', 'Wagered', 'GGR', 'KYC', 'Status'],
      visible.map((p) => [p.username, p.playerCode, p.agentUsername, p.agentCode, (p.registrationDate || '').slice(0, 10),
        p.depositCount, p.depositTotal, p.withdrawalTotal, p.wagered, p.ggr, p.kyc_status, p.status]));
    toast('CSV exported ⬇ agent-players.csv');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎮 Agent Players</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Players registered with an agent's referral code — with live deposit, wager and GGR figures</div>
        </div>
        <span className="pr"><button className="mini-btn" onClick={exportCsv}>📋 Export CSV</button></span>
      </div>

      <div className="card">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 3fr 1fr auto', alignItems: 'end' }}>
          <div className="fld"><label>Agent</label>
            <select value={ag} onChange={(e) => setAg(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.username} ({a.code})</option>)}
            </select>
          </div>
          <div className="fld"><label>Search Player</label><input placeholder="Username or player code…" value={q} onInput={(e) => setQ(e.target.value)} /></div>
          <div className="fld"><label>Activity</label>
            <select value={activeOnly ? '1' : ''} onChange={(e) => setActiveOnly(e.target.value === '1')}>
              <option value="">All</option><option value="1">Depositors only</option>
            </select>
          </div>
          <button className="gl-reset" onClick={reset} title="Reset">↺</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">👤 Players under Agents ({visible.length})</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1100 }}>
            <thead><tr><th>Player</th><th>Agent</th><th>Registered</th><th>Deposits</th><th>Withdrawals</th><th>Wagered</th><th>GGR</th><th>KYC</th><th>Status</th></tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  {loaded ? 'No referred players yet — players link to an agent by entering the agent code at registration.' : 'Loading…'}
                </td></tr>
              )}
              {visible.map((p) => (
                <tr key={`${p.agentId}-${p.id}`}>
                  <td><div className="ag-name">{p.username}</div><div className="ag-email">{p.playerCode}</div></td>
                  <td><span className="ag-user">{p.agentUsername}</span> <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.agentCode}</span></td>
                  <td style={{ color: '#aab4cc' }}>{(p.registrationDate || '').slice(0, 10)}</td>
                  <td><span className="ag-earn">{money(p.depositTotal)}</span> <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{p.depositCount}</span></td>
                  <td>{money(p.withdrawalTotal)}</td>
                  <td style={{ fontWeight: 800 }}>{money(p.wagered)}</td>
                  <td><span className="ag-rate">{money(p.ggr)}</span></td>
                  <td>{p.kyc_status === 'approved' ? <BOk>Verified</BOk> : <span className="sms-draft">{p.kyc_status || 'none'}</span>}</td>
                  <td>{(p.status || 'active') === 'active' ? <BOk>Active</BOk> : <span className="sms-draft">{p.status}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
