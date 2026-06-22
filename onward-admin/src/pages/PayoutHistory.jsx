import { useMemo, useState } from 'react';
import { BOk, BPend } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';

// Ported from V["payout-history"] (PAYQ engine + payout helpers).
const PAYQ_INIT = [
  { n: 'Juan dela Cruz', u: 'juan88', lvl: 'Master', per: 'Jun 2025', m: '2025-06', method: 'GCash', acct: '09121234567', st: 'pending', rel: '', relM: '', rm: '', lv: [[1, 42, 2840000, 5], [2, 188, 2120000, 3], [3, 620, 720000, 1]] },
  { n: 'Maria Santos', u: 'marias', lvl: 'Senior', per: 'Jun 2025', m: '2025-06', method: 'GCash', acct: '09287654321', st: 'pending', rel: '', relM: '', rm: '', lv: [[1, 28, 2280000, 5], [2, 104, 840000, 3]] },
  { n: 'Juan dela Cruz', u: 'juan88', lvl: 'Master', per: 'May 2025', m: '2025-05', method: 'GCash', acct: '09121234567', st: 'paid', rel: 'Jun 1 2025', relM: '2025-06', rm: 'May 2025 commission payout', lv: [[1, 38, 2400000, 5], [2, 160, 1900000, 3], [3, 540, 540000, 1]] },
  { n: 'Carlo Reyes', u: 'carlor', lvl: 'Member', per: 'May 2025', m: '2025-05', method: 'Bank Transfer', acct: 'BPI ···· 8841', st: 'paid', rel: 'Jun 2 2025', relM: '2025-06', rm: '', lv: [[1, 14, 840000, 5]] },
];

const PAY_YBASE = 1015600, PAY_CURM = '2025-06';

const payComm = (p) => p.lv.reduce((s, x) => s + x[2] * x[3] / 100, 0);
const payGGR = (p) => p.lv.reduce((s, x) => s + x[2], 0);
const payLvls = (p) => p.lv.map((x) => 'L' + x[0]).join('+');
const pPeso = (v) => '₱' + Math.round(v).toLocaleString('en-US');
const pesoShort = (v) =>
  v >= 1e6 ? '₱' + (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'
  : v >= 1e3 ? '₱' + (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  : pPeso(v);
const payDate = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).replace(',', '');

export default function PayoutHistory() {
  const { toast } = useUI();
  const [payq, setPayq] = useState(PAYQ_INIT);
  // Committed filter (applied on Filter click), matching original PAYF behaviour.
  const [filter, setFilter] = useState({ q: '', st: 'all', m: '' });
  // Draft input values.
  const [draftQ, setDraftQ] = useState('');
  const [draftSt, setDraftSt] = useState('all');
  const [draftM, setDraftM] = useState('');

  const match = (p) =>
    (!filter.q || (p.n + ' ' + p.u).toLowerCase().includes(filter.q))
    && (filter.st === 'all' || p.st === filter.st)
    && (!filter.m || p.m === filter.m);

  const kpis = useMemo(() => {
    const paidM = payq.filter((p) => p.st === 'paid' && p.relM === PAY_CURM);
    const sumM = paidM.reduce((s, p) => s + payComm(p), 0);
    const pend = payq.filter((p) => p.st === 'pending');
    const sumPend = pend.reduce((s, p) => s + payComm(p), 0);
    const affPend = new Set(pend.map((p) => p.u)).size;
    const year = PAY_YBASE + payq.filter((p) => p.st === 'paid').reduce((s, p) => s + payComm(p), 0);
    const avg = paidM.length ? sumM / paidM.length : 0;
    return { paidM, sumM, sumPend, affPend, year, avg };
  }, [payq]);

  const visible = payq.map((p, i) => ({ p, i })).filter(({ p }) => match(p));
  const shown = visible.length;

  const applyFilter = () => {
    setFilter({ q: draftQ.trim().toLowerCase(), st: draftSt, m: draftM });
  };

  const release = (i) => {
    const p = payq[i];
    if (!p || p.st === 'paid') return;
    setPayq((prev) => prev.map((x, j) => (j === i ? { ...x, st: 'paid', rel: payDate(), relM: PAY_CURM } : x)));
    toast(`Commission released 💸 ${p.n} · ${pPeso(payComm(p))} via ${p.method}`);
  };

  const releaseAll = () => {
    const pend = payq.filter((p) => p.st === 'pending');
    if (!pend.length) { toast('No pending payouts to release'); return; }
    const tot = pend.reduce((s, p) => s + payComm(p), 0);
    setPayq((prev) => prev.map((x) => (x.st === 'pending' ? { ...x, st: 'paid', rel: payDate(), relM: PAY_CURM } : x)));
    toast(`Released ${pend.length} pending payout${pend.length !== 1 ? 's' : ''} 💸 ${pPeso(tot)} total`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">💸 Payout History</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Commission payouts to affiliate players</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="mini-btn" onClick={() => toast('Exported 📋 onward-payouts.csv')}>📋 Export</button>
          <button className="btn-search" onClick={releaseAll}>💸 Release All Pending</button>
        </span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Paid This Month</div><div className="val">{pesoShort(kpis.sumM)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpis.paidM.length} payout{kpis.paidM.length !== 1 ? 's' : ''}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending</div><div className="val">{pesoShort(kpis.sumPend)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpis.affPend} affiliate{kpis.affPend !== 1 ? 's' : ''}</div></div>
        <div className="card kpi b"><div className="lbl">Paid This Year</div><div className="val">{pesoShort(kpis.year)}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Per Payout</div><div className="val">{kpis.avg ? pPeso(kpis.avg) : '—'}</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="pay-filter">
          <div className="fld fq"><label>Player</label>
            <input placeholder="Username…" value={draftQ} onInput={(e) => setDraftQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }} />
          </div>
          <div className="fld"><label>Status</label>
            <select value={draftSt} onChange={(e) => setDraftSt(e.target.value)}>
              <option value="all">All</option><option value="pending">Pending</option><option value="paid">Paid</option>
            </select>
          </div>
          <div className="fld"><label>Month</label><input type="month" value={draftM} onChange={(e) => setDraftM(e.target.value)} /></div>
          <button className="btn-search" onClick={applyFilter}>🔍 Filter</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1050 }}>
            <thead><tr><th>Player</th><th>Level</th><th>Period</th><th>Downline GGR</th><th>Commission</th><th>Method</th><th>Status</th><th>Released</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>No payouts match the current filter ({shown} of {payq.length})</td></tr>
              ) : visible.map(({ p, i }) => (
                <tr key={i}>
                  <td><div className="ag-name">{p.n}</div><div className="ag-email">{p.u} · {p.lvl}</div></td>
                  <td><span className="comm-str" style={{ fontSize: '.68rem' }}>{payLvls(p)}</span></td>
                  <td>{p.per}</td>
                  <td><span className="cpr-g">{pesoShort(payGGR(p))}</span></td>
                  <td><span className="ag-earn">{pPeso(payComm(p))}</span></td>
                  <td>{p.method}</td>
                  <td>{p.st === 'paid' ? <BOk>✅ Paid</BOk> : <BPend>⏳ Pending</BPend>}</td>
                  <td>{p.rel || <span style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>
                    {p.st === 'pending'
                      ? <button className="pay-btn" onClick={() => release(i)}>💸 Release</button>
                      : <button className="mini-btn" onClick={() => toast(`🧾 Receipt — ${p.n} · ${pPeso(payComm(p))} via ${p.method} · ${p.rel}`)}>🧾 Receipt</button>}
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
