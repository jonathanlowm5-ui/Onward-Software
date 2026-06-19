import { useUI } from '../context/UIContext';

const WL_CAT = [
  { n: "Slots", ic: "🎰", wagered: "₱18.4M", won: "₱15.9M", ggr: "₱2.5M", margin: 13.6 },
  { n: "Live Casino", ic: "🃏", wagered: "₱10.8M", won: "₱9.7M", ggr: "₱1.1M", margin: 10.2 },
  { n: "Crash Games", ic: "⚡", wagered: "₱5.2M", won: "₱4.4M", ggr: "₱800K", margin: 15.4 },
  { n: "Sports Betting", ic: "🏀", wagered: "₱2.4M", won: "₱2.1M", ggr: "₱300K", margin: 12.5 },
  { n: "Table Games", ic: "🃏", wagered: "₱1.4M", won: "₱1.3M", ggr: "₱120K", margin: 8.6 },
];
const WL_WINNERS = [
  { n: "Juan dela Cruz", g: "Aviator", amt: "₱820,000", d: "2025-05-22" },
  { n: "Maria Santos", g: "Sweet Bonanza", amt: "₱415,000", d: "2025-05-18" },
  { n: "Pedro Reyes", g: "Lightning Roulette", amt: "₱380,000", d: "2025-05-14" },
  { n: "Ana Garcia", g: "Gates of Olympus", amt: "₱244,000", d: "2025-05-20" },
  { n: "Carlo Mendoza", g: "Mahjong Ways", amt: "₱198,000", d: "2025-05-11" },
];
const WL_DAILY = [
  { d: "2025-05-30", bets: 48210, wagered: "₱1.42M", won: "₱1.24M", ggr: "₱180K", margin: 12.7, players: 1840 },
  { d: "2025-05-29", bets: 44800, wagered: "₱1.31M", won: "₱1.15M", ggr: "₱160K", margin: 12.2, players: 1710 },
  { d: "2025-05-28", bets: 51440, wagered: "₱1.58M", won: "₱1.36M", ggr: "₱220K", margin: 13.9, players: 1980 },
  { d: "2025-05-27", bets: 39120, wagered: "₱1.18M", won: "₱1.05M", ggr: "₱130K", margin: 11.0, players: 1540 },
  { d: "2025-05-26", bets: 36800, wagered: "₱1.04M", won: "₱912K", ggr: "₱128K", margin: 12.3, players: 1420 },
  { d: "2025-05-25", bets: 28400, wagered: "₱880K", won: "₱774K", ggr: "₱106K", margin: 12.0, players: 1100 },
  { d: "2025-05-24", bets: 29100, wagered: "₱910K", won: "₱800K", ggr: "₱110K", margin: 12.1, players: 1140 },
];

export default function Winloss() {
  const { toast } = useUI();
  const wlSearch = () => toast("Win/Loss filtered 🔍 All Games");
  const wlExport = () => toast("Win/Loss report exported ⬇ " + WL_DAILY.length + " days");

  return (
    <>
      <div className="rep-head"><div className="grow"><h1 className="hero-h">📊 Win/Loss Report</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Player win/loss summary, GGR and house edge analytics</div></div>
        <div className="acts"><input type="date" /><input type="date" /><select><option>All Game Types</option><option>Slots</option><option>Live Casino</option><option>Crash Games</option><option>Sports Betting</option></select><button className="rep-btn gold" onClick={wlSearch}>Search</button><button className="rep-btn" onClick={wlExport}>⬇ Export</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total Wagered</div><div className="val">₱38.2M</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi b"><div className="lbl">Total Player Won</div><div className="val">₱33.4M</div><div className="trend" style={{ color: 'var(--muted)' }}>87.4% payout</div></div>
        <div className="card kpi"><div className="lbl">House GGR</div><div className="val">₱4.82M</div><div className="trend" style={{ color: 'var(--muted)' }}>12.6% margin</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Biggest Win</div><div className="val">₱820K</div><div className="trend" style={{ color: 'var(--muted)' }}>Juan dela Cruz</div></div>
      </div>
      <div className="rep-2col">
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">Win/Loss by Game Category</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Category</th><th>Wagered</th><th>Won</th><th>GGR</th><th>Margin</th></tr></thead>
            <tbody>{WL_CAT.map((c, i) => <tr key={i}><td className="name">{c.ic} {c.n}</td><td className="rep-g">{c.wagered}</td><td className="rep-blue">{c.won}</td><td className="rep-green">{c.ggr}</td><td className="rep-red">{c.margin}%</td></tr>)}</tbody>
          </table></div></div>
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">Top 5 Biggest Winners</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Player</th><th>Game</th><th>Win Amount</th><th>Date</th></tr></thead>
            <tbody>{WL_WINNERS.map((w, i) => <tr key={i}><td className="name">{w.n}</td><td className="rep-mut">{w.g}</td><td className="rep-green">{w.amt}</td><td className="rep-mut">{w.d}</td></tr>)}</tbody>
          </table></div></div>
      </div>
      <div className="rep-card"><div className="rch">Daily Win/Loss Summary</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '900px' }}>
          <thead><tr><th>Date</th><th>Total Bets</th><th>Total Wagered</th><th>Total Won</th><th>GGR</th><th>Margin</th><th>Unique Players</th></tr></thead>
          <tbody>{WL_DAILY.map((r, i) => <tr key={i}><td className="rep-mut">{r.d}</td><td className="rep-blue">{r.bets.toLocaleString()}</td><td className="rep-g">{r.wagered}</td><td className="rep-blue">{r.won}</td><td className="rep-green">{r.ggr}</td><td className="rep-red">{r.margin}%</td><td className="rep-mut">{r.players.toLocaleString()}</td></tr>)}</tbody>
        </table></div>
      </div>
    </>
  );
}
