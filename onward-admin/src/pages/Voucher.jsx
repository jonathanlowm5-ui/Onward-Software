import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listVouchers, saveVouchers } from '../services/voucherService';

/*
 * Voucher admin — generate and manage the promo codes players redeem on the
 * casino site ("Use Code" modal / promotions promo-code bar). Redemptions are
 * validated + credited server-side and audited as bonus transactions.
 */

let idSeq = 0;
const newId = () => 'v' + Date.now().toString(36) + (idSeq++).toString(36);

const TYPES = [
  ['cash', 'Cash', 'vt-cash'],
  ['pct', '% Bonus', 'vt-pct'],
  ['fs', 'Free Spins', 'vt-fs'],
  ['nodeposit', 'No Deposit', 'vt-nd'],
];
const TYPE_LABEL = Object.fromEntries(TYPES.map(([v, l]) => [v, l]));
const TYPE_CLASS = Object.fromEntries(TYPES.map(([v, , c]) => [v, c]));

const EMPTY = { id: '', code: '', enabled: true, type: 'cash', value: '', maxUses: 100, used: 0, expiry: '', minDeposit: '' };

// Random readable code like ONW-7K3F9Q.
const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `ONW-${s}`;
};

const isDead = (v) => {
  if (v.enabled === false) return true;
  if ((v.used || 0) >= v.maxUses) return true;
  if (v.expiry) {
    const e = Date.parse(v.expiry);
    if (!Number.isNaN(e) && Date.now() > e + (String(v.expiry).length <= 10 ? 86399000 : 0)) return true;
  }
  return false;
};

