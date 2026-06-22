import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';

// deterministic pseudo-random so the grid is stable across re-renders
function drcRand(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }

// build cohort rows: each row = a registration date, columns = periods since signup
function drcBuild(mode, cur) {
  const cols = mode === "day" ? 30 : 13;
  const dates = ["2026-06-01", "2026-05-31", "2026-05-30", "2026-05-29", "2026-05-28", "2026-05-27", "2026-05-26"];
  return dates.map((date, ri) => {
    const base = Math.round(330 - ri * 22 + drcRand(ri + 1) * 40); // cohort size shrinks for older rows
    const cells = [];
    for (let c = 0; c < cols; c++) {
      const reached = c <= (cols - 1) - Math.max(0, ri - 1);
      if (!reached) { cells.push(null); continue; }
      if (c === 0) { cells.push({ users: base, rate: 100, dep: 1000 + drcRand(ri * 7 + 1) * 700, rd: 15 + drcRand(ri * 3) * 15, roi: 4 + drcRand(ri * 5) * 8, first: true }); continue; }
      const decay = Math.pow(0.74, c) * (1 + (drcRand(ri * 13 + c) * 0.5 - 0.18));
      const rate = Math.max(1.2, +(28 * decay + (c > 6 ? drcRand(ri + c) * 3 : 0)).toFixed(2));
      const users = Math.max(5, Math.round(base * rate / 100));
      const dep = 300 + drcRand(ri * 11 + c * 3) * 1900;
      const rd = 20 + drcRand(ri * 5 + c) * 42;
      const roi = 1 + drcRand(ri * 9 + c * 2) * 11;
      cells.push({ users, rate: +rate.toFixed(2), dep: +dep.toFixed(2), rd: +rd.toFixed(2), roi: +roi.toFixed(2) });
    }
    return { date, cur, cells };
  });
}

function drcColor(rate) {
  if (rate == null) return "transparent";
  if (rate >= 40) return "rgba(46,204,113,0.16)";
  if (rate >= 20) return "rgba(46,204,113,0.09)";
  if (rate >= 10) return "rgba(244,178,35,0.08)";
  return "rgba(155,48,217,0.07)";
}
function drcRateColor(rate) {
  if (rate >= 40) return "var(--green)";
  if (rate >= 20) return "#7fd99a";
  if (rate >= 10) return "var(--gold)";
  return "#c69bff";
}
const drcMoney = (v) => v >= 1000 ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toFixed(2);

function drcCell(c) {
  if (!c) return <div className="drc-empty">—</div>;
  return (
    <div className="drc-cell" style={{ background: drcColor(c.rate) }}>
      <div className="r1"><span style={{ color: 'var(--muted)' }}>👥</span> {c.users}</div>
      <div className="rate" style={{ color: drcRateColor(c.rate) }}>{c.first ? "—" : c.rate.toFixed(2) + "%"}</div>
      <div className="m dep">💰 {drcMoney(c.dep)}</div>
      <div className="m rd">📘 {c.rd.toFixed(2)}%</div>
      <div className="m roi">📊 {c.roi.toFixed(2)}</div>
    </div>
  );
}

