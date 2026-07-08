import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listAgents, updateAgent, listPlans, listManagers, downloadCsv } from '../services/agentService';

/*
 * Agent List — approved agents only. Applications live in Agent Approval;
 * here you manage live agents: status (active / suspended / blacklisted),
 * commission plan, account manager, and see per-agent performance.
 */
const STATE = {
  active: { l: '🟢 Active', c: '#3ddc84' },
  suspended: { l: '⏸ Suspended', c: '#ffd166' },
  blacklisted: { l: '⛔ Blacklisted', c: '#ff5c5c' },
};
const stBadge = (st) => {
  const m = STATE[st] || STATE.active;
  return <span className="aa-status2" style={{ background: m.c + '22', color: m.c, border: `1px solid ${m.c}55` }}>{m.l}</span>;
};
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function AgentList() {
  const { toast } = useUI();
  const [agents, setAgents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [plans, setPlans] = useState([]);
  const [managers, setManagers] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = () => listAgents().then((rows) => { setAgents(Array.isArray(rows) ? rows : []); setLoaded(true); }).catch(() => setLoaded(true));
  useEffect(() => {
    load();
    listPlans().then(setPlans).catch(() => {});
    listManagers().then(setManagers).catch(() => {});
  }, []);

  const planName = (id) => plans.find((p) => p.id === id)?.name || '—';
  const managerName = (id) => managers.find((m) => (m.id || m.name) === id)?.name || '—';

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return agents.filter((a) =>
      (!status || (a.status || 'active') === status)
      && (!ql || [a.username, a.code].some((v) => (v || '').toLowerCase().includes(ql))));
  }, [agents, q, status]);

  const totals = useMemo(() => ({
    players: agents.reduce((s, a) => s + (a.stats?.players || 0), 0),
    ggr: agents.reduce((s, a) => s + (a.stats?.ggr || 0), 0),
    pending: agents.reduce((s, a) => s + (a.stats?.pending || 0), 0),
  }), [agents]);

  const setState = async (a, next) => {
    const remarks = next === 'active' ? '' : (window.prompt(`Remarks for ${next === 'suspended' ? 'suspension' : 'blacklisting'} (sent to the agent):`) ?? null);
    if (remarks === null) return;
    try {
      await updateAgent(a.id, { status: next, remarks });
      toast(`${a.username} → ${STATE[next].l}`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
  };

  const setPlan = async (a, planId) => {
    try { await updateAgent(a.id, { planId }); toast(`Plan updated for ${a.username} 💾`); load(); }
    catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
  };
  const setManager = async (a, managerId) => {
    try { await updateAgent(a.id, { managerId }); toast(`Manager updated for ${a.username} 💾`); load(); }
    catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
  };

  const exportCsv = () => {
    downloadCsv('agents.csv',
      ['Username', 'Code', 'Status', 'Plan', 'Manager', 'Players', 'Active players', 'Deposits', 'GGR', 'Earned', 'Pending', 'Approved at'],
      visible.map((a) => [a.username, a.code, a.status || 'active', planName(a.planId), managerName(a.managerId),
        a.stats?.players, a.stats?.activePlayers, a.stats?.depositTotal, a.stats?.ggr, a.stats?.earned, a.stats?.pending, (a.approvedAt || '').slice(0, 10)]));
    toast('CSV exported ⬇ agents.csv');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">👤 Agent List</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Approved agents — manage status, plan, manager and performance. New applications are reviewed in <b>Agent Approval</b>.</div>
        </div>
        <span className="pr"><button className="mini-btn" onClick={exportCsv}>📋 Export CSV</button></span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Agents</div><div className="val">{agents.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>{agents.filter((a) => (a.status || 'active') === 'active').length} active</div></div>
        <div className="card kpi g"><div className="lbl">Referred Players</div><div className="val">{totals.players.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>across all agents</div></div>
        <div className="card kpi"><div className="lbl">Downline GGR</div><div className="val">{money(totals.ggr)}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Commission Pending</div><div className="val">{money(totals.pending)}</div><div className="trend" style={{ color: 'var(--muted)' }}>awaiting payout</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>👥 All Agents</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <input className="qsearch" placeholder="Username or code…" value={q} onInput={(e) => setQ(e.target.value)} />
            <select className="qsearch" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option><option value="suspended">Suspended</option><option value="blacklisted">Blacklisted</option>
            </select>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1180 }}>
            <thead><tr><th>Agent</th><th>Code</th><th>Plan</th><th>Manager</th><th>Players</th><th>Deposits</th><th>GGR</th><th>Earned</th><th>Pending</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  {loaded ? 'No approved agents yet — approve applications in Agent Approval.' : 'Loading…'}
                </td></tr>
              )}
              {visible.map((a) => (
                <tr key={a.id}>
                  <td><div className="ag-name">{a.username}</div><div className="ag-email">approved {(a.approvedAt || '').slice(0, 10)}</div></td>
                  <td><span className="ag-user">{a.code}</span></td>
                  <td>
                    <select className="qsearch" style={{ width: 'auto', minWidth: 120, padding: '5px 8px', fontSize: 12 }} value={a.planId || ''} onChange={(e) => setPlan(a, e.target.value)}>
                      <option value="">— default —</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="qsearch" style={{ width: 'auto', minWidth: 110, padding: '5px 8px', fontSize: 12 }} value={a.managerId || ''} onChange={(e) => setManager(a, e.target.value)}>
                      <option value="">—</option>
                      {managers.map((m) => <option key={m.id || m.name} value={m.id || m.name}>{m.name}</option>)}
                    </select>
                  </td>
                  <td>{a.stats?.players ?? 0} <span style={{ color: 'var(--muted)', fontSize: 11 }}>({a.stats?.activePlayers ?? 0} active)</span></td>
                  <td><span className="ag-earn">{money(a.stats?.depositTotal)}</span></td>
                  <td><span className="ag-rate">{money(a.stats?.ggr)}</span></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{money(a.stats?.earned)}</td>
                  <td>{a.stats?.pending ? <span className="ag-pend">{money(a.stats.pending)}</span> : '0'}</td>
                  <td>{stBadge(a.status || 'active')}</td>
                  <td>
                    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(a.status || 'active') !== 'active' && <button className="mini-btn green" onClick={() => setState(a, 'active')}>▶ Activate</button>}
                      {(a.status || 'active') === 'active' && <button className="mini-btn" onClick={() => setState(a, 'suspended')}>⏸ Suspend</button>}
                      {a.status !== 'blacklisted' && <button className="btn-cancel-red" style={{ padding: '6px 10px', fontSize: '.72rem' }} onClick={() => setState(a, 'blacklisted')}>⛔ Blacklist</button>}
                    </span>
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
