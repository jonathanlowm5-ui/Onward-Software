import { useUI } from '../context/UIContext';

// --- ported helpers (from original admin js) ---
function detailTbl(rows) {
  return (
    <table className="dt-tbl">
      <thead><tr><th>Detail</th><th>Total</th></tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody>
    </table>
  );
}

function pie(center, slices) {
  let acc = 0;
  const stops = slices
    .map((x) => { const a = acc; acc += x[2]; return `${x[1]} ${a}% ${acc}%`; })
    .join(',');
  return (
    <div className="pie-wrap">
      <div className="pie" data-c={center} style={{ background: `conic-gradient(${stops})` }}></div>
      <div className="legend">
        {slices.map((x, i) => (
          <div className="li" key={i}><span className="swatch" style={{ background: x[1] }}></span>{x[0]} {x[2]}%</div>
        ))}
      </div>
    </div>
  );
}

function lineChart(data, color) {
  const W = 720, H = 180, max = Math.max(...data) * 1.15;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - (v / max) * H]);
  const path = pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  return (
    <svg className="linechart" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.filter((_, i) => i % 2 === 0).map((p, i) => (
        <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="3.2" fill={color} />
      ))}
    </svg>
  );
}

// Smooth (Catmull-Rom -> Bézier) path through a set of points.
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// Gradient-filled smooth area chart. `key` makes the gradient id unique.
function areaChart(data, color, key) {
  const W = 720, H = 190, padY = 16;
  const max = Math.max(...data, 1) * 1.18;
  const min = Math.min(0, ...data);
  const range = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    padY + (1 - (v - min) / range) * (H - padY * 2),
  ]);
  const line = smoothPath(pts);
  const area = `${line} L${W.toFixed(1)},${H} L0,${H} Z`;
  const gid = `ws-grad-${key}`;
  return (
    <svg className="areachart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (i % 2 === 0 ? (
        <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="3" fill="var(--panel)" stroke={color} strokeWidth="2" />
      ) : null))}
    </svg>
  );
}

function groupedBars(groups, colors) {
  const W = 760, H = 230, padB = 22;
  const all = groups.flatMap((g) => g[1]);
  const max = Math.max(...all) * 1.08, min = Math.min(0, ...all) * 1.4;
  const y0 = (max / (max - min)) * (H - padB);
  const gw = W / groups.length, bw = Math.min(26, (gw - 40) / colors.length);
  const bars = [], labels = [];
  groups.forEach((g, gi) => {
    const cx = gi * gw + gw / 2;
    const start = cx - (colors.length * bw + (colors.length - 1) * 5) / 2;
    g[1].forEach((v, si) => {
      const h = Math.abs(v) / (max - min) * (H - padB);
      const x = start + si * (bw + 5);
      const y = v >= 0 ? y0 - h : y0;
      bars.push(<rect key={`${gi}-${si}`} x={x.toFixed(1)} y={y.toFixed(1)} width={bw} height={Math.max(h, 1).toFixed(1)} rx="2" fill={colors[si]} />);
    });
    labels.push(<text key={`l${gi}`} x={cx.toFixed(1)} y={H + 6} textAnchor="middle" fontSize="10" fill="#8b97b1">{g[0]}</text>);
  });
  return (
    <svg className="gbar-svg" viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none">
      <line x1="0" y1={y0.toFixed(1)} x2={W} y2={y0.toFixed(1)} stroke="#22304f" strokeWidth="1" />
      {bars}{labels}
    </svg>
  );
}

