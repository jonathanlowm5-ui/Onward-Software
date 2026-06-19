import { useState } from 'react';
import { useUI } from '../context/UIContext';

const RPROVQ = [
  { n: "Pragmatic Play", games: 142, bets: 486200, wager: "₱12.4M", ggr: "₱1.48M", rtp: 88.1, top: "Sweet Bonanza", active: true },
  { n: "Evolution Gaming", games: 98, bets: 198400, wager: "₱8.2M", ggr: "₱1.02M", rtp: 87.6, top: "Lightning Roulette", active: true },
  { n: "PG Soft", games: 84, bets: 214800, wager: "₱6.8M", ggr: "₱882K", rtp: 87.0, top: "Mahjong Ways", active: true },
  { n: "Spribe", games: 12, bets: 88100, wager: "₱3.1M", ggr: "₱441K", rtp: 85.8, top: "Aviator", active: true },
  { n: "Jili Games", games: 64, bets: 142300, wager: "₱4.4M", ggr: "₱374K", rtp: 91.5, top: "Money Coming", active: true },
  { n: "Hacksaw Gaming", games: 38, bets: 62400, wager: "₱1.9M", ggr: "₱228K", rtp: 88.0, top: "Stick Em", active: true },
  { n: "Red Tiger", games: 55, bets: 41200, wager: "₱1.2M", ggr: "₱168K", rtp: 86.0, top: "Dragon's Luck", active: true },
  { n: "Microgaming", games: 120, bets: 18900, wager: "₱840K", ggr: "₱126K", rtp: 85.0, top: "Mega Moolah", active: false },
];
const killRate = (rtp) => +(100 - rtp).toFixed(1);
const killColor = (k) => k >= 14 ? "var(--red)" : k >= 12 ? "#ff8c42" : "var(--green)";

export default function ProviderReport() {
  const { toast } = useUI();
  const [range, setRange] = useState('This Month');

  const rprovRefresh = (r) => toast("Provider report refreshed ↻ " + r + " · " + RPROVQ.filter((p) => p.active).length + " active providers");
  const rprovExport = () => toast("Provider report exported ⬇ " + RPROVQ.length + " providers (incl. kill rate)");

  const avgRtp = (RPROVQ.reduce((s, p) => s + p.rtp, 0) / RPROVQ.length).toFixed(1);
  const avgKill = (RPROVQ.reduce((s, p) => s + killRate(p.rtp), 0) / RPROVQ.length).toFixed(1);

  return (
    <>
      <div className="rep-head"><div className="grow"><h1 className="hero-h">🎮 Provider Report</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Revenue, RTP, kill rate and performance breakdown by game provider</div></div>
        <div className="acts"><select value={range} onChange={(e) => { setRange(e.target.value); rprovRefresh(e.target.value); }}><option>This Month</option><option>Last Month</option><option>This Year</option></select><button className="rep-btn" onClick={rprovExport}>⬇ Export CSV</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total GGR</div><div className="val">₱4.82M</div><div className="trend up">↑ 14.2% MoM</div></div>
        <div className="card kpi b"><div className="lbl">Active Providers</div><div className="val">{RPROVQ.filter((p) => p.active).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>integrated</div></div>
        <div className="card kpi"><div className="lbl">Total Bets</div><div className="val">1.24M</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Kill Rate</div><div className="val">{avgKill}%</div><div className="trend" style={{ color: 'var(--muted)' }}>avg RTP {avgRtp}%</div></div>
      </div>
      <div className="rep-card">
        <div className="rch">Provider Performance</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '1080px' }}>
          <thead><tr><th>Provider</th><th>Games</th><th>Total Bets</th><th>Total Wager</th><th>GGR</th><th>RTP Paid</th><th>Kill Rate <span className="pw-q" title="House win efficiency = 100% − RTP. Higher = the provider retains more of player wagers.">?</span></th><th>Top Game</th><th>Status</th></tr></thead>
          <tbody>{RPROVQ.map((p, i) => {
            const k = killRate(p.rtp);
            return (<tr key={i}>
              <td className="name">{p.n}</td>
              <td className="rep-blue">{p.games}</td>
              <td className="rep-blue">{p.bets.toLocaleString()}</td>
              <td className="rep-g">{p.wager}</td>
              <td className="rep-green">{p.ggr}</td>
              <td>{p.rtp.toFixed(1)}%</td>
              <td><span className="rep-kill" style={{ color: killColor(k) }}>{k}%</span><span className="rep-kill-bar"><i style={{ width: `${Math.min(100, k / 20 * 100).toFixed(0)}%`, background: killColor(k) }}></i></span></td>
              <td className="rep-mut">{p.top}</td>
              <td>{p.active ? <span className="rep-stat-active">active</span> : <span className="rep-stat-inactive">inactive</span>}</td>
            </tr>);
          })}</tbody>
        </table></div>
      </div>
    </>
  );
}
