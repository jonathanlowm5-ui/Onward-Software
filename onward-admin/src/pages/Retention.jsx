import { useState } from 'react';
import { useUI } from '../context/UIContext';

const RET_TEAMS = [["all", "All", "🎯"], ["fba", "FB Team A", "📘"], ["fbb", "FB Team B", "📘"], ["gsea", "Google SEA", "🔍"], ["tiktok", "TikTok PH", "🎵"], ["organic", "Organic", "🌱"], ["sms", "SMS Blast", "💬"], ["email", "Email Drip", "📧"]];
const RET_CURVE = [100, 58, 52, 48, 44, 41, 40, 38, 36, 35, 34, 33, 32, 31, 30];
const RET_COHORT = [
  { m: "Jan 2025", d1: 65.2, d7: 41.0, d14: 28.3, d30: 21.1, players: 1204 },
  { m: "Feb 2025", d1: 63.8, d7: 39.5, d14: 26.7, d30: 19.8, players: 988 },
  { m: "Mar 2025", d1: 61.4, d7: 37.2, d14: 25.1, d30: 18.4, players: 1122 },
  { m: "Apr 2025", d1: 64.0, d7: 40.1, d14: 27.5, d30: 20.2, players: 1044 },
  { m: "May 2025", d1: 62.4, d7: 38.7, d14: null, d30: null, players: 926 },
];
const RET_CHURN = [
  { r: "Withdrew winnings", c: 412, s: 31.4 }, { r: "Found better offer", c: 288, s: 22.0 }, { r: "Deposit issues", c: 214, s: 16.3 },
  { r: "Game selection", c: 178, s: 13.6 }, { r: "Slow withdrawals", c: 132, s: 10.1 }, { r: "Other", c: 87, s: 6.6 },
];
const RET_REACT = [
  { c: "30-day dormant email", sent: 2840, opened: "38.2%", clicked: "12.4%", react: "8.1%", rev: "₱184K" },
  { c: "SMS comeback offer", sent: 1520, opened: "—", clicked: "24.8%", react: "11.3%", rev: "₱98K" },
  { c: "Push: free spin offer", sent: 3100, opened: "—", clicked: "18.9%", react: "9.4%", rev: "₱74K" },
];

function retCurveSvg(data) {
  const W = 1400, H = 230, padL = 40, padB = 26, padT = 10;
  const max = 100, gh = H - padB - padT, gw = W - padL - 20;
  const pts = data.map((v, i) => [padL + (i / (data.length - 1)) * gw, padT + (1 - v / max) * gh]);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const grid = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((p, i) => {
    const y = padT + (1 - p / 100) * gh;
    return (<g key={`g${i}`}>
      <line x1={padL} y1={y.toFixed(1)} x2={W - 20} y2={y.toFixed(1)} stroke="var(--border)" strokeWidth="0.5" />
      <text x="2" y={(y + 3).toFixed(1)} fill="var(--muted)" fontSize="9">{p}%</text>
    </g>);
  });
  const xl = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29].map((d, idx) => {
    const i = Math.min(d, data.length - 1); const x = padL + (i / (data.length - 1)) * gw;
    return <text key={`x${idx}`} x={x.toFixed(1)} y={H - 8} fill="var(--muted)" fontSize="9" textAnchor="middle">Day {d}</text>;
  });
  return (
    <svg className="ret-curve" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">{grid}{xl}
      <polyline points={line} fill="none" stroke="#3aa0ff" strokeWidth="2" />
      {pts.map((p, i) => <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="3" fill="#3aa0ff" />)}
    </svg>
  );
}

const retPct = (v, c) => v == null ? <span className="rep-mut">—</span> : <span style={{ color: c }}>{v.toFixed(1)}%</span>;