export default function WebStat() {
  const { toast } = useUI();
  return (
    <>
      <div className="ws-toolbar">Date Range:
        <input type="date" defaultValue="2026-05-01" /> — <input type="date" defaultValue="2026-05-31" />
        <button className="mini-btn gold" onClick={() => toast('Searching range… ✔')}>Search</button>
        <button className="mini-btn" onClick={() => toast('Exported! ⬇ web-statistic.csv')}>⬇ Export</button>
      </div>
      <div className="card"><div className="card-title">Transaction</div>
        <div className="tx3">
          <div><div className="tx-big"><div className="v v-green">100.00</div><div className="l">Total Deposit</div></div>
            {detailTbl([["Total Trans.", "1"], ["Average", "100.00"], ["Daily Average", "100.00"], ["Daily Average Trans.", "1.00"], ["No. of Player", "1"]])}</div>
          <div><div className="tx-big"><div className="v v-red">0.00</div><div className="l">Total Withdrawal</div></div>
            {detailTbl([["Total Trans.", "0"], ["Average", "0.00"], ["Daily Average", "0.00"], ["Daily Average Trans.", "0.00"], ["No. of Player", "0"]])}</div>
          <div><div className="tx-big"><div className="v v-gold">6.00</div><div className="l">Total Promotion</div></div>
            {detailTbl([["Total Trans.", "1"], ["Average", "6.00"], ["Daily Average", "6.00"], ["Daily Average Trans.", "1.00"], ["No. of Player", "0"]])}</div>
        </div>
        <div className="ws-net"><div className="v">100.00</div><div className="l">Total Net</div><div className="s">(Deposit − Withdraw)</div></div>
        {lineChart([8, 5, 9, 12, 8, 3, 7, 8, 8, 17, 13, 12, 5, 8, 9, 11, 10, 10, 9, 2, 9, 8, 4, 12, 13, 11, 8, 6, 6, 6, 1], '#3aa0ff')}
        <div className="chart-legend">
          <span className="li"><span className="ln" style={{ background: 'var(--green)' }}></span>Deposit</span>
          <span className="li"><span className="ln" style={{ background: 'var(--red)' }}></span>Withdraw</span>
          <span className="li"><span className="ln" style={{ background: 'var(--gold)' }}></span>Promotion</span>
          <span className="li"><span className="ln" style={{ background: 'var(--blue)' }}></span>Adj. In</span>
          <span className="li"><span className="ln" style={{ background: '#8b97b1' }}></span>Adj. Out</span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📊 Pie Statistics</div>
        <div className="pie-grid">
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Deposit by Method</div>
            {pie('Deposits', [["GCash", "#3aa0ff", 46], ["Bank", "#2ecc71", 24], ["USDT", "#f4b223", 18], ["Maya", "#9b6dff", 12]])}</div>
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Traffic Source</div>
            {pie('Traffic', [["Organic", "#2ecc71", 38], ["Ads", "#f4b223", 30], ["Referral", "#3aa0ff", 20], ["Direct", "#8b97b1", 12]])}</div>
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Device Split</div>
            {pie('Devices', [["Android", "#2ecc71", 58], ["iOS", "#3aa0ff", 26], ["Desktop", "#f4b223", 16]])}</div>
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Wager by Category</div>
            {pie('Wager', [["Slots", "#f4b223", 59], ["Live", "#3aa0ff", 25], ["Sports", "#ff4d5e", 16]])}</div>
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Player Market</div>
            {pie('Markets', [["PHP", "#2ecc71", 52], ["VND", "#3aa0ff", 22], ["CNY", "#f4b223", 16], ["Other", "#8b97b1", 10]])}</div>
          <div><div className="card-title" style={{ fontSize: 'var(--fs-sm)' }}>Session Time</div>
            {pie('Session', [["<5 min", "#8b97b1", 22], ["5–20 min", "#3aa0ff", 41], ["20+ min", "#2ecc71", 37]])}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">👥 Member</div>
        <div className="member-flex">
          <div className="ws-panel">
            <div className="ws-hero blue">
              <div className="ws-hero-ic">🧑‍💼</div>
              <div><div className="ws-hero-v" style={{ color: 'var(--blue)' }}>0</div><div className="ws-hero-l">Total Register</div></div>
            </div>
            <div className="ws-stat-list">
              <div className="ws-stat"><span className="k">Total Conversion</span><span className="v">0</span></div>
              <div className="ws-stat highlight"><span className="k">Conversion Rate</span><span className="v" style={{ color: 'var(--blue)' }}>0.00%</span></div>
            </div>
          </div>
          <div className="ws-chart-box">
            {areaChart([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], '#3aa0ff', 'mem')}
            <div className="chart-legend"><span className="li"><span className="ln" style={{ background: 'var(--blue)' }}></span>Member</span><span className="li"><span className="ln" style={{ background: 'var(--green)' }}></span>First Deposit</span></div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">🎲 Wager</div>
        <div className="member-flex">
          <div className="ws-panel">
            <div className="ws-hero green">
              <div className="ws-hero-ic">🎰</div>
              <div><div className="ws-hero-v">676</div><div className="ws-hero-l">No. of Record</div></div>
            </div>
            <div className="ws-stat-list">
              <div className="ws-stat"><span className="k">Total T/O</span><span className="v">668.06</span></div>
              <div className="ws-stat"><span className="k">Total Bet</span><span className="v">668.06</span></div>
              <div className="ws-stat"><span className="k">Total Payout</span><span className="v">469.71</span></div>
              <div className="ws-stat"><span className="k">Total W/L</span><span className="v neg">-198.34</span></div>
              <div className="ws-stat highlight"><span className="k">Total Profit</span><span className="v pos">198.34</span></div>
            </div>
          </div>
          <div className="ws-chart-box">
            {areaChart([120, 340, 80, 510, 420, 660, 580, 690, 610, 640, 520, 676], '#2ecc71', 'wager')}
            <div className="chart-legend"><span className="li"><span className="ln" style={{ background: 'var(--green)' }}></span>Turnover</span><span className="li"><span className="ln" style={{ background: 'var(--red)' }}></span>Payout</span></div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">Product</div>
        <div className="gbar-wrap">{groupedBars(
          [["PRAGMATIC", [75, 25, 25, 18, 4]], ["PGSOFT", [140, 300, 300, 95, 215]], ["JILI", [530, 340, 350, 360, -32]], ["FACHAI", [8, 5, 5, 4, 1]]],
          ['#454c5c', '#3aa0ff', '#f4b223', '#ff4d5e', '#2ecc71'])}</div>
        <div className="chart-legend">
          <span className="li"><span className="ln" style={{ background: '#454c5c', height: '10px', width: '10px' }}></span>No. of Record</span>
          <span className="li"><span className="ln" style={{ background: '#3aa0ff', height: '10px', width: '10px' }}></span>T/O</span>
          <span className="li"><span className="ln" style={{ background: '#f4b223', height: '10px', width: '10px' }}></span>Bet</span>
          <span className="li"><span className="ln" style={{ background: '#ff4d5e', height: '10px', width: '10px' }}></span>Payout</span>
          <span className="li"><span className="ln" style={{ background: '#2ecc71', height: '10px', width: '10px' }}></span>W/L</span>
        </div>
      </div>
    </>
  );
}
