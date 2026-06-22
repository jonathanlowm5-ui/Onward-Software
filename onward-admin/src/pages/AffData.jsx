import { useMemo, useState } from 'react';
import { BOk } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';

// Ported from V["aff-data"] (AFFQ array + affComm helper).
const AFFQ_INIT = [
  { n: 'Juan dela Cruz', u: 'juan88', code: 'JUAN88', lvl: 'Master', l1: 42, l2: 188, l3: 620, c1: 5, c2: 3, c3: 1, earn: 284, pend: 22, on: 1 },
  { n: 'Maria Santos', u: 'marias', code: 'MARIA10', lvl: 'Senior', l1: 28, l2: 104, l3: 0, c1: 5, c2: 3, c3: 0, earn: 142, pend: 18, on: 1 },
  { n: 'Carlo Reyes', u: 'carlor', code: 'CARLO5', lvl: 'Member', l1: 14, l2: 0, l3: 0, c1: 5, c2: 0, c3: 0, earn: 38, pend: 6, on: 1 },
];

const affComm = (a) => ['L1: ' + a.c1 + '%', a.c2 ? 'L2: ' + a.c2 + '%' : '', a.c3 ? 'L3: ' + a.c3 + '%' : ''].filter(Boolean).join(' · ');

export default function AffData() {
  const { toast } = useUI();
  const [affs, setAffs] = useState(AFFQ_INIT);
  const [q, setQ] = useState('');

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return affs.filter((a) => (a.n + ' ' + a.u + ' ' + a.code).toLowerCase().includes(ql));
  }, [affs, q]);

  const pay = (orig) => {
    if (!orig.pend) { toast('Nothing pending for ' + orig.n); return; }
    const paid = orig.pend;
    const newEarn = orig.earn + orig.pend;
    setAffs((prev) => prev.map((a) => (a === orig ? { ...a, earn: newEarn, pend: 0 } : a)));
    toast(`Affiliate paid 💸 ${orig.n} · ₱${paid}K released — total earned ₱${newEarn}K`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🤝 Affiliate Data — Player MLM</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Player-based multi-level referral program · Players earn commissions from their downline's deposits &amp; wagers</div>
        </div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Add Affiliate — demo')}>＋ Add Affiliate</button></span>
      </div>
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total Affiliates</div><div className="val">284</div><div className="trend" style={{ color: 'var(--muted)' }}>active members</div></div>
        <div className="card kpi g"><div className="lbl">Total Downline</div><div className="val">8,420</div><div className="trend" style={{ color: 'var(--muted)' }}>referred players</div></div>
        <div className="card kpi"><div className="lbl">Commission Paid</div><div className="val">₱1.24M</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Payout</div><div className="val">₱84K</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">MLM Levels</div><div className="val">3</div><div className="trend" style={{ color: 'var(--muted)' }}>active tiers</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>👑 Top Affiliates</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <input className="qsearch" placeholder="Search player…" value={q} onInput={(e) => setQ(e.target.value)} />
            <button className="mini-btn" onClick={() => toast('Affiliates exported 📋')}>📋 Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1200 }}>
            <thead><tr><th>Player</th><th>Ref Code</th><th>Level</th><th>Direct (L1)</th><th>L2</th><th>L3</th><th>Total Downline</th><th>Commission %</th><th>Earned</th><th>Pending</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map((a, i) => (
                <tr key={i}>
                  <td><div className="ag-name">{a.n}</div><div className="ag-email">{a.u}</div></td>
                  <td><span className="code-chip">{a.code}</span></td>
                  <td><span className={`lvl-chip lv-${a.lvl.toLowerCase()}`}>{a.lvl}</span></td>
                  <td><span className="l1c">{a.l1}</span></td>
                  <td>{a.l2 ? <span className="l2c">{a.l2}</span> : <span className="l2c" style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>{a.l3 ? <span className="l3c">{a.l3}</span> : <span className="l3c" style={{ opacity: 0.5 }}>—</span>}</td>
                  <td style={{ fontWeight: 900 }}>{a.l1 + a.l2 + a.l3}</td>
                  <td><span className="comm-str">{affComm(a)}</span></td>
                  <td><span className="ag-earn">₱{a.earn}K</span></td>
                  <td><span className={a.pend ? 'ag-pend' : ''}>₱{a.pend}K</span></td>
                  <td>{a.on ? <BOk>Active</BOk> : <span className="sms-draft">Inactive</span>}</td>
                  <td>
                    <button className="mini-btn" onClick={() => toast(`Affiliate link — ${a.n} · https://onward.casino/ref/${a.code}`)}>🌳 Tree</button>{' '}
                    <button className="pay-btn" onClick={() => pay(a)}>💸 Pay</button>
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
