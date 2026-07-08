import { useEffect, useMemo, useState } from 'react';
import { BOk, BPend } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listCommissions, payCommission, downloadCsv } from '../services/agentService';

// Real agent commission payouts (same records as Agent → Commission).
const KIND = { cpa: '🎯 CPA', revshare: '📈 RevShare', hybrid: '🔀 Hybrid', adjustment: '✍️ Adjustment' };
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function PayoutHistory() {
  const { toast } = useUI();
  const [paid, setPaid] = useState([]);
  const [pending, setPending] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('paid'); // 'paid' | 'pending'

  const load = () => Promise.all([
    listCommissions({ status: 'paid' }),
    listCommissions({ status: 'pending' }),
  ]).then(([p, q]) => {
    setPaid(Array.isArray(p) ? p : []);
    setPending(Array.isArray(q) ? q : []);
    setLoaded(true);
  }).catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load payouts')); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = view === 'paid' ? paid : pending;

  const kpi = useMemo(() => ({
    paidSum: paid.reduce((s, c) => s + Number(c.amount || 0), 0),
    pendSum: pending.reduce((s, c) => s + Number(c.amount || 0), 0),
    agents: new Set([...paid, ...pending].map((c) => c.agentId)).size,
  }), [paid, pending]);

  const release = async (c) => {
    try {
      await payCommission(c.id);
      toast(`Commission released 💸 ${c.agentUsername} · ${money(c.amount)} ${c.currency || ''}`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Payout failed')); }
  };

  const exportCsv = () => {
    downloadCsv(`payouts-${view}.csv`,
      ['Agent', 'Period', 'Type', 'Detail', 'Amount', 'Currency', 'Status', 'Paid at'],
      rows.map((c) => [c.agentUsername, c.period, c.kind, c.detail, c.amount, c.currency, c.status, (c.paidAt || '').slice(0, 10)]));
    toast(`CSV exported ⬇ payouts-${view}.csv (${rows.length} rows)`);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">💸 Payout History</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Real commission payouts to agents — released records credit the agent's balance</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="qsearch" style={{ width: 'auto' }} value={view} onChange={(e) => setView(e.target.value)}>
            <option value="paid">✅ Paid</option>
            <option value="pending">⏳ Pending</option>
          </select>
          <button className="mini-btn" onClick={exportCsv}>📋 Export</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total Paid</div><div className="val">{money(kpi.paidSum)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{paid.length} payout{paid.length !== 1 ? 's' : ''}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Pending Release</div><div className="val">{money(kpi.pendSum)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{pending.length} record{pending.length !== 1 ? 's' : ''}</div></div>
        <div className="card kpi b"><div className="lbl">Agents Involved</div><div className="val">{kpi.agents}</div><div className="trend" style={{ color: 'var(--muted)' }}>paid or pending</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Per Payout</div><div className="val">{paid.length ? money(kpi.paidSum / paid.length) : '—'}</div><div className="trend" style={{ color: 'var(--muted)' }}>paid records</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1000 }}>
            <thead><tr><th>Agent</th><th>Period</th><th>Type</th><th>Detail</th><th>Amount</th><th>Status</th><th>{view === 'paid' ? 'Paid At' : 'Action'}</th></tr></thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? (view === 'paid' ? 'No paid commissions yet — generate & release them under Agent → Commission.' : 'No pending commissions 🎉') : 'Loading…'}
                </td></tr>
              )}
              {rows.map((c) => (
                <tr key={c.id}>
                  <td><div className="ag-name">{c.agentUsername}</div></td>
                  <td style={{ color: '#aab4cc' }}>{c.period}</td>
                  <td><span className="ag-type">{KIND[c.kind] || c.kind}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{c.detail}</td>
                  <td style={{ color: Number(c.amount) < 0 ? 'var(--red,#ff5c5c)' : 'var(--gold)', fontWeight: 900 }}>{money(c.amount)} {c.currency || ''}</td>
                  <td>{c.status === 'paid' ? <BOk>✅ Paid</BOk> : <BPend>⏳ Pending</BPend>}</td>
                  <td>
                    {c.status === 'paid'
                      ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(c.paidAt || '').slice(0, 10) || '—'}</span>
                      : <button className="btn-send-gold" style={{ padding: '7px 14px' }} onClick={() => release(c)}>💸 Release</button>}
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
