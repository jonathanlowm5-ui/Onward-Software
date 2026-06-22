import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_VOUCHERS = [
  { c: 'WELCOME100', t: '% Bonus', tc: 'vt-pct', v: '100%', u: 342, tot: 500, ex: '2026-12-31', md: '₱500', dead: 0 },
  { c: 'ONWARD', t: 'Free Spins', tc: 'vt-fs', v: '50 FS', u: 891, tot: 1000, ex: '2026-12-31', md: '₱200', dead: 0 },
  { c: 'VIP500', t: 'Cash', tc: 'vt-cash', v: '₱500', u: 67, tot: 100, ex: '2026-09-30', md: '₱2,000', dead: 0 },
  { c: 'FREESPIN55', t: 'Free Spins', tc: 'vt-fs', v: '55 FS', u: 0, tot: 200, ex: '2025-12-31', md: '₱0', dead: 1 },
  { c: 'BONUS200', t: '% Bonus', tc: 'vt-pct', v: '200%', u: 12, tot: 50, ex: '2026-06-30', md: '₱1,000', dead: 0 },
  { c: 'EXCLUSIVE', t: 'Cash', tc: 'vt-cash', v: '₱2000', u: 8, tot: 20, ex: '2026-08-31', md: '₱5,000', dead: 0 },
  { c: 'NEWPLAYER', t: 'No Deposit', tc: 'vt-nd', v: '₱100', u: 840, tot: 999, ex: '2026-12-31', md: '₱0', dead: 0 },
  { c: 'OLDCODE', t: '% Bonus', tc: 'vt-pct', v: '50%', u: 0, tot: 100, ex: '2024-12-31', md: '₱300', dead: 1 },
];

export default function Voucher() {
  const { toast } = useUI();
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [statusF, setStatusF] = useState('');
  const [query, setQuery] = useState('');

  const visible = (v) => (statusF === '' || String(v.dead) === statusF) && v.c.toLowerCase().includes(query.toLowerCase());

  const copyCode = (c) => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c).then(() => toast('Copied 📋 ' + c)).catch(() => toast('Code: ' + c));
    else toast('Code: ' + c);
  };
  const exportVouchers = () => {
    const rows = [['Code', 'Type', 'Value', 'Uses Left', 'Total', 'Expiry', 'Min Deposit', 'Status'], ...vouchers.map((v) => [v.c, v.t, v.v, v.u, v.tot, v.ex, v.md, v.dead ? 'Expired' : 'Active'])];
    const csv = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'onward-vouchers.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Vouchers exported ⬇');
  };
  const del = (idx) => {
    const v = vouchers[idx];
    setVouchers((prev) => prev.filter((_, i) => i !== idx));
    toast(`Voucher deleted: ${v.c}`);
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🎫 Voucher</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Generate and manage promo codes and vouchers</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Generate Voucher — demo')}>＋ Generate Voucher</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Vouchers</div><div className="val">{vouchers.length}</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{vouchers.filter((v) => !v.dead).length}</div></div>
        <div className="card kpi"><div className="lbl">Redeemed Today</div><div className="val">42</div></div>
        <div className="card kpi r"><div className="lbl">Expired</div><div className="val">{vouchers.filter((v) => v.dead).length}</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Voucher List</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All Status</option><option value="0">Active</option><option value="1">Expired</option></select>
            <input className="qsearch" placeholder="Search code…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="mini-btn" onClick={exportVouchers}>⬇ Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1020 }}>
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Uses Left</th><th>Expiry</th><th>Min Deposit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{vouchers.map((v, i) => (
            <tr key={i} style={{ display: visible(v) ? '' : 'none' }}>
              <td><span className={`vcode ${v.dead ? 'dead' : ''}`}>{v.c}</span><button className="copy-btn" onClick={() => copyCode(v.c)} title="Copy code">📋</button></td>
              <td><span className={`vtype ${v.tc}`} style={v.dead ? { opacity: 0.5 } : undefined}>{v.t}</span></td>
              <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{v.v}</td>
              <td>{v.u === 0 ? <span className="uses-z">0</span> : <b>{v.u}</b>} <span style={{ color: 'var(--muted)' }}>/ {v.tot}</span></td>
              <td className={v.dead ? 'exp-red' : ''}>{v.ex}</td>
              <td>{v.md}</td>
              <td>{v.dead ? <span className="lst-lost">Expired</span> : <span className="lst-won">Active</span>}</td>
              <td><button className="mini-btn gold" style={v.dead ? { opacity: 0.45 } : undefined} onClick={() => toast(`Edit voucher: ${v.c} — demo`)}>✏️</button> <button className="del-btn" onClick={() => del(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
