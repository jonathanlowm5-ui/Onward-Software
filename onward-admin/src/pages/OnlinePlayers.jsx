import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { onlinePlayers, kickPlayer, getPlayer } from '../services/playerService';

const opSecFmt = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}h ${String(m).padStart(2, '0')}m` : `0h ${m}m`; };
const opLong = (s) => s >= 3600;
const opInit = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const VIP_TIER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const vipClass = (lvl) => VIP_TIER[Math.min(Number(lvl || 0), VIP_TIER.length - 1)] || 'bronze';
const vipLabel = (lvl) => `VIP ${Number(lvl || 0)}`;
const opStatChip = () => <span className="op-stat browse">🟢 Online</span>;

// Map a backend player record (online list) into the row shape this view renders.
// Username is the primary indicator (that's what staff ask players for); the real
// name and Player ID are shown as secondary detail.
function toRow(p) {
  const start = p.lastLoginAt || p.lastSeenAt;
  const sec = start ? Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 1000)) : 0;
  return {
    id: p.id,
    name: p.username || 'Player',          // username = headline
    sub: p.fullName || '',                 // real name (secondary)
    user: p.playerCode || '—',             // Player ID
    vip: vipClass(p.vipLevel),
    vipLevel: p.vipLevel || 0,
    balance: Number(p.balance || 0),
    sec,
    status: 'online',
    ip: p.lastIp || p.registrationIp || '',
    country: p.lastCountry || p.registrationCountry || '',
    proxy: !!(p.lastProxy || p.registrationProxy),
    sharedIpFlag: !!p.sharedIpFlag,
    sharedIpCount: p.sharedIpCount || 0,
  };
}

export default function OnlinePlayers() {
  const { toast } = useUI();
  const { can } = useAuth();
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

  const [detail, setDetail] = useState(null); // full player record for the info modal
  const view = async (p) => {
    setDetail({ __loading: true });
    try { setDetail(await getPlayer(p.id)); }
    catch (e) { setDetail(null); toast('Could not load player: ' + (e.message || 'API error')); }
  };
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
                <td><div className="op-player"><div className="op-av">{opInit(p.name)}</div><div><div className="op-pname" onClick={() => view(p)}>{p.name} {p.proxy && <span title="VPN/Proxy" style={{ color: '#ff6675' }}>⚠</span>} {p.sharedIpFlag && <span title={`Shares IP with ${p.sharedIpCount} account(s)`} style={{ color: '#ffb02e' }}>👥</span>}</div><div className="op-puser">{p.sub || '—'}{p.ip ? ` · ${p.ip}${p.country ? ' · ' + p.country : ''}` : ''}</div></div></div></td>
                <td><span className={`op-vip vip-${p.vip}`}>{vipLabel(p.vipLevel)}</span></td>
                <td style={{ color: '#c4cde0' }}>{p.user}</td>
                <td><span className="op-wager">₱{p.balance.toLocaleString()}</span></td>
                <td className={opLong(p.sec) ? 'op-time-long' : ''} style={{ whiteSpace: 'nowrap' }}>{opSecFmt(p.sec)}</td>
                <td>{opStatChip()}</td>
                <td><div className="op-rowacts"><button className="op-view" onClick={() => view(p)}>View</button>{can('players.kick') && <button className="op-kick" onClick={() => kick(p)}>⚡ Kick</button>}</div></td>
              </tr>
            )) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No players are online right now.</td></tr>
            )}
          </tbody>
        </table></div>
      </div>

      {detail && <PlayerInfoModal detail={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

const dt = (t) => { if (!t) return '—'; const d = new Date(t); return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString(); };
const geoStr = (...parts) => parts.filter(Boolean).join(', ') || '—';

function PlayerInfoModal({ detail, onClose }) {
  const loading = detail.__loading;
  const p = detail || {};
  const Row = ({ k, v }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border, #1e2d47)' }}>
      <span style={{ color: 'var(--muted, #8898b8)', fontSize: 13 }}>{k}</span>
      <span style={{ color: 'var(--text, #fff)', fontWeight: 600, fontSize: 13, textAlign: 'right', wordBreak: 'break-word' }}>{v ?? '—'}</span>
    </div>
  );
  const yn = (b) => (b ? '✓ Yes' : '✗ No');

  return (
    <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 4000, overflowY: 'auto' }}>
      <div style={{ width: 'min(560px, 100%)', background: 'var(--surface, #0f1830)', border: '1px solid var(--border, #1e2d47)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--border, #1e2d47)' }}>
          <span style={{ fontSize: '1.2rem' }}>👤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--text, #fff)' }}>{loading ? 'Loading…' : (p.username || 'Player')}</div>
            <div style={{ fontSize: 12, color: 'var(--muted, #8898b8)' }}>{loading ? '' : (p.playerCode || '')}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '8px 18px 18px' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted, #8898b8)' }}>Loading player info…</div>
          ) : (
            <>
              <Row k="Full name" v={p.fullName} />
              <Row k="Username" v={p.username} />
              <Row k="Player ID" v={p.playerCode} />
              <Row k="Email" v={<>{p.email} {p.emailVerified ? '✓' : '✗'}</>} />
              <Row k="Mobile" v={<>{p.phone} {p.mobileVerified ? '✓' : '✗'}</>} />
              <Row k="Currency" v={p.currency} />
              <Row k="Balance" v={'₱' + Number(p.balance || 0).toLocaleString()} />
              <Row k="Bonus" v={'₱' + Number(p.bonus || 0).toLocaleString()} />
              <Row k="VIP level" v={p.vipLevel} />
              <Row k="KYC status" v={p.kyc_status} />
              <Row k="Account status" v={p.status} />
              <Row k="2FA" v={yn(p.twoFactorEnabled)} />
              <Row k="Device" v={p.registrationDevice} />
              <Row k="Registered" v={dt(p.registrationDate || p.createdAt)} />
              <Row k="Last login" v={dt(p.lastLoginAt)} />
              <Row k="Last seen" v={dt(p.lastSeenAt)} />

              {/* IP / geolocation */}
              <div style={{ fontWeight: 800, color: 'var(--text, #fff)', margin: '14px 0 4px', fontSize: 13 }}>🌐 IP &amp; Location</div>
              <Row k="Current IP" v={<>{p.lastIp || p.registrationIp || '—'} {(p.lastProxy || p.registrationProxy) && <span style={{ color: '#ff6675', fontWeight: 800 }}>⚠ VPN/Proxy</span>}</>} />
              <Row k="Current location" v={geoStr(p.lastCity || p.registrationCity, p.lastRegion, p.lastCountry || p.registrationCountry)} />
              <Row k="ISP" v={p.lastIsp || p.registrationIsp} />
              <Row k="Registration IP" v={p.registrationIp} />
              <Row k="Registration location" v={geoStr(p.registrationCity, p.registrationRegion, p.registrationCountry)} />

              {/* Shared-IP fraud flag */}
              {p.sharedIpFlag && (
                <div style={{ margin: '12px 0', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,102,117,.1)', border: '1px solid rgba(255,102,117,.35)', color: '#ff9aa6', fontSize: 12.5, fontWeight: 600 }}>
                  ⚠ Shares an IP with {p.sharedIpCount} other account{p.sharedIpCount === 1 ? '' : 's'} (possible multi-accounting)
                  {Array.isArray(p.relatedAccounts) && p.relatedAccounts.length > 0 && (
                    <div style={{ marginTop: 6, color: '#ffc2c9' }}>
                      {p.relatedAccounts.slice(0, 8).map((r) => `${r.username || r.id}${r.playerCode ? ' (' + r.playerCode + ')' : ''}`).join(', ')}
                    </div>
                  )}
                </div>
              )}

              {Array.isArray(p.bankAccounts) && p.bankAccounts.length > 0 && (
                <Row k="Bank" v={p.bankAccounts.map((b) => `${b.bankName || b.bank || ''} · ${b.accountNumber || b.number || ''}`).join(', ')} />
              )}

              {/* Recent login history with location */}
              {Array.isArray(p.loginHistory) && p.loginHistory.length > 0 && (
                <>
                  <div style={{ fontWeight: 800, color: 'var(--text, #fff)', margin: '14px 0 4px', fontSize: 13 }}>🕑 Recent logins</div>
                  {p.loginHistory.slice(0, 8).map((l, i) => (
                    <div key={l.id || i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border, #1e2d47)', fontSize: 12 }}>
                      <span style={{ color: 'var(--muted, #8898b8)' }}>{dt(l.createdAt)} · {l.event || 'login'}</span>
                      <span style={{ color: 'var(--text, #fff)', textAlign: 'right' }}>
                        {l.ip || '—'} {l.proxy && <span style={{ color: '#ff6675' }}>⚠</span>}<br />
                        <span style={{ color: 'var(--muted, #8898b8)' }}>{geoStr(l.city, l.region, l.country)}</span>
                      </span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
