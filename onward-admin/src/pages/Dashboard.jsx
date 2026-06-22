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

export default function Dashboard() {
  return (
    <>
      <h1 className="hero-h">Dashboard</h1>
      <div className="hero-sub">Welcome back, Super Admin — here's today's overview.</div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Players</div><div className="val">52,418</div><div className="trend up">↑ 12.4% vs last month</div></div>
        <div className="card kpi g"><div className="lbl">Total Deposits (MTD)</div><div className="val">₱8.4M</div><div className="trend up">↑ 8.1% vs last month</div></div>
        <div className="card kpi b"><div className="lbl">GGR</div><div className="val">₱1.2M</div><div className="trend"><span className="up">↑ 5.3%</span> house edge 14.3%</div></div>
        <div className="card kpi r"><div className="lbl">Pending Withdrawals</div><div className="val">₱340K</div><div className="trend"><span className="warn">12 pending</span> approval</div></div>
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