export default function DayRetention() {
  const { toast } = useUI();
  const [mode, setMode] = useState('day');
  const [cur, setCur] = useState('PHP');

  const data = useMemo(() => drcBuild(mode, cur), [mode, cur]);

  const drcSetMode = (m) => { if (mode === m) return; setMode(m); toast("Switched to " + (m === "day" ? "By Day" : "By Hour") + " view 📊"); };
  const drcQuery = () => toast("Cohort grid refreshed 🔍 " + cur + " · " + (mode === "day" ? "By Day" : "By Hour") + " · " + data.length + " cohorts");

  const cols = mode === "day" ? 30 : 13;
  const headCols = Array.from({ length: cols }, (_, i) => i === 0 ? "Today" : (mode === "day" ? "Day " + (i + 1) : "Hour " + (i + 1)));
  const r0 = data[0].cells;
  const kD1 = r0[1], kD7 = r0[6], kD14 = r0[13], kD30 = r0[29];
  const fmtK = (c) => c ? c.rate.toFixed(2) + "%" : "—";

  return (
    <>
      <div className="drc-head"><div className="grow"><h1 className="hero-h">📊 Day Retention Comparison</h1>
        <div className="hero-sub drc-hint" style={{ marginBottom: 0 }}>Track how many players return each day after registration. Compare <b>retained users</b>, <span className="gp">retention rate</span>, <span className="yp">average deposit</span>, <span className="bp">re-deposit ratio</span> and <span className="pp">ROI</span> across cohorts and time periods.</div></div>
        <div className="drc-toggle"><button className={mode === "day" ? "on" : ""} onClick={() => drcSetMode('day')}>📅 By Day</button><button className={mode === "hour" ? "on" : ""} onClick={() => drcSetMode('hour')}>🕒 By Hour</button></div>
      </div>
      <div className="drc-filters">
        <span className="lbl">Filters</span>
        <div className="fg"><span className="lbl">Currency</span><select value={cur} onChange={(e) => setCur(e.target.value)}><option>PHP</option><option>VND</option><option>CNY</option></select></div>
        <div className="fg"><span className="lbl">Cohort Start Date</span><input type="date" defaultValue="2026-06-01" /></div>
        <button className="qbtn" onClick={drcQuery}>🔍 Query</button>
      </div>
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
        <div className="card kpi"><div className="lbl">Day 1 Retention</div><div className="val">{fmtK(kD1)}</div><div className="trend" style={{ color: 'var(--muted)' }}>% returned next day</div></div>
        <div className="card kpi g"><div className="lbl">Day 7 Retention</div><div className="val">{fmtK(kD7)}</div><div className="trend" style={{ color: 'var(--muted)' }}>% still active week 1</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Day 14 Retention</div><div className="val">{fmtK(kD14)}</div><div className="trend" style={{ color: 'var(--muted)' }}>% still active week 2</div></div>
        <div className="card kpi r"><div className="lbl">Day 30 Retention</div><div className="val">{fmtK(kD30)}</div><div className="trend" style={{ color: 'var(--muted)' }}>% still active month 1</div></div>
        <div className="card kpi b"><div className="lbl">Avg Deposit</div><div className="val">₱{drcMoney(r0[0].dep)}</div><div className="trend" style={{ color: 'var(--muted)' }}>per user · today</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Re-deposit Ratio</div><div className="val">{r0[0].rd.toFixed(2)}%</div><div className="trend" style={{ color: 'var(--muted)' }}>made a 2nd deposit</div></div>
      </div>
      <div className="drc-info">💡 <b>How to read this table:</b> Each <b>row</b> is a registration cohort (players who signed up on that date). Each <b>column</b> is how many {mode === "day" ? "days" : "hours"} have passed since they registered. A cell shows <span style={{ color: 'var(--green)' }}>↑ higher retention</span> in green and <span style={{ color: '#c69bff' }}>↓ lower retention</span> in purple. — means the time period hasn't been reached yet.</div>
      <div className="drc-grid-wrap">
        <div className="drc-grid-head"><span className="t">📊 Cohort Retention Grid</span><span className="pill">{mode === "day" ? "By Day" : "By Hour"}</span><span className="note">Row = registration cohort · Column = time since signup</span></div>
        <div className="drc-scroll"><table className="drc-table">
          <thead><tr><th className="lead">Currency</th><th className="lead" style={{ left: '64px' }}>Cohort Date</th>{headCols.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{data.map((row, ri) => (
            <tr key={ri}>
              <td className="drc-lead"><div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '8px 0' }}><span className="drc-cur">{row.cur}</span></div></td>
              <td className="drc-lead" style={{ left: '64px' }}><div style={{ display: 'flex', alignItems: 'center', height: '100%' }}><span className="drc-date">{row.date}</span></div></td>
              {row.cells.map((c, ci) => <td key={ci}>{drcCell(c)}</td>)}
            </tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="drc-legend">
        <span className="li" style={{ color: '#c4cde0', fontWeight: 800 }}>CELL METRICS</span>
        <span className="li">👥 <b>Retained Users</b> Players still active</span>
        <span className="li" style={{ color: 'var(--green)' }}>% <b style={{ color: 'var(--green)' }}>Retention Rate</b> % of original cohort</span>
        <span className="li" style={{ color: 'var(--gold)' }}>💰 <b style={{ color: 'var(--gold)' }}>Avg Deposit</b> Per active user</span>
        <span className="li" style={{ color: 'var(--blue)' }}>📘 <b style={{ color: 'var(--blue)' }}>Re-deposit %</b> Made another deposit</span>
        <span className="li" style={{ color: '#c69bff' }}>📊 <b style={{ color: '#c69bff' }}>ROI Ratio</b> Return on investment</span>
        <span className="sep"></span>
        <span className="li"><span className="sw" style={{ background: 'rgba(46,204,113,0.6)' }}></span>≥40% Strong</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(46,204,113,0.3)' }}></span>≥20% Good</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(244,178,35,0.4)' }}></span>≥10% Fair</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(155,48,217,0.4)' }}></span>&lt;10% Low</span>
        <span className="li">— No data yet</span>
      </div>
    </>
  );
}
