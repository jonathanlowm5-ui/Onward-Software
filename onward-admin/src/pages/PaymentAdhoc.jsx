import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getConfig, saveConfig, pingUrl } from '../services/configService';

// Real ad-hoc payment gateways — stored in backend config (paymentGateways key).
const blank = () => ({ id: 'gw' + Date.now().toString(36), name: '', baseUrl: '', apiKey: '', enabled: true, notes: '' });

export default function PaymentAdhoc() {
  const { toast } = useUI();
  const [gws, setGws] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(null); // draft gateway being added/edited
  const [pinging, setPinging] = useState('');

  useEffect(() => {
    getConfig()
      .then((c) => { setGws(Array.isArray(c?.paymentGateways) ? c.paymentGateways : []); setLoaded(true); })
      .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load gateways')); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async (next) => {
    setSaving(true);
    try {
      await saveConfig({ paymentGateways: next });
      setGws(next);
      setDirty(false);
      toast('Payment gateways saved 💾');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); setDirty(true); }
    finally { setSaving(false); }
  };

  const toggle = (g) => { setGws((p) => p.map((x) => (x.id === g.id ? { ...x, enabled: !x.enabled } : x))); setDirty(true); };
  const remove = (g) => {
    if (!window.confirm(`Remove gateway "${g.name}"?`)) return;
    setGws((p) => p.filter((x) => x.id !== g.id));
    setDirty(true);
  };
  const commitEdit = () => {
    if (!edit.name.trim()) { toast('⚠ Gateway needs a name'); return; }
    setGws((p) => (p.some((x) => x.id === edit.id) ? p.map((x) => (x.id === edit.id ? edit : x)) : [...p, edit]));
    setEdit(null);
    setDirty(true);
  };

  const ping = async (g) => {
    if (!g.baseUrl) { toast('⚠ ' + g.name + ' has no Base URL to ping'); return; }
    setPinging(g.id);
    try {
      const r = await pingUrl(g.baseUrl);
      if (r.ok) toast(`⚡ ${g.name} reachable · HTTP ${r.status} · ${r.ms}ms`);
      else toast(`⚡ ${g.name} failed — ${r.error || 'HTTP ' + r.status}`);
    } catch (e) { toast('⚠ Ping failed — ' + (e.message || 'error')); }
    finally { setPinging(''); }
  };

  const active = gws.filter((g) => g.enabled !== false).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">💳 Payment Adhoc</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Ad-hoc payment gateway registry — stored in backend config, with live reachability pings</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn gold" onClick={() => setEdit(blank())}>＋ Add Gateway</button>
          <button className="btn-pm-save" disabled={saving || !dirty} onClick={() => persist(gws)}>{saving ? 'Saving…' : '💾 Save'}</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Gateways</div><div className="val">{gws.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>registered</div></div>
        <div className="card kpi g"><div className="lbl">Enabled</div><div className="val">{active}</div><div className="trend" style={{ color: 'var(--muted)' }}>available for use</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Disabled</div><div className="val">{gws.length - active}</div><div className="trend" style={{ color: 'var(--muted)' }}>paused</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 950 }}>
            <thead><tr><th>Gateway</th><th>Base URL</th><th>API Key</th><th>Notes</th><th>Enabled</th><th>Actions</th></tr></thead>
            <tbody>
              {gws.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? 'No ad-hoc gateways yet — click ＋ Add Gateway to register the first one.' : 'Loading…'}
                </td></tr>
              )}
              {gws.map((g) => (
                <tr key={g.id} style={{ opacity: g.enabled === false ? 0.55 : 1 }}>
                  <td><div className="ag-name">💳 {g.name}</div></td>
                  <td style={{ fontFamily: "'Roboto Mono',ui-monospace,monospace", fontSize: 12, color: '#aab4cc' }}>{g.baseUrl || '—'}</td>
                  <td style={{ fontFamily: "'Roboto Mono',ui-monospace,monospace", fontSize: 12 }}>{g.apiKey ? g.apiKey.slice(0, 4) + '····' + g.apiKey.slice(-4) : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 240 }}>{g.notes || '—'}</td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={g.enabled !== false} onChange={() => toggle(g)} />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <button className="mini-btn" disabled={pinging === g.id} onClick={() => ping(g)}>{pinging === g.id ? '…' : '⚡ Ping'}</button>{' '}
                    <button className="mini-btn gold" onClick={() => setEdit({ ...g })}>✏ Edit</button>{' '}
                    <button className="mini-btn" onClick={() => remove(g)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {dirty && <div style={{ marginTop: 10, fontSize: 12, color: '#ff8c42' }}>⚠ Unsaved changes — hit 💾 Save to persist.</div>}
      </div>

      {edit && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setEdit(null); }}>
          <div className="pm-modal" style={{ maxWidth: 480 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>💳</span><span><div className="nm">{gws.some((x) => x.id === edit.id) ? 'Edit Gateway' : 'Add Gateway'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setEdit(null)}>✕</button></div>
            <div className="pm-body">
              <div className="pm-fld"><label>Name</label>
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. GoldPay" /></div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>Base URL</label>
                <input value={edit.baseUrl} onChange={(e) => setEdit({ ...edit, baseUrl: e.target.value })} placeholder="https://api.gateway.example" /></div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>API Key</label>
                <input value={edit.apiKey} onChange={(e) => setEdit({ ...edit, apiKey: e.target.value })} placeholder="merchant key…" /></div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>Notes</label>
                <input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="e.g. whitelist callback IPs before go-live" /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                <label className="switch"><input type="checkbox" checked={edit.enabled !== false} onChange={(e) => setEdit({ ...edit, enabled: e.target.checked })} /><span className="slider"></span></label>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Enabled</span>
              </div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-pm-save" onClick={commitEdit}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
