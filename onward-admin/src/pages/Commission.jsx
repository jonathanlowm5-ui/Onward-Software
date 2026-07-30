import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import {
  listCommissions, generateCommissions, adjustCommission, payCommission,
  listAgents, listPlans, savePlans, listManagers, saveManagers, downloadCsv,
} from '../services/agentService';

/*
 * Agent Commission — independent commission menu for the agent module.
 *  • Plans: CPA / RevShare / Hybrid definitions (rate, min deposit)
 *  • Generate: compute a month's commissions for all active agents (idempotent)
 *  • Records: review, release (credits the agent), manual adjustments
 */
const KIND = { cpa: '🎯 CPA', revshare: '📈 RevShare', hybrid: '🔀 Hybrid', adjustment: '✍️ Adjustment' };
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function Commission() {
  const { toast } = useUI();
  const [comms, setComms] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [agentF, setAgentF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [period, setPeriod] = useState(thisMonth());
  const [busy, setBusy] = useState(false);

  const load = () => listCommissions().then((rows) => { setComms(Array.isArray(rows) ? rows : []); setLoaded(true); }).catch(() => setLoaded(true));
  useEffect(() => {
    load();
    listAgents().then((rows) => setAgents(Array.isArray(rows) ? rows : [])).catch(() => {});
    listPlans().then(setPlans).catch(() => {});
    listManagers().then((m) => setManagers(Array.isArray(m) ? m : [])).catch(() => {});
  }, []);

  const visible = useMemo(() => comms.filter((c) =>
    (!agentF || String(c.agentId) === agentF) && (!statusF || c.status === statusF)), [comms, agentF, statusF]);

  const kpi = useMemo(() => ({
    paid: comms.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0),
    paidN: comms.filter((c) => c.status === 'paid').length,
    pend: comms.filter((c) => c.status === 'pending').reduce((s, c) => s + Number(c.amount || 0), 0),
    pendN: comms.filter((c) => c.status === 'pending').length,
  }), [comms]);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await generateCommissions(period);
      toast(r.created ? `Generated ${r.created} commission record(s) for ${r.period} ✅` : `Nothing new to generate for ${r.period} (already generated or no qualifying activity)`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Generation failed')); }
    finally { setBusy(false); }
  };

  const pay = async (c) => {
    try {
      await payCommission(c.id);
      toast(`Commission released 💳 ${c.agentUsername} · ${money(c.amount)} ${c.currency || ''} — credited to the agent's balance`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Payout failed')); }
  };

  const payAllPending = async () => {
    const pend = visible.filter((c) => c.status === 'pending');
    if (!pend.length) { toast('No pending commissions to release'); return; }
    if (!window.confirm(`Release ${pend.length} pending commission(s) totalling ${money(pend.reduce((s, c) => s + Number(c.amount || 0), 0))}?`)) return;
    for (const c of pend) { await payCommission(c.id).catch(() => {}); }
    toast(`Released ${pend.length} payout(s) 💳`);
    load();
  };

  /* ---------- manual adjustment ---------- */
  const [adj, setAdj] = useState(null); // {agentId, amount, detail}
  const saveAdj = async () => {
    if (!adj?.agentId || !Number(adj.amount)) { toast('⚠ Pick an agent and a non-zero amount'); return; }
    try {
      await adjustCommission(adj.agentId, Number(adj.amount), adj.detail || 'Manual adjustment');
      toast('Adjustment recorded ✍️ (pending release)');
      setAdj(null);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Adjustment failed')); }
  };

  /* ---------- plans editor ---------- */
  const [editPlans, setEditPlans] = useState(false);
  const [draft, setDraft] = useState([]);
  const openPlans = () => { setDraft(plans.map((p) => ({ ...p }))); setEditPlans(true); };
  const setP = (i, k, v) => setDraft((d) => d.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const addPlan = () => setDraft((d) => [...d, { id: 'plan' + Date.now().toString(36), name: 'New Plan', type: 'revshare', cpaAmount: 0, minDeposit: 0, revSharePct: 10, active: true }]);
  const commitPlans = async () => {
    const bad = draft.find((p) => !p.name || !p.id);
    if (bad) { toast('⚠ Every plan needs a name'); return; }
    try { const saved = await savePlans(draft); setPlans(saved); setEditPlans(false); toast('Commission plans saved 💾'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  /* ---------- managers editor ---------- */
  const editManagers = async () => {
    const names = window.prompt('Account managers (comma-separated names):', managers.map((m) => m.name).join(', '));
    if (names === null) return;
    const next = names.split(',').map((n) => n.trim()).filter(Boolean).map((name) => {
      const old = managers.find((m) => m.name === name);
      return old || { id: name.toLowerCase().replace(/\s+/g, '-'), name };
    });
    try { const saved = await saveManagers(next); setManagers(saved); toast('Managers saved 💾'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  const exportCsv = () => {
    downloadCsv('agent-commissions.csv',
      ['Created', 'Agent', 'Period', 'Type', 'Detail', 'Amount', 'Currency', 'Status', 'Paid at'],
      visible.map((c) => [(c.createdAt || '').slice(0, 10), c.agentUsername, c.period, c.kind, c.detail, c.amount, c.currency, c.status, (c.paidAt || '').slice(0, 10)]));
    toast('CSV exported ⬇ agent-commissions.csv');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🧧 Agent Commission</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>CPA · RevShare · Hybrid plans — generate a month, review, release. Releasing credits the agent's player balance.</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="month" className="qsearch" style={{ width: 'auto' }} value={period} onChange={(e) => setPeriod(e.target.value)} />
          <button className="btn-search" disabled={busy} onClick={generate}>{busy ? 'Generating…' : '⚡ Generate ' + period}</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Paid (All Time)</div><div className="val">{money(kpi.paid)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpi.paidN} record(s)</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Release</div><div className="val">{money(kpi.pend)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpi.pendN} record(s)</div></div>
        <div className="card kpi b"><div className="lbl">Commission Plans</div><div className="val">{plans.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>{plans.filter((p) => p.active !== false).length} active</div></div>
        <div className="card kpi"><div className="lbl">Active Agents</div><div className="val">{agents.filter((a) => (a.status || 'active') === 'active').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>of {agents.length} total</div></div>
      </div>

      {/* plans */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📋 Commission Plans</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <button className="mini-btn" onClick={editManagers}>👨‍💼 Managers ({managers.length})</button>
            <button className="mini-btn gold" onClick={openPlans}>✏️ Edit Plans</button>
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
          {plans.map((p) => (
            <div key={p.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: 14, opacity: p.active === false ? 0.5 : 1 }}>
              <div style={{ fontWeight: 800, color: 'var(--text,#fff)' }}>{KIND[p.type] || p.type} · {p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
                {(p.type === 'cpa' || p.type === 'hybrid') && <>CPA <b style={{ color: 'var(--gold)' }}>{money(p.cpaAmount)}</b> per FTD ≥ {money(p.minDeposit)}<br /></>}
                {(p.type === 'revshare' || p.type === 'hybrid') && <>RevShare <b style={{ color: 'var(--gold)' }}>{p.revSharePct}%</b> of downline GGR</>}
              </div>
            </div>
          ))}
          {plans.length === 0 && <div className="hist-empty">No plans yet.</div>}
        </div>
      </div>

      {/* records */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📄 Commission Records</div>
          <span className="pr" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select className="qsearch" style={{ width: 'auto' }} value={agentF} onChange={(e) => setAgentF(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.username} ({a.code})</option>)}
            </select>
            <select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="">All Status</option><option value="pending">Pending</option><option value="paid">Paid</option>
            </select>
            <button className="mini-btn" onClick={() => setAdj({ agentId: '', amount: '', detail: '' })}>✍️ Adjustment</button>
            <button className="mini-btn" onClick={exportCsv}>📋 Export</button>
            <button className="btn-send-gold" style={{ padding: '8px 14px' }} onClick={payAllPending}>💳 Release All Pending</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1050 }}>
            <thead><tr><th>Agent</th><th>Period</th><th>Type</th><th>Detail</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  {loaded ? 'No commission records — pick a month and hit Generate.' : 'Loading…'}
                </td></tr>
              )}
              {visible.map((c) => (
                <tr key={c.id}>
                  <td><div className="ag-name">{c.agentUsername}</div></td>
                  <td style={{ color: '#aab4cc' }}>{c.period}</td>
                  <td><span className="ag-type">{KIND[c.kind] || c.kind}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.detail}</td>
                  <td style={{ color: Number(c.amount) < 0 ? 'var(--red,#ff5c5c)' : 'var(--gold)', fontWeight: 900 }}>{money(c.amount)} {c.currency || ''}</td>
                  <td>{c.status === 'paid' ? <span className="aa-status2 s-app">✅ Paid</span> : <span className="aa-status2 s-pend">⏳ Pending</span>}</td>
                  <td>
                    {c.status === 'paid'
                      ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(c.paidAt || '').slice(0, 10)}</span>
                      : <button className="btn-send-gold" style={{ padding: '7px 14px' }} onClick={() => pay(c)}>💳 Release</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* adjustment modal */}
      {adj && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setAdj(null); }}>
          <div className="pm-modal" style={{ maxWidth: 440 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>✍️</span><span><div className="nm">Manual Adjustment</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setAdj(null)}>✕</button></div>
            <div className="pm-body">
              <div className="pm-fld"><label>Agent</label>
                <select value={adj.agentId} onChange={(e) => setAdj({ ...adj, agentId: e.target.value })}>
                  <option value="">— pick an agent —</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.username} ({a.code})</option>)}
                </select>
              </div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>Amount (negative = deduction)</label>
                <input type="number" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} placeholder="e.g. 150 or -50" /></div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>Reason</label>
                <input value={adj.detail} onChange={(e) => setAdj({ ...adj, detail: e.target.value })} placeholder="e.g. Q2 performance bonus" /></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setAdj(null)}>Cancel</button>
              <button className="btn-pm-save" onClick={saveAdj}>Record Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* plans editor modal */}
      {editPlans && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setEditPlans(false); }}>
          <div className="pm-modal" style={{ maxWidth: 720 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>📋</span><span><div className="nm">Edit Commission Plans</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setEditPlans(false)}>✕</button></div>
            <div className="pm-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {draft.map((p, i) => (
                <div key={p.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div className="pm-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="pm-fld"><label>Name</label><input value={p.name} onChange={(e) => setP(i, 'name', e.target.value)} /></div>
                    <div className="pm-fld"><label>Type</label>
                      <select value={p.type} onChange={(e) => setP(i, 'type', e.target.value)}>
                        <option value="cpa">CPA</option><option value="revshare">RevShare</option><option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                  <div className="pm-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 8 }}>
                    {(p.type === 'cpa' || p.type === 'hybrid') && (
                      <>
                        <div className="pm-fld"><label>CPA per FTD</label><input type="number" value={p.cpaAmount} onChange={(e) => setP(i, 'cpaAmount', Number(e.target.value))} /></div>
                        <div className="pm-fld"><label>Min first deposit</label><input type="number" value={p.minDeposit} onChange={(e) => setP(i, 'minDeposit', Number(e.target.value))} /></div>
                      </>
                    )}
                    {(p.type === 'revshare' || p.type === 'hybrid') && (
                      <div className="pm-fld"><label>RevShare % of GGR</label><input type="number" min="0" max="60" value={p.revSharePct} onChange={(e) => setP(i, 'revSharePct', Number(e.target.value))} /></div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <label className="switch"><input type="checkbox" checked={p.active !== false} onChange={(e) => setP(i, 'active', e.target.checked)} /><span className="slider"></span></label>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Active</span>
                    <button className="rm" style={{ marginLeft: 'auto' }} onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}>🗑</button>
                  </div>
                </div>
              ))}
              <button className="mini-btn" onClick={addPlan}>＋ Add Plan</button>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setEditPlans(false)}>Cancel</button>
              <button className="btn-pm-save" onClick={commitPlans}>Save Plans</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