export default function Retention() {
  const { toast } = useUI();
  const [team, setTeam] = useState('all');
  const [period, setPeriod] = useState('Last 30 Days');
  const teamName = RET_TEAMS.find((t) => t[0] === team)[1];

  const retSearch = () => toast("Retention filtered 🔍 " + teamName + " · " + period);
  const retReset = () => { setTeam('all'); setPeriod('Last 30 Days'); toast("Retention filters reset ♻️"); };
  const retExport = () => toast("Retention exported ⬇ cohort table");

  return (
    <>
      <h1 className="hero-h">📉 Retention Statistic</h1><div className="hero-sub">Player retention, cohort analysis, churn reasons and reactivation</div>
      <div className="ret-filter">
        <div className="ttl">🔍 Filter Retention Data</div>
        <div className="fr">
          <div className="fld2"><label>View By</label><select><option>All Players</option><option>New Players</option><option>Depositors</option><option>VIP Players</option></select></div>
          <div className="fld2"><label>Period</label><select value={period} onChange={(e) => setPeriod(e.target.value)}><option>Last 30 Days</option><option>Last 60 Days</option><option>Last 90 Days</option></select></div>
          <button className="rep-btn gold" onClick={retSearch}>🔍 Search</button>
          <button className="rep-btn" onClick={retReset}>Reset</button>
          <button className="rep-btn" onClick={retExport}>⬇ Export</button>
        </div>
      </div>
      <div className="ret-quick"><span className="rep-mut" style={{ fontSize: '.66rem', fontWeight: 800 }}>Quick select:</span>{RET_TEAMS.map((t) => <span key={t[0]} className={`ret-chip${team === t[0] ? " on" : ""}`} onClick={() => setTeam(t[0])}>{t[2]} {t[1]}</span>)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}><div><div style={{ fontWeight: 800, fontSize: 'var(--fs-md)' }}>📈 Retention — {teamName}</div><div className="rep-mut" style={{ fontSize: '.72rem' }}>{period} · 5,284 total players</div></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Day-1 Retention</div><div className="val">62.4%</div><div className="trend up">↑ 4.1%</div></div>
        <div className="card kpi b"><div className="lbl">Day-7 Retention</div><div className="val">38.7%</div><div className="trend up">↑ 2.3%</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Day-30 Retention</div><div className="val">19.2%</div><div className="trend down">↓ 0.8%</div></div>
        <div className="card kpi r"><div className="lbl">Monthly Churn</div><div className="val">8.3%</div><div className="trend down">↑ 1.1%</div></div>
      </div>
      <div className="rep-card"><div className="rch">Retention Curve</div><div style={{ padding: '0 12px 14px' }}>{retCurveSvg(RET_CURVE)}</div></div>
      <div className="rep-2col">
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">Cohort Retention (%)</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Cohort</th><th>Day 1</th><th>Day 7</th><th>Day 14</th><th>Day 30</th><th>Players</th></tr></thead>
            <tbody>{RET_COHORT.map((c, i) => <tr key={i}><td className="name">{c.m}</td><td>{retPct(c.d1, "var(--green)")}</td><td>{retPct(c.d7, "var(--blue)")}</td><td>{retPct(c.d14, "var(--gold)")}</td><td>{retPct(c.d30, "#ff8c42")}</td><td className="rep-mut">{c.players.toLocaleString()}</td></tr>)}</tbody>
          </table></div></div>
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">Churn Reasons (Survey)</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Reason</th><th>Count</th><th>Share</th></tr></thead>
            <tbody>{RET_CHURN.map((c, i) => <tr key={i}><td>{c.r}</td><td className="rep-g">{c.c}</td><td className="rep-mut">{c.s}%</td></tr>)}</tbody>
          </table></div></div>
      </div>
      <div className="rep-card"><div className="rch">Reactivation Campaigns</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '800px' }}>
          <thead><tr><th>Campaign</th><th>Sent</th><th>Opened</th><th>Clicked</th><th>Reactivated</th><th>Revenue</th></tr></thead>
          <tbody>{RET_REACT.map((c, i) => <tr key={i}><td className="name">{c.c}</td><td className="rep-mut">{c.sent.toLocaleString()}</td><td className="rep-blue">{c.opened}</td><td className="rep-g">{c.clicked}</td><td className="rep-green">{c.react}</td><td className="rep-green">{c.rev}</td></tr>)}</tbody>
        </table></div>
      </div>
    </>
  );
}
