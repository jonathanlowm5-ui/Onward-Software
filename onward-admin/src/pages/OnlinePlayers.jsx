import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { onlinePlayers, kickPlayer } from '../services/playerService';

const opSecFmt = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : `0h ${m}m`; };
const opLong = (s) => s >= 3600;
const opInit = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const VIP_TIER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const vipClass = (lvl) => VIP_TIER[Math.min(Number(lvl || 0), VIP_TIER.length - 1)] || 'bronze';
const vipLabel = (lvl) => `VIP ${Number(lvl || 0)}`;
const opStatChip = () => <span className="op-stat browse">🟢 Online</span>;

// Map a backend player record (online list) into the row shape this view renders.
function toRow(p) {
  const start = p.lastLoginAt || p.lastSeenAt;
  const sec = start ? Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 1000)) : 0;
  return {
    id: p.id,
    name: p.fullName || p.username || 'Player',
    user: p.playerCode || p.username || '—',
    vip: vipClass(p.vipLevel),
    vipLevel: p.vipLevel || 0,
    balance: Number(p.balance || 0),
    sec,
    status: 'online',
  };
}

export default function OnlinePlayers() {
  const { toast } = useUI();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(() => new Set()); // locally "kicked" from view
  const [q, setQ] = useState('');

  const load = useCallback(async (announce) => {
    try {
      const data = await onlinePlayers();
      const rows = (Array.isArray(data) ? data : data?.items || []).map(toRow);
      setPlayers(rows);
      if (announce) toast('Live sessions refreshed ↻ ' + rows.length + ' player' + (rows.length !== 1 ? 's' : '') + ' online');
    } catch (e) {
      if (announce) toast('Could not load online players: ' + (e.message || 'API error'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Initial load + auto-refresh every 25s so the list stays live.
  useEffect(() => {
    load(false);
    const t = setInterval(() => load(false), 25000);
    return () => clearInterval(t);
  }, [load]);

  const ql = q.toLowerCase();
  const visibleRows = players
    .filter((p) => !hidden.has(p.id))
    .filter((p) => !ql || (p.name + ' ' + p.user).toLowerCase().includes(ql));

  const online = visibleRows.length;
  const active = visibleRows.filter((p) => p.sec < 120).length; // joined in last 2 min
  const totalBal = visibleRows.reduce((s, p) => s + p.balance, 0);

  const view = (p) => toast('👁 ' + p.name + ' (' + p.user + ') · balance ₱' + p.balance.toLocaleString());
  // Kick: end the player's session on the backend, then drop them from view.
  const kick = async (p) => {
    if (!p.id) { setHidden((prev) => new Set(prev).add(p.id)); return; }
    try {
      await kickPlayer(p.id);
      setHidden((prev) => new Set(prev).add(p.id));
      toast('Player kicked ⚡ ' + p.name + ' — session ended (logged out on their next refresh)');
    } catch (e) {
      toast('Kick failed: ' + (e.message || 'API error'));
    }
  };
  const kickAll = () => {
    if (!visibleRows.length) { toast('No active sessions'); return; }
    setHidden((prev) => { const n = new Set(prev); visibleRows.forEach((p) => n.add(p.id)); return n; });
    toast('Cleared view ⚡ ' + visibleRows.length + ' session(s)');
  };

  return (
    <>
      <div className="op-head"><div className="grow"><span style={{ fontSize: '1.1rem' }}>🟢</span><h1 className="hero-h" style={{ margin: 0 }}>Online Players</h1><span className="op-livepill"><span className="dot"></span>{online} Live</span></div>
        <div className="op-acts"><button className="op-refresh" onClick={() => load(true)}>↻ Refresh</button><button className="op-kickall" onClick={kickAll}>⚡ Clear View</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Online Now</div><div className="val">{online}</div><div className="trend" style={{ color: 'var(--muted)' }}>logged-in sessions</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Joined &lt; 2 min</div><div className="val">{active}</div><div className="trend" style={{ color: 'var(--muted)' }}>just came online</div></div>
        <div className="card kpi b"><div className="lbl">Browsing</div><div className="val">{online}</div><div className="trend" style={{ color: 'var(--muted)' }}>active on site</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Total Balance (Online)</div><div className="val">₱{totalBal.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>across online players</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="op-tbar"><span className="ttl">Live Sessions</span><span className="sp">
          <input id="opSearch" placeholder="Search username…" value={q} onChange={(e) => setQ(e.target.value)} /></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table id="opTbl" style={{ minWidth: '1080px' }}>
          <thead><tr><th>#</th><th>Player</th><th>VIP</th><th>Player ID</th><th>Balance</th><th>Session Time</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>Loading online players…</td></tr>
            ) : visibleRows.length ? visibleRows.map((p, i) => (
              <tr key={p.id || i}>
                <td style={{ color: 'var(--muted)', fontWeight: 800 }}>{i + 1}</td>
                <td><div className="op-player"><div className="op-av">{opInit(p.name)}</div><div><div className="op-pname" onClick={() => view(p)}>{p.name}</div><div className="op-puser">{p.user}</div></div></div></td>
                <td><span className={`op-vip vip-${p.vip}`}>{vipLabel(p.vipLevel)}</span></td>
                <td style={{ color: '#c4cde0' }}>{p.user}</td>
                <td><span className="op-wager">₱{p.balance.toLocaleString()}</span></td>
                <td className={opLong(p.sec) ? 'op-time-long' : ''} style={{ whiteSpace: 'nowrap' }}>{opSecFmt(p.sec)}</td>
                <td>{opStatChip()}</td>
                <td><div className="op-rowacts"><button className="op-view" onClick={() => view(p)}>View</button><button className="op-kick" onClick={() => kick(p)}>⚡ Kick</button></div></td>
              </tr>
            )) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No players are online right now.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
