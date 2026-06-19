import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';

// Ported from V.commission (COMMQ array + AC_KPI). moneyNum helper ported locally.
const COMMQ_INIT = [
  { n: 'Marco Rivera', u: 'marco88', per: 'Jun 2026', ct: 'Rev Share · GGR', base: '₱448,000', rate: '5%', amt: '₱22,400', pm: 'GCash', st: 'paid' },
  { n: 'Jenny Lim', u: 'jenny_l', per: 'Jun 2026', ct: 'Rev Share · GGR', base: '₱370,000', rate: '4%', amt: '₱14,800', pm: 'GCash', st: 'paid' },
  { n: 'Rey Santos', u: 'reysantos', per: 'Jun 2026', ct: 'Rev Share · GGR', base: '₱246,860', rate: '3.5%', amt: '₱8,640', pm: 'GCash', st: 'pend' },
  { n: 'Dana Cruz', u: 'danacruz', per: 'Jun 2026', ct: 'Rev Share · Deposit', base: '₱130,667', rate: '3%', amt: '₱3,920', pm: 'Bank Transfer', st: 'pend' },
];

const moneyNum = (v) => parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0;

export default function Commission() {
  const { toast } = useUI();
  const [comm, setComm] = useState(COMMQ_INIT);
  const [filterName, setFilterName] = useState('');
  const [kpi, setKpi] = useState({ paid: 71800, paidN: 18, pend: 12400, pendN: 6 });

  const visible = useMemo(
    () => comm.filter((c) => !filterName || c.n === filterName),
    [comm, filterName]
  );

  const release = (orig) => {
    if (orig.st !== 'pend') return;
    const amt = moneyNum(orig.amt);
    setComm((prev) => prev.map((c) => (c === orig ? { ...c, st: 'paid' } : c)));
    setKpi((k) => ({ paid: k.paid + amt, paidN: k.paidN + 1, pend: Math.max(0, k.pend - amt), pendN: Math.max(0, k.pendN - 1) }));
    toast(`Commission released 💳 ${orig.n} · ${orig.amt} via ${orig.pm}`);
  };

  const releaseAll = () => {
    const pend = comm.filter((c) => c.st === 'pend');
    if (!pend.length) { toast('No pending commissions to release'); return; }
    let tot = 0;
    pend.forEach((c) => { tot += moneyNum(c.amt); });
    setComm((prev) => prev.map((c) => (c.st === 'pend' ? { ...c, st: 'paid' } : c)));
    setKpi((k) => ({
      paid: k.paid + tot, paidN: k.paidN + pend.length,
      pend: Math.max(0, k.pend - tot), pendN: Math.max(0, k.pendN - pend.length),
    }));
    toast(`Released ${pend.length} pending payouts 💳 ₱${tot.toLocaleString()} total`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🧧 Agent Commission</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Track and release commission payouts to all agents</div>
        </div>
        <span className="pr"><button className="btn-search" onClick={releaseAll}>💳 Release All Pending</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Paid This Month</div><div className="val">₱{kpi.paid.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpi.paidN} agents paid</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Release</div><div className="val">₱{kpi.pend.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpi.pendN} agents pending</div></div>
        <div className="card kpi b"><div className="lbl">Avg Commission Rate</div><div className="val">4.1%</div><div className="trend" style={{ color: 'var(--muted)' }}>across all agents</div></div>
        <div className="card kpi g"><div className="lbl">Total Paid (All Time)</div><div className="val">₱842K</div><div className="trend" style={{ color: 'var(--muted)' }}>since launch</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📄 Commission Records</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }}>
              <option>This Month</option><option>Last Month</option><option>This Quarter</option><option>All Time</option>
            </select>
            <select className="qsearch" style={{ width: 'auto' }} value={filterName} onChange={(e) => setFilterName(e.target.value)}>
              <option value="">All Agents</option>
              {COMMQ_INIT.map((c, i) => <option key={i}>{c.n}</option>)}
            </select>
            <button className="mini-btn" onClick={() => toast('Commissions exported 📋')}>📋 Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                <th><input type="checkbox" className="permcb" readOnly /></th>
                <th>Agent</th><th>Period</th><th>Comm. Type</th><th>Base Amount</th><th>Rate</th><th>Commission</th><th>Payout Method</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c, i) => (
                <tr key={i}>
                  <td>{c.st === 'pend' ? <input type="checkbox" className="permcb commck" /> : ''}</td>
                  <td><div className="ag-name">{c.n}</div><div className="ag-email">{c.u}</div></td>
                  <td style={{ color: '#aab4cc' }}>{c.per}</td>
                  <td><span className="ag-type">{c.ct}</span></td>
                  <td style={{ fontWeight: 800 }}>{c.base}</td>
                  <td><span className="ag-rate">{c.rate}</span></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{c.amt}</td>
                  <td>{c.pm}</td>
                  <td>{c.st === 'paid' ? <span className="aa-status2 s-app">✅ Paid</span> : <span className="aa-status2 s-pend">⏳ Pending</span>}</td>
                  <td>
                    {c.st === 'paid'
                      ? <button className="mini-btn" onClick={() => toast(`Receipt 🧾 ${c.n} · ${c.per} · ${c.amt} via ${c.pm} — TXN PAY-${1000 + i}`)}>🧾 Receipt</button>
                      : <button className="btn-send-gold" style={{ padding: '8px 16px' }} onClick={() => release(c)}>💳 Release</button>}
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
