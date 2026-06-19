import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const ANA_PROVIDERS = [
  { n: 'Pragmatic Play', ic: '🎰', cat: 'slots', val: 12.8, delta: 12.4, players: 2840, color: '#f4b223' },
  { n: 'PG Soft', ic: '🎰', cat: 'slots', val: 9.6, delta: 8.2, players: 2210, color: '#3aa0ff' },
  { n: 'Jili Games', ic: '🎰', cat: 'slots', val: 8.1, delta: 15.6, players: 1980, color: '#3aa0ff' },
  { n: 'Evolution Gaming', ic: '🃏', cat: 'live', val: 7.4, delta: 5.1, players: 1640, color: '#8b97b1' },
  { n: 'Hacksaw Gaming', ic: '🎰', cat: 'slots', val: 5.3, delta: 22.3, players: 1120, color: '#8b97b1' },
  { n: 'BGaming', ic: '💥', cat: 'crash', val: 4.8, delta: -2.1, players: 980, color: '#8b97b1' },
  { n: 'Spribe', ic: '✨', cat: 'crash', val: 4.2, delta: 18.7, players: 890, color: '#8b97b1' },
];
const ANA_SPORTS = {
  teams: [
    { n: 'Brazil', sub: 'Football', fl: 'BR', val: 9.2, delta: 14.2, extra: 'Win rate 52%', ic: '', color: '#f4b223' },
    { n: 'Argentina', sub: 'Football', fl: 'AR', val: 8.4, delta: 10.8, extra: 'Win rate 48%', ic: '', color: '#8b97b1' },
    { n: 'Lakers', sub: 'Basketball', fl: '🏀', val: 7.1, delta: 18.4, extra: 'Win rate 55%', ic: '', color: '#3aa0ff' },
    { n: 'France', sub: 'Football', fl: 'FR', val: 6.8, delta: 7.2, extra: 'Win rate 51%', ic: '', color: '#8b97b1' },
    { n: 'England', sub: 'Football', fl: 'EN', val: 6.5, delta: 5.9, extra: 'Win rate 47%', ic: '', color: '#8b97b1' },
    { n: 'Warriors', sub: 'Basketball', fl: '🏀', val: 5.9, delta: 22.1, extra: 'Win rate 58%', ic: '', color: '#8b97b1' },
  ],
  leagues: [
    { n: 'Premier League', sub: 'Football · ENG', fl: '⚽', val: 14.6, delta: 9.8, extra: '3,210 bets', color: '#f4b223' },
    { n: 'NBA', sub: 'Basketball · USA', fl: '🏀', val: 11.2, delta: 13.4, extra: '2,640 bets', color: '#3aa0ff' },
    { n: 'La Liga', sub: 'Football · ESP', fl: '⚽', val: 9.7, delta: 6.1, extra: '1,980 bets', color: '#8b97b1' },
    { n: 'Champions League', sub: 'Football · EU', fl: '🏆', val: 8.3, delta: 24.5, extra: '1,540 bets', color: '#8b97b1' },
    { n: 'Serie A', sub: 'Football · ITA', fl: '⚽', val: 6.1, delta: -3.2, extra: '1,120 bets', color: '#8b97b1' },
  ],
  markets: [
    { n: 'Match Winner (1X2)', sub: 'Pre-match', fl: '🎯', val: 18.4, delta: 11.2, extra: '42% of volume', color: '#f4b223' },
    { n: 'Over / Under', sub: 'Totals', fl: '📊', val: 12.1, delta: 8.7, extra: '28% of volume', color: '#3aa0ff' },
    { n: 'Handicap', sub: 'Asian / Euro', fl: '⚖️', val: 7.6, delta: 14.1, extra: '17% of volume', color: '#8b97b1' },
    { n: 'Both Teams to Score', sub: 'BTTS', fl: '⚽', val: 4.3, delta: 5.4, extra: '9% of volume', color: '#8b97b1' },
    { n: 'Live / In-Play', sub: 'Real-time', fl: '⏱️', val: 2.1, delta: 31.8, extra: '4% of volume', color: '#8b97b1' },
  ],
};
const ANA_CAT = [
  { n: 'Slots', amt: '₱28.4M', pct: 59, color: '#f4b223' },
  { n: 'Live Casino', amt: '₱12.8M', pct: 27, color: '#3aa0ff' },
  { n: 'Sports', amt: '₱4.2M', pct: 9, color: '#2ecc71' },
  { n: 'Crash', amt: '₱1.4M', pct: 3, color: '#ff8c42' },
  { n: 'Fish', amt: '₱0.5M', pct: 1, color: '#9b6dff' },
];
const ANA_COUNTRIES = [
  { fl: '🇵🇭', n: 'Philippines', amt: '₱21.4M', pct: 100 },
  { fl: '🇻🇳', n: 'Vietnam', amt: '₱9.8M', pct: 46 },
  { fl: '🇨🇳', n: 'China', amt: '₱7.2M', pct: 34 },
  { fl: '🇧🇷', n: 'Brazil', amt: '₱5.1M', pct: 24 },
  { fl: '🇮🇩', n: 'Indonesia', amt: '₱3.6M', pct: 17 },
  { fl: '🇹🇭', n: 'Thailand', amt: '₱2.7M', pct: 13 },
];
const ANA_REV = [2.1, 2.4, 2.2, 2.8, 3.1, 2.9, 3.4, 3.0, 3.6, 3.9, 3.5, 4.0, 4.3, 4.1];
const ANA_DEVICE = [['Android', '#2ecc71', 58], ['iOS', '#3aa0ff', 26], ['Desktop', '#f4b223', 16]];

