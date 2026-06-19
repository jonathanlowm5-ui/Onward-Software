import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INIT_PLAYERS = [
  { name: 'Juan dela Cruz', user: 'LGX10001PHP', vip: 'gold', game: 'Dice', gic: '⚡', cat: 'Crash', sec: 5520, wager: 5233, status: 'betting' },
  { name: 'Maria Santos', user: 'LGX10002PHP', vip: 'silver', game: 'Live Baccarat', gic: '🃏', cat: 'Live', sec: 1620, wager: 3968, status: 'betting' },
  { name: 'Pedro Reyes', user: 'LGX10003PHP', vip: 'diamond', game: 'Lightning Roulette', gic: '🃏', cat: 'Live', sec: 3000, wager: 3064, status: 'idle' },
  { name: 'Ana Garcia', user: 'LGX10004PHP', vip: 'bronze', game: 'Wolf Gold', gic: '🎰', cat: 'Slots', sec: 3060, wager: 7611, status: 'betting' },
  { name: 'Carlos Lim', user: 'LGX10005PHP', vip: 'silver', game: 'Live Blackjack', gic: '🃏', cat: 'Live', sec: 2700, wager: 7546, status: 'betting' },
  { name: 'Rosa Cruz', user: 'LGX10006PHP', vip: 'platinum', game: 'Football Mines', gic: '⚡', cat: 'Crash', sec: 6420, wager: 1004, status: 'betting' },
  { name: 'Jun Mendoza', user: 'LGX10007PHP', vip: 'silver', game: 'Bonanza Trillion', gic: '🎰', cat: 'Slots', sec: 5880, wager: 1401, status: 'betting' },
];

const opSecFmt = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : `0h ${m}m`; };
const opLong = (s) => s >= 3600;
const opInit = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const opVipLabel = (v) => v.charAt(0).toUpperCase() + v.slice(1);
const opStatChip = (s) => s === 'betting'
  ? <span className="op-stat bet">🎲 Betting</span>
  : s === 'idle'
    ? <span className="op-stat idle">💤 Idle</span>
    : <span className="op-stat browse">🔍 Browsing</span>;

export default function OnlinePlayers() {
  const { toast } = useUI();
  const [players, setPlayers] = useState(INIT_PLAYERS);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const online = players.length;
  const betting = players.filter((p) => p.status === 'betting').length;
  const browsing = players.filter((p) => p.status === 'browsing').length;
  const totalWager = players.reduce((s, p) => s + p.wager, 0);

  const ql = q.toLowerCase();
  const opMatch = (p) => (cat === 'all' || p.cat === cat) && (!ql || (p.name + ' ' + p.user).toLowerCase().includes(ql));

  const refresh = () => {
    setPlayers((prev) => prev.map((p) => ({
      ...p,
      sec: p.sec + Math.floor(Math.random() * 60),
      wager: p.status === 'betting' ? p.wager + Math.floor(Math.random() * 400) : p.wager,
    })));
    toast('Live sessions refreshed ↻ ' + players.length + ' players online');
  };
  const view = (p) => toast('Opening session 👁 ' + p.name + ' (' + p.user + ') · ' + p.game + ' · ₱' + p.wager.toLocaleString() + ' wagered');
  const kick = (idx) => {
    const p = players[idx];
    setPlayers((prev) => prev.filter((_, j) => j !== idx));
    toast('Player kicked ⚡ ' + p.name + ' (' + p.user + ') — session ended');
  };
  const kickAll = () => {
    if (!players.length) { toast('No active sessions to kick'); return; }
    const n = players.length;
    setPlayers([]);
    toast('All sessions terminated ⚡ ' + n + ' player' + (n !== 1 ? 's' : '') + ' kicked');
  };

  const visible = players.map((p, i) => ({ p, i })).filter(({ p }) => opMatch(p));

  return (
    <>
      <div className="op-head"><div className="grow"><span style={{ fontSize: '1.1rem' }}>🟢</span><h1 className="hero-h" style={{ margin: 0 }}>Online Players</h1><span className="op-livepill"><span className="dot"></span>{online} Live</span></div>
        <div className="op-acts"><button className="op-refresh" onClick={refresh}>↻ Refresh</button><button className="op-kickall" onClick={kickAll}>⚡ Kick All</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Online Now</div><div className="val">{online}</div><div className="trend" style={{ color: 'var(--muted)' }}>active sessions</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Currently Betting</div><div className="val">{betting}</div><div className="trend" style={{ color: 'var(--muted)' }}>active bets</div></div>
        <div className="card kpi b"><div className="lbl">Browsing</div><div className="val">{browsing}</div><div className="trend" style={{ color: 'var(--muted)' }}>in lobby</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Total Wager (Session)</div><div className="val">₱{totalWager.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>this session</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="op-tbar"><span className="ttl">Live Sessions</span><span className="sp">
          <input id="opSearch" placeholder="Search username…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="all">All Games</option><option value="Slots">Slots</option><option value="Live">Live</option><option value="Crash">Crash</option></select></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table id="opTbl" style={{ minWidth: '1080px' }}>
          <thead><tr><th>#</th><th>Player</th><th>VIP</th><th>Current Game</th><th>Category</th><th>Session Time</th><th>Session Wager</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {visible.length ? visible.map(({ p, i }) => (
              <tr key={i}>
                <td style={{ color: 'var(--muted)', fontWeight: 800 }}>{i + 1}</td>
                <td><div className="op-player"><div className="op-av">{opInit(p.name)}</div><div><div className="op-pname" onClick={() => view(p)}>{p.name}</div><div className="op-puser">{p.user}</div></div></div></td>
                <td><span className={`op-vip vip-${p.vip}`}>{opVipLabel(p.vip)}</span></td>
                <td><div className="op-game">{p.gic} {p.game}</div></td>
                <td style={{ color: '#c4cde0' }}>{p.cat}</td>
                <td className={opLong(p.sec) ? 'op-time-long' : ''} style={{ whiteSpace: 'nowrap' }}>{opSecFmt(p.sec)}</td>
                <td><span className="op-wager">₱{p.wager.toLocaleString()}</span></td>
                <td>{opStatChip(p.status)}</td>
                <td><div className="op-rowacts"><button className="op-view" onClick={() => view(p)}>View</button><button className="op-kick" onClick={() => kick(i)}>⚡ Kick</button></div></td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No players match this filter</td></tr>
            )}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