export default function Voucher() {
  const { toast } = useUI();
  const [vouchers, setVouchers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [statusF, setStatusF] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    listVouchers().then((d) => setVouchers(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const persist = async (next, msg) => {
    setVouchers(next);
    try { const saved = await saveVouchers(next); setVouchers(saved); toast(msg || 'Saved ✔'); }
    catch (e) { toast('⚠ ' + (e?.response?.data?.error || e.message || 'Save failed')); }
  };

  /* ---------- editor modal ---------- */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY, id: newId(), code: randomCode() }); setEditId(null); setOpen(true); };
  const openEdit = (v) => { setForm({ ...EMPTY, ...v }); setEditId(v.id); setOpen(true); };
  const close = () => setOpen(false);

  const save = () => {
    const code = form.code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!code) { toast('⚠ Code is required'); return; }
    if (!form.value.trim()) { toast('⚠ Value is required (e.g. ₱500, 100%, 50 FS)'); return; }
    if (vouchers.some((v) => v.code === code && v.id !== form.id)) { toast('⚠ That code already exists'); return; }
    const rec = { ...form, code, maxUses: Math.max(1, Number(form.maxUses) || 100) };
    const exists = vouchers.some((v) => v.id === form.id);
    const next = exists ? vouchers.map((v) => (v.id === form.id ? rec : v)) : [rec, ...vouchers];
    persist(next, editId ? 'Voucher updated 💾' : `Voucher generated ✅ ${code}`);
    setOpen(false);
  };
  const del = (id) => {
    const v = vouchers.find((x) => x.id === id);
    persist(vouchers.filter((x) => x.id !== id), `Voucher deleted 🗑 ${v?.code || ''}`);
  };
  const toggle = (id) => persist(vouchers.map((v) => (v.id === id ? { ...v, enabled: v.enabled === false } : v)));

  const copyCode = (c) => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => toast('Copied 📋 ' + c)).catch(() => toast('Code: ' + c));
    else toast('Code: ' + c);
  };
  const exportVouchers = () => {
    const rows = [['Code', 'Type', 'Value', 'Used', 'Max Uses', 'Expiry', 'Min Deposit', 'Status'],
      ...vouchers.map((v) => [v.code, TYPE_LABEL[v.type] || v.type, v.value, v.used || 0, v.maxUses, v.expiry, v.minDeposit, isDead(v) ? 'Inactive' : 'Active'])];
    const csv = rows.map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'onward-vouchers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Vouchers exported ⬇');
  };

  const visible = (v) => (statusF === '' || String(isDead(v) ? 1 : 0) === statusF) && v.code.toLowerCase().includes(query.toLowerCase());
  const shown = vouchers.filter(visible);
  const totalRedeemed = vouchers.reduce((s, v) => s + (v.used || 0), 0);

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🎫 Voucher</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Generate and manage promo codes players redeem with “Use Code”</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ Generate Voucher</button></span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Vouchers</div><div className="val">{vouchers.length}</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{vouchers.filter((v) => !isDead(v)).length}</div></div>
        <div className="card kpi"><div className="lbl">Total Redemptions</div><div className="val">{totalRedeemed}</div></div>
        <div className="card kpi r"><div className="lbl">Inactive / Expired</div><div className="val">{vouchers.filter(isDead).length}</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Voucher List</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All Status</option><option value="0">Active</option><option value="1">Inactive / Expired</option></select>
            <input className="qsearch" placeholder="Search code…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="mini-btn" onClick={exportVouchers}>⬇ Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1020 }}>
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Redeemed</th><th>Expiry</th><th>Min Deposit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                {loaded ? (vouchers.length ? 'No vouchers match this filter.' : 'No vouchers yet — click “＋ Generate Voucher”.') : 'Loading…'}
              </td></tr>
            ) : shown.map((v) => {
              const dead = isDead(v);
              return (
                <tr key={v.id}>
                  <td><span className={`vcode ${dead ? 'dead' : ''}`}>{v.code}</span><button className="copy-btn" onClick={() => copyCode(v.code)} title="Copy code">📋</button></td>
                  <td><span className={`vtype ${TYPE_CLASS[v.type] || 'vt-cash'}`} style={dead ? { opacity: 0.5 } : undefined}>{TYPE_LABEL[v.type] || v.type}</span></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{v.value}</td>
                  <td><b>{v.used || 0}</b> <span style={{ color: 'var(--muted)' }}>/ {v.maxUses}</span></td>
                  <td className={dead ? 'exp-red' : ''}>{v.expiry || '—'}</td>
                  <td>{v.minDeposit || '—'}</td>
                  <td>
                    <span className={dead ? 'lst-lost' : 'lst-won'} style={{ cursor: 'pointer' }} onClick={() => toggle(v.id)} title="Toggle on/off">
                      {v.enabled === false ? 'Off' : dead ? 'Expired' : 'Active'}
                    </span>
                  </td>
                  <td><button className="mini-btn gold" onClick={() => openEdit(v)}>✏️</button> <button className="del-btn" onClick={() => del(v.id)}>🗑</button></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* ===== GENERATOR / EDITOR ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: 540 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🎫</span>
              <span><div className="nm">{editId ? 'Edit Voucher' : 'Generate Voucher'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}>
                <label>Code <span className="req-star">*</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.code} onChange={(e) => setF('code', e.target.value.toUpperCase())} placeholder="e.g. WELCOME100" style={{ letterSpacing: '.06em', fontWeight: 800 }} />
                  <button className="mini-btn" style={{ flexShrink: 0 }} onClick={() => setF('code', randomCode())} title="Generate a random code">🎲</button>
                </div>
              </div>
              <div className="pm-grid">
                <div className="pm-fld"><label>Type</label>
                  <select value={form.type} onChange={(e) => setF('type', e.target.value)}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="pm-fld"><label>Value <span className="req-star">*</span></label><input value={form.value} onChange={(e) => setF('value', e.target.value)} placeholder="₱500 · 100% · 50 FS" /></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>💡 Money values (e.g. ₱500) are credited to the player's balance instantly on redeem; % / free-spin values are logged as a bonus transaction for your team to fulfil.</div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Max Uses</label><input inputMode="numeric" value={form.maxUses} onChange={(e) => setF('maxUses', e.target.value)} placeholder="100" /></div>
                <div className="pm-fld"><label>Expiry</label><input type="date" value={form.expiry} onChange={(e) => setF('expiry', e.target.value)} /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Min Deposit (informational)</label><input value={form.minDeposit} onChange={(e) => setF('minDeposit', e.target.value)} placeholder="e.g. ₱500 — shown in exports/terms" /></div>
              <div className="pm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Active</div><div className="d">Players can redeem this code</div></div></div>
              {editId && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Redeemed so far: <b>{form.used || 0}</b> / {form.maxUses}</div>}
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editId ? 'Save Changes' : 'Generate Voucher'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