// self-contained area chart (gradient fill under line)
function AnaArea({ data, color, id }) {
  const W = 720, H = 200, pad = 8, max = Math.max(...data) * 1.15 || 1;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (W - pad * 2), H - pad - (v / max) * (H - pad * 2)]);
  const line = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = pad + ',' + (H - pad) + ' ' + line + ' ' + (W - pad) + ',' + (H - pad);
  return (
    <svg className="ana-area" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.filter((_, i) => i % 2 === 0).map((p, i) => (
        <circle cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="3" fill={color} key={i} />
      ))}
    </svg>
  );
}

function AnaDonut({ center, slices }) {
  let acc = 0;
  const stops = slices.map((s) => { const a = acc; acc += s[2]; return s[1] + ' ' + a + '% ' + acc + '%'; }).join(',');
  return (
    <div className="ana-donut-wrap"><div className="ana-donut" data-c={center} style={{ background: `conic-gradient(${stops})` }}></div>
      <div className="ana-legend">{slices.map((s, i) => (
        <div className="li" key={i}><span className="sw" style={{ background: s[1] }}></span>{s[0]}<span className="pc">{s[2]}%</span></div>
      ))}</div>
    </div>
  );
}

export default function Analytics() {
  const { toast } = useUI();
  const [range, setRange] = useState('Last 7 Days');
  const [prov, setProv] = useState('all');
  const [sport, setSport] = useState('teams');

  const provs = useMemo(() => (prov === 'all' ? ANA_PROVIDERS : ANA_PROVIDERS.filter((p) => p.cat === prov)), [prov]);
  const maxProv = useMemo(() => Math.max(...ANA_PROVIDERS.map((p) => p.val)), []);
  const sports = ANA_SPORTS[sport];
  const maxSport = useMemo(() => Math.max(...sports.map((s) => s.val)), [sports]);

  const refresh = () => toast('Analytics refreshed ↻ ' + range + ' · ₱48.2M wager · 4,821 active players');

  return (
    <>
      <div className="ana-head"><div className="grow"><h1 className="hero-h">📊 Analytics</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Platform summary, provider wager rankings and sports betting insights</div></div>
        <div className="acts"><select id="anaRange" value={range} onChange={(e) => setRange(e.target.value)}><option>Today</option><option>Last 7 Days</option><option>Last 30 Days</option><option>This Year</option></select>
          <button className="set-refresh" onClick={refresh}>↻ Refresh</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total Wager</div><div className="val">₱48.2M</div><div className="trend up">↑ 12.4% vs last period</div></div>
        <div className="card kpi b"><div className="lbl">GGR</div><div className="val">₱4.1M</div><div className="trend up">↑ 8.7% vs last period</div></div>
        <div className="card kpi"><div className="lbl">Active Players</div><div className="val">4,821</div><div className="trend up">↑ 7.8% vs last period</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Session</div><div className="val">24M</div><div className="trend up">↑ 3.2% vs last period</div></div>
      </div>
      <div className="ana-2col">
        <div className="ana-card"><div className="ch">📈 Daily Revenue – Last 14 Days</div><AnaArea data={ANA_REV} color="#3aa0ff" id="anaRevGrad" /></div>
        <div className="ana-card"><div className="ch">📱 Device Split</div><AnaDonut center="Devices" slices={ANA_DEVICE} /></div>
      </div>
      <div className="ana-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ana-card">
          <div className="ch">🏆 Provider Wager Ranking<div className="ana-tabs">{[['all', 'All'], ['slots', 'Slots'], ['live', 'Live'], ['crash', 'Crash']].map((t) => (
            <button className={prov === t[0] ? 'on' : ''} onClick={() => setProv(t[0])} key={t[0]}>{t[1]}</button>
          ))}</div></div>
          <div className="ana-rank">
            {provs.length ? provs.map((p, i) => (
              <div className="ana-rrow" key={i}>
                <div className="ana-rnum">{i + 1}</div>
                <div className="ana-rmid"><div className="ana-rtop">{p.ic} {p.n}</div><div className="ana-rbar"><i style={{ width: `${(p.val / maxProv * 100).toFixed(0)}%`, background: p.color }}></i></div><div className="ana-rplayers">{p.players.toLocaleString()} players</div></div>
                <div className="ana-rright"><span className={`ana-rdelta ${p.delta >= 0 ? 'up' : 'down'}`}>{p.delta >= 0 ? '+' : ''}{p.delta}%</span> <span className="ana-rval">₱{p.val}M</span></div>
              </div>
            )) : <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '18px' }}>No providers in this category</div>}
          </div>
        </div>
        <div className="ana-card">
          <div className="ch">🌍 Sports Betting Rankings<div className="ana-tabs">{[['teams', 'Teams'], ['leagues', 'Leagues'], ['markets', 'Markets']].map((t) => (
            <button className={sport === t[0] ? 'on' : ''} onClick={() => setSport(t[0])} key={t[0]}>{t[1]}</button>
          ))}</div></div>
          <div className="ana-rank">
            {sports.map((s, i) => (
              <div className="ana-rrow" key={i}>
                <div className="ana-rnum">{i + 1}</div>
                <div className="ana-rmid"><div className="ana-rtop"><span className="fl">{s.fl}</span> {s.n}</div><div className="ana-rsub">{s.sub}</div><div className="ana-rbar"><i style={{ width: `${(s.val / maxSport * 100).toFixed(0)}%`, background: s.color }}></i></div></div>
                <div className="ana-rright"><span className="ana-rval">₱{s.val}M</span><div className="ana-rdelta up">+{s.delta}%</div><div className="ana-rplayers">{s.extra}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ana-2col" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="ana-card">
          <div className="ch">📊 Wager by Category</div>
          <div className="ana-cat-bar">{ANA_CAT.map((c, i) => (
            <i style={{ width: `${c.pct}%`, background: c.color }} title={`${c.n} ${c.pct}%`} key={i}>{c.pct >= 8 ? c.pct + '%' : ''}</i>
          ))}</div>
          <div className="ana-cat-list">{ANA_CAT.map((c, i) => (
            <div className="ana-cat-row" key={i}><span className="ana-cat-sw" style={{ background: c.color }}></span><span>{c.n}</span><span className="ana-cat-amt">{c.amt}</span><span className="ana-cat-pct">{c.pct}%</span></div>
          ))}</div>
        </div>
        <div className="ana-card">
          <div className="ch">🌎 Top Countries</div>
          <div className="ana-country">{ANA_COUNTRIES.map((c, i) => (
            <div className="ana-crow" key={i}><span className="ana-cflag">{c.fl}</span><div><div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: '5px' }}>{c.n}</div><div className="ana-cbar"><i style={{ width: `${c.pct}%` }}></i></div></div><span className="ana-camt">{c.amt}</span></div>
          ))}</div>
        </div>
      </div>
    </>
  );
}
