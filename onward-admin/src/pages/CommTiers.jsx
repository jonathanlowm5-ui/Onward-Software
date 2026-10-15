import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listPlans, savePlans } from '../services/agentService';

// Real commission plans editor — same plans the Agent → Commission generator uses.
const TYPE_LABEL = { cpa: '🎯 CPA', revshare: '📈 RevShare', hybrid: '🔀 Hybrid' };
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function CommTiers() {
  const { toast } = useUI();
  const [plans, setPlans] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listPlans()
      .then((p) => { setPlans(Array.isArray(p) ? p : []); setLoaded(true); })
      .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load plans')); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setP = (i, k, v) => { setPlans((d) => d.map((p, j) => (j === i ? { ...p, [k]: v } : p))); setDirty(true); };
  const addPlan = () => {
    setPlans((d) => [...d, { id: 'plan' + Date.now().toString(36), name: 'New Plan', type: 'revshare', cpaAmount: 0, minDeposit: 0, revSharePct: 10, active: true }]);
    setDirty(true);
  };
  const removePlan = (i) => { setPlans((d) => d.filter((_, j) => j !== i)); setDirty(true); };

  const save = async () => {
    if (plans.some((p) => !p.name || !p.id)) { toast('⚠ Every plan needs a name'); return; }
    setSaving(true);
    try {
      const saved = await savePlans(plans);
      setPlans(Array.isArray(saved) ? saved : plans);
      setDirty(false);
      toast('Commission plans saved 💾');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🏆 Commission Tiers</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Real CPA / RevShare / Hybrid plans — the Agent → Commission generator pays agents from these definitions</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn" onClick={addPlan}>＋ Add Plan</button>
          <button className="btn-pm-save" disabled={saving || !dirty} onClick={save}>{saving ? 'Saving…' : '💾 Save Plans'}</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Plans</div><div className="val">{plans.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>{plans.filter((p) => p.active !== false).length} active</div></div>
        <div className="card kpi g"><div className="lbl">🎯 CPA</div><div className="val">{plans.filter((p) => p.type === 'cpa').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>per-FTD plans</div></div>
        <div className="card kpi"><div className="lbl">📈 RevShare</div><div className="val">{plans.filter((p) => p.type === 'revshare').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>% of GGR plans</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">🔀 Hybrid</div><div className="val">{plans.filter((p) => p.type === 'hybrid').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>CPA + RevShare</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        {!loaded && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>Loading…</div>}
        {loaded && plans.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>No commission plans yet — click ＋ Add Plan to create the first one.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {plans.map((p, i) => (
            <div key={p.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: 14, opacity: p.active === false ? 0.55 : 1 }}>
              <div style={{ fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>{TYPE_LABEL[p.type] || p.type}</div>
              <div className="pm-fld"><label>Name</label><input value={p.name} onChange={(e) => setP(i, 'name', e.target.value)} /></div>
              <div className="pm-fld" style={{ marginTop: 8 }}><label>Type</label>
                <select value={p.type} onChange={(e) => setP(i, 'type', e.target.value)}>
                  <option value="cpa">CPA</option><option value="revshare">RevShare</option><option value="hybrid">Hybrid</option>
                </select>
              </div>
              {(p.type === 'cpa' || p.type === 'hybrid') && (
                <div className="pm-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                  <div className="pm-fld"><label>CPA per FTD</label><input type="number" value={p.cpaAmount ?? 0} onChange={(e) => setP(i, 'cpaAmount', Number(e.target.value))} /></div>
                  <div className="pm-fld"><label>Min first deposit</label><input type="number" value={p.minDeposit ?? 0} onChange={(e) => setP(i, 'minDeposit', Number(e.target.value))} /></div>
                </div>
              )}
              {(p.type === 'revshare' || p.type === 'hybrid') && (
                <div className="pm-fld" style={{ marginTop: 8 }}><label>RevShare % of GGR</label>
                  <input type="number" min="0" max="60" value={p.revSharePct ?? 0} onChange={(e) => setP(i, 'revSharePct', Number(e.target.value))} />
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                {(p.type === 'cpa' || p.type === 'hybrid') && <>Pays <b style={{ color: 'var(--gold)' }}>{money(p.cpaAmount)}</b> per FTD ≥ {money(p.minDeposit)}. </>}
                {(p.type === 'revshare' || p.type === 'hybrid') && <>Pays <b style={{ color: 'var(--gold)' }}>{p.revSharePct || 0}%</b> of downline GGR.</>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <label className="switch"><input type="checkbox" checked={p.active !== false} onChange={(e) => setP(i, 'active', e.target.checked)} /><span className="slider"></span></label>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Active</span>
                <button className="rm" style={{ marginLeft: 'auto' }} onClick={() => removePlan(i)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
        {dirty && <div style={{ marginTop: 12, fontSize: 12, color: '#ff8c42' }}>⚠ Unsaved changes — hit 💾 Save Plans to persist.</div>}
      </div>
    </>
  );
}
