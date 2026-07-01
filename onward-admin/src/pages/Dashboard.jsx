import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listPlayers } from '../services/playerService';
import { listTransactions } from '../services/walletService';
import useCurrencyRates from '../hooks/useCurrencyRates';
import { symbolFor, amountNum, convert } from '../services/currencyService';

const TODAY_RECORDS = [
  ['Today New Member', '1', '(-85.71%)', 'down'],
  ['Today First Deposit', '1', '(0.00%)', 'up'],
  ['Today Profit', '2,276.00', '(51.94%)', 'up'],
  ['Today Deposit', '3,600.00', '(125.00%)', 'up'],
  ['Today Withdrawal', '0.00', '(0.00%)', 'up'],
  ['Today Promotion', '1,324.00', '(1198.04%)', 'up'],
  ['Today Adj. In', '0.00', '(0.00%)', 'up'],
  ['Today Adj. Out', '0.00', '(0.00%)', 'up'],
];

const FEED = [
  ['#ff8c42', 'Withdraw request ₱10,000 — pending', 'just now'],
  ['#3aa0ff', 'New deposit ₱8,000 via GCash', '1m ago'],
  ['#2ecc71', 'Maria won ₱1,500 on Baccarat', '2m ago'],
  ['#2ecc71', 'Pedro won ₱45,000 on Aviator', '3m ago'],
  ['#9b6dff', 'New player registered LGX10422PHP', '5m ago'],
  ['#ff4d5e', 'KYC document rejected — LGX09112VND', '8m ago'],
];

const BARS = [42, 58, 35, 72, 64, 88, 100];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Compact money label (₱8.4M / RM340K) in the reporting currency.
function compact(n, sym) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${sym}${Math.round(n / 1e3)}K`;
  return `${sym}${Math.round(n).toLocaleString()}`;
}

export default function Dashboard() {
  const { currency: reportCur } = useUI();
  const { rates } = useCurrencyRates();
  const [players, setPlayers] = useState([]);
  const [txns, setTxns] = useState([]);
  useEffect(() => {
    listPlayers().then((d) => setPlayers(Array.isArray(d) ? d : (d?.items || d?.data || []))).catch(() => {});
    listTransactions().then((d) => setTxns(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const sym = symbolFor(reportCur) || '₱';
  const toRep = (amt, cur) => convert(amountNum(amt), cur || 'PHP', reportCur, rates);
  const isCredit = (t) => t.type === 'deposit' && ['approved', 'completed', 'success'].includes(String(t.status || '').toLowerCase());
  const deposits = txns.filter(isCredit).reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const pendingWd = txns.filter((t) => t.type === 'withdrawal' && String(t.status).toLowerCase() === 'pending');
  const pendingWdSum = pendingWd.reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const ggr = deposits * 0.143; // rough house edge estimate until bet data is wired
  const hasData = players.length > 0 || txns.length > 0;

  return (
    <>
      <h1 className="hero-h">Dashboard</h1>
      <div className="hero-sub">Welcome back, Super Admin — here's today's overview. <span style={{ color: 'var(--muted,#8898b8)' }}>Amounts in {reportCur}.</span></div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Players</div><div className="val">{hasData ? players.length.toLocaleString() : '52,418'}</div><div className="trend up">↑ 12.4% vs last month</div></div>
        <div className="card kpi g"><div className="lbl">Total Deposits (MTD)</div><div className="val">{hasData ? compact(deposits, sym) : `${sym}8.4M`}</div><div className="trend up">↑ 8.1% vs last month</div></div>
        <div className="card kpi b"><div className="lbl">GGR</div><div className="val">{hasData ? compact(ggr, sym) : `${sym}1.2M`}</div><div className="trend"><span className="up">↑ 5.3%</span> house edge 14.3%</div></div>
        <div className="card kpi r"><div className="lbl">Pending Withdrawals</div><div className="val">{hasData ? compact(pendingWdSum, sym) : `${sym}340K`}</div><div className="trend"><span className="warn">{hasData ? pendingWd.length : 12} pending</span> approval</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Today Records</div>
        <div className="rowlist">
          {TODAY_RECORDS.map((r, i) => (
            <div className="rowline" key={i}><span className="k">{r[0]}</span><span className="v">{r[1]}<span className={`pct ${r[3]}`}>{r[2]}</span></span></div>
          ))}
        </div>
      </div>
      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card">
          <div className="card-title">🛰️ Live Activity Feed <span className="live-pill">Live</span></div>
          <div className="rowlist">
            {FEED.map((r, i) => (
              <div className="rowline" key={i}><span className="k" style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span className="feed-dot" style={{ background: r[0] }}></span>{r[1]}</span><span className="feed-time">{r[2]}</span></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">📊 Revenue Split</div>
          <div className="donut-wrap">
            <div className="donut"></div>
            <div className="legend">
              <div className="li"><span className="swatch" style={{ background: 'var(--gold)' }}></span>Slots 59%</div>
              <div className="li"><span className="swatch" style={{ background: 'var(--blue)' }}></span>Live 25%</div>
              <div className="li"><span className="swatch" style={{ background: 'var(--red)' }}></span>Sports 16%</div>
            </div>
          </div>
          <div className="card-title" style={{ marginTop: '18px' }}>📈 Deposits — 7 Days</div>
          <div className="bars-wrap"><div className="bars">
            {BARS.map((h, i) => (
              <div className="bar" style={{ height: `${h}%` }} key={i}><span>{DAYS[i]}</span></div>
            ))}
          </div></div>
        </div>
      </div>
    </>
  );
}
