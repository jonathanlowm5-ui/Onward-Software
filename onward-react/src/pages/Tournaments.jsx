import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { TRN_LEADERBOARD } from '../services/data/gameData';
import api from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];
const LB_COLORS = ['#f0c040', '#e8293a', '#38bdf8', '#a855f7', '#22c55e', '#f97316', '#7c3aed', '#0ea5e9'];

// "2026-05-01T00:00" / ISO → "01.05.2026" (matches the showcase badges).
const fmtDate = (v) => {
  const s = String(v || '').slice(0, 10);
  return s ? s.split('-').reverse().join('.') : '';
};

function fmtCountdown(secs) {
  if (secs <= 0) return 'ENDED';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Tournaments() {
  const { openModal, toast } = useUI();
  const { isLoggedIn } = useAuth();
  const [tab, setTab] = useState('active');

  // Admin-managed tournaments from the backend. null = still loading (the
  // bundled showcase renders meanwhile so nothing flashes empty); [] = none.
  const [tourns, setTourns] = useState(null);
  const [selId, setSelId] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/tournaments', { params: { active: 1 } })
      .then((r) => { if (alive) setTourns(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) setTourns([]); });
    return () => { alive = false; };
  }, []);
  const list = Array.isArray(tourns) ? tourns : [];
  const sel = list.find((t) => String(t.id) === String(selId)) || list[0] || null;

  // Live leaderboard: real rows for the selected tournament (showcase rows
  // remain as the fallback when no tournament is configured).
  const [board, setBoard] = useState(() => TRN_LEADERBOARD.map((p) => ({ ...p })));
  const [updated, setUpdated] = useState('Updating live…');
  useEffect(() => {
    if (!sel?.id) return undefined;
    let alive = true;
    const load = () => api.get(`/tournaments/${sel.id}/leaderboard`)
      .then((r) => {
        if (!alive) return;
        setBoard(Array.isArray(r.data?.rows) ? r.data.rows : []);
        setUpdated('Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      })
      .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { alive = false; clearInterval(id); };
  }, [sel?.id]);

  // Countdown — from the tournament's real end timestamp when present.
  const [secs, setSecs] = useState(6675); // 01:51:15 showcase fallback

  useEffect(() => {
    const endTs = sel?.end ? Date.parse(sel.end) : NaN;
    const tick = () => {
      if (!Number.isNaN(endTs)) setSecs(Math.max(0, Math.floor((endTs - Date.now()) / 1000)));
      else setSecs((s) => (s <= 0 ? 0 : s - 1));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sel?.end]);

  const joinTournament = () => {
    if (!isLoggedIn) { openModal('register'); return; }
    toast("You're in — play the tournament games to climb the leaderboard!");
  };

  const countdown = useMemo(() => fmtCountdown(secs), [secs]);

  return (
    <div id="view-tournaments">
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '26px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'inline-block', width: '4px', height: '28px', background: 'linear-gradient(to bottom,var(--gold),var(--gold-dark))', borderRadius: '2px' }}></span>
              <span data-i18n="nav_tournaments">Tournaments</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '16px' }} data-i18n="trn_compete_desc">Compete, climb the leaderboard, win big prizes</div>
          </div>
          <div className="seg-tabs">
            <button className={'trn-tab' + (tab === 'active' ? ' active' : '')} id="trn-tab-active" onClick={() => setTab('active')} data-i18n="trn_tab_active">🟢 Active</button>
            <button className={'trn-tab' + (tab === 'upcoming' ? ' active' : '')} id="trn-tab-upcoming" onClick={() => setTab('upcoming')} data-i18n="trn_tab_upcoming">🔜 Upcoming</button>
            <button className={'trn-tab' + (tab === 'finished' ? ' active' : '')} id="trn-tab-finished" onClick={() => setTab('finished')} data-i18n="trn_tab_finished">✅ Finished</button>
          </div>
        </div>

        {/* ACTIVE TOURNAMENTS */}
        <div id="trn-section-active" style={{ display: tab === 'active' ? '' : 'none' }}>

          {/* Featured card: first/selected real tournament, or the showcase Fast Tournament */}
          {sel ? (
            <div className="trn-featured-card" id="trn-fast">
              <div className="trn-featured-bg" style={sel.banner
                ? { background: `url(${sel.banner}) center/cover no-repeat` }
                : { background: 'linear-gradient(120deg,#1a0010 0%,#3a0020 40%,#8b0000 100%)' }}></div>
              <div className="trn-featured-overlay"></div>
              <div className="trn-featured-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--red)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '5px', letterSpacing: '.08em' }}>⚡ LIVE</span>
                  {sel.provider && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>{sel.provider}</span>}
                  {sel.end && (
                    <>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }} data-i18n="trn_ends_in">Ends in:</span>
                      <span id="trn-countdown" style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '18px', fontWeight: 900, color: secs <= 0 ? 'var(--text-muted)' : 'var(--gold)' }}>{countdown}</span>
                    </>
                  )}
                </div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>{sel.title}</div>
                {(sel.desc || sel.buyIn) && (
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>{sel.desc || sel.buyIn}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {sel.prize && <div className="trn-prize-big">🏆 {sel.prize}</div>}
                  {sel.prizeFs && <div className="trn-prize-big" style={{ background: 'rgba(249,115,22,.2)', borderColor: 'rgba(249,115,22,.4)', color: '#f97316' }}>🎰 {sel.prizeFs}</div>}
                  <button className="btn btn-primary" onClick={joinTournament} style={{ padding: '11px 28px', fontSize: '14px' }} data-i18n="ui_join_now">Join Now</button>
                </div>
              </div>
              <div className="trn-featured-deco">⏱️</div>
            </div>
          ) : (
            <div className="trn-featured-card" id="trn-fast">
              <div className="trn-featured-bg" style={{ background: 'linear-gradient(120deg,#1a0010 0%,#3a0020 40%,#8b0000 100%)' }}></div>
              <div className="trn-featured-overlay"></div>
              <div className="trn-featured-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--red)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '5px', letterSpacing: '.08em' }} data-i18n="trn_badge_fast">⚡ FAST</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }} data-i18n="trn_ends_in">Ends in:</span>
                  <span id="trn-countdown" style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '18px', fontWeight: 900, color: secs <= 0 ? 'var(--text-muted)' : 'var(--gold)' }}>{countdown}</span>
                </div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}><span data-i18n="trn_fast_name">FAST TOURNAMENT</span> #3</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }} data-i18n="trn_duration_desc">Duration: 2 hours · Top 20 players win prizes</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="trn-prize-big">🏆 18,450 ₱</div>
                  <button className="btn btn-primary" onClick={joinTournament} style={{ padding: '11px 28px', fontSize: '14px' }} data-i18n="ui_join_now">Join Now</button>
                </div>
              </div>
              <div className="trn-featured-deco">⏱️</div>
            </div>
          )}

          {/* Live Leaderboard for Fast Tournament */}
          <div className="trn-leaderboard-wrap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏅</span> {sel ? <span>{sel.title} Leaderboard</span> : <span data-i18n="trn_lb_title">Fast Tournament Leaderboard</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', padding: '2px 8px', borderRadius: '100px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s infinite', display: 'inline-block' }}></span><span data-i18n="trn_live">LIVE</span>
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }} id="trn-lb-updated" data-i18n="trn_updating">{updated}</div>
            </div>
            <div className="trn-lb-table">
              <div className="trn-lb-head">
                <span style={{ width: '40px', textAlign: 'center' }}>#</span>
                <span style={{ flex: 1 }} data-i18n="trn_player">Player</span>
                <span style={{ width: '100px', textAlign: 'right' }} data-i18n="trn_score">Score</span>
                <span style={{ width: '130px', textAlign: 'right' }} data-i18n="trn_prize">Prize</span>
              </div>
              <div id="trn-lb-rows">
                {sel && !board.length ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No entries yet — play the tournament games to appear here!
                  </div>
                ) : board.map((p, i) => (
                  <div key={p.player + '-' + i} className={'trn-lb-row' + (p.rank === 1 ? ' top1' : p.rank === 2 ? ' top2' : p.rank === 3 ? ' top3' : '')}>
                    <div className="trn-lb-rank">{MEDALS[p.rank - 1] || p.rank}</div>
                    <div className="trn-lb-player">
                      <div className="trn-lb-avatar" style={{ background: p.color || LB_COLORS[i % LB_COLORS.length] }}>{p.avatar || String(p.player || '?').charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{p.player}</span>
                    </div>
                    <div className="trn-lb-score">{Math.round(p.score != null ? p.score : p.wagered || 0).toLocaleString()} pts</div>
                    <div className="trn-lb-prize">{p.prize != null ? p.prize : `₱${Math.round(p.won || 0).toLocaleString()}`}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button className="see-all" onClick={() => openModal('register')} data-i18n="trn_view_leaderboard">View Full Leaderboard</button>
            </div>
          </div>

          {/* Real tournaments: the rest of the admin list. Showcase (Pixel Rush +
              network grid) only renders when the API returned no tournaments. */}
          {sel ? (
            list.filter((t) => t !== sel).length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }}>MORE TOURNAMENTS</div>
                <div className="tourn-grid">
                  {list.filter((t) => t !== sel).map((t) => (
                    <div key={t.id} className="tourn-card" onClick={() => setSelId(t.id)} style={{ minHeight: '200px' }}>
                      <div className="tourn-card-bg" style={t.banner
                        ? { background: `url(${t.banner}) center/cover no-repeat` }
                        : { background: 'linear-gradient(135deg,#0a1428 0%,#1a2840 50%,#243050 100%)' }}></div>
                      <div className="tourn-card-overlay"></div>
                      {(t.start || t.end) && (
                        <div className="tourn-badge">{fmtDate(t.start)}{t.start && t.end ? ' – ' : ''}{fmtDate(t.end)}</div>
                      )}
                      {t.provider && <div className="tourn-provider">{t.provider.toUpperCase()}</div>}
                      <div className="tourn-content">
                        <div className="tourn-title">{t.title}</div>
                        {(t.desc || t.buyIn) && <div className="tourn-desc">{t.desc || t.buyIn}</div>}
                        {(t.prize || t.prizeFs) && (
                          <div className="tourn-prizes">
                            {t.prize && <div className="tourn-prize-pill">{t.prize}</div>}
                            {t.prizeFs && <div className="tourn-prize-pill">{t.prizeFs}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
          <>
          {/* Pixel Rush featured card */}
          <div className="trn-featured-card" style={{ marginTop: '20px' }}>
            <div className="trn-featured-bg" style={{ background: 'linear-gradient(120deg,#0d0830 0%,#1a1060 40%,#0d47a1 100%)' }}></div>
            <div className="trn-featured-overlay"></div>
            <div className="trn-featured-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(240,192,64,.2)', border: '1px solid rgba(240,192,64,.4)', color: 'var(--gold)', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '5px', letterSpacing: '.08em' }}>🕐 6 DAYS LEFT</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)' }}>21-day tournament</span>
              </div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>PIXEL RUSH</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>Collect points on featured slot games. Top 100 players share the prize pool.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="trn-prize-big">🏆 799,570 ₱</div>
                <div className="trn-prize-big" style={{ background: 'rgba(249,115,22,.2)', borderColor: 'rgba(249,115,22,.4)', color: '#f97316' }}>🎰 2,000 FS</div>
                <button className="btn btn-primary" onClick={joinTournament} style={{ padding: '11px 28px', fontSize: '14px' }} data-i18n="trn_join">Join Tournament</button>
              </div>
            </div>
            <div className="trn-featured-deco">🎰</div>
          </div>

          {/* Network tournaments grid */}
          <div style={{ marginTop: '32px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px' }} data-i18n="trn_network">NETWORK TOURNAMENTS</div>
            <div className="tourn-grid">

              <div className="tourn-card" onClick={() => openModal('register')} style={{ minHeight: '200px' }}>
                <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#6d0020 0%,#8b0000 50%,#5a0010 100%)' }}></div>
                <div className="tourn-card-overlay"></div>
                <div className="tourn-badge">01.05.2026 – 07.01.2027</div>
                <div className="tourn-provider">3 OAKS</div>
                <div className="tourn-content">
                  <div className="tourn-title">Lucky Races by 3 Oaks Gaming</div>
                  <div className="tourn-desc">Play daily tournaments and trigger Lucky Drops to win a share of 151,000 EUR.</div>
                  <div className="tourn-prizes"><div className="tourn-prize-pill euro">€2,500,000</div></div>
                </div>
              </div>

              <div className="tourn-card" onClick={() => openModal('register')} style={{ minHeight: '200px' }}>
                <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#0a1a0a 0%,#1a2a10 50%,#243018 100%)' }}></div>
                <div className="tourn-card-overlay"></div>
                <div className="tourn-badge">04.03.2026 – 03.03.2027</div>
                <div className="tourn-provider">PRAGMATIC PLAY</div>
                <div className="tourn-content">
                  <div className="tourn-title">Drops &amp; Wins by Pragmatic Play</div>
                  <div className="tourn-desc">Total Prize Pool: 25,000,000 EUR</div>
                </div>
              </div>

              <div className="tourn-card" onClick={() => openModal('register')} style={{ minHeight: '200px' }}>
                <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#0a1428 0%,#1a2840 50%,#243050 100%)' }}></div>
                <div className="tourn-card-overlay"></div>
                <div className="tourn-badge">01.01.2026 – 03.01.2027</div>
                <div className="tourn-provider">GAMZIX</div>
                <div className="tourn-content">
                  <div className="tourn-title">Spin Express by Gamzix</div>
                  <div className="tourn-desc">Total yearly prize pool: 1,000,000 EUR</div>
                </div>
              </div>

              <div className="tourn-card" onClick={() => openModal('register')} style={{ minHeight: '200px' }}>
                <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#2a0a00 0%,#4a1500 50%,#6a2800 100%)' }}></div>
                <div className="tourn-card-overlay"></div>
                <div className="tourn-badge">29.01.2026 – 19.09.2026</div>
                <div className="tourn-provider">Platipus</div>
                <div className="tourn-content">
                  <div className="tourn-title">Platipus Network Tournament</div>
                  <div className="tourn-desc">Total Prize Pool: 125,000 EUR</div>
                </div>
              </div>

              <div className="tourn-card" onClick={() => openModal('register')} style={{ minHeight: '200px' }}>
                <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#4a0080 0%,#7c00c0 50%,#9c10d0 100%)' }}></div>
                <div className="tourn-card-overlay"></div>
                <div className="tourn-badge">01.01.2026 – 01.01.2027</div>
                <div className="tourn-content">
                  <div className="tourn-title">BGaming Millions of Drops</div>
                  <div className="tourn-desc">€1,000,000 — 77k+ prizes</div>
                </div>
              </div>

            </div>
          </div>
          </>
          )}

        </div>{/* /trn-section-active */}

        {/* UPCOMING TOURNAMENTS */}
        <div id="trn-section-upcoming" style={{ display: tab === 'upcoming' ? '' : 'none' }}>
          <div className="trn-featured-card">
            <div className="trn-featured-bg" style={{ background: 'linear-gradient(120deg,#0a1428 0%,#1a2840 50%,#2a3a60 100%)' }}></div>
            <div className="trn-featured-overlay"></div>
            <div className="trn-featured-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(56,189,248,.2)', border: '1px solid rgba(56,189,248,.4)', color: '#38bdf8', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '5px' }}>🔜 STARTS IN 2 DAYS</span>
              </div>
              <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>MEGA SLOTS BATTLE</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>7-day tournament · All slots eligible · Top 50 win prizes</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="trn-prize-big">🏆 250,000 ₱</div>
                <div className="trn-prize-big" style={{ background: 'rgba(249,115,22,.2)', borderColor: 'rgba(249,115,22,.4)', color: '#f97316' }}>🎰 5,000 FS</div>
                <button className="btn btn-outline" onClick={() => openModal('register')} style={{ padding: '11px 28px', fontSize: '14px' }} data-i18n="trn_remind">Remind Me</button>
              </div>
            </div>
            <div className="trn-featured-deco">⚔️</div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div className="trn-featured-card">
              <div className="trn-featured-bg" style={{ background: 'linear-gradient(120deg,#001a0a 0%,#003820 50%,#005a30 100%)' }}></div>
              <div className="trn-featured-overlay"></div>
              <div className="trn-featured-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ background: 'rgba(34,197,94,.2)', border: '1px solid rgba(34,197,94,.4)', color: 'var(--green)', fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '5px' }}>🔜 STARTS IN 5 DAYS</span>
                </div>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>LIVE CASINO ROYALE</div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.55)', marginBottom: '18px' }}>3-day live casino exclusive · Roulette, Blackjack &amp; Baccarat</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="trn-prize-big">🏆 500,000 ₱</div>
                  <button className="btn btn-outline" onClick={() => openModal('register')} style={{ padding: '11px 28px', fontSize: '14px' }}>Remind Me</button>
                </div>
              </div>
              <div className="trn-featured-deco">🃏</div>
            </div>
          </div>
        </div>{/* /trn-section-upcoming */}

        {/* FINISHED TOURNAMENTS */}
        <div id="trn-section-finished" style={{ display: tab === 'finished' ? '' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' }}>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', opacity: .75 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>⚡ Fast</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,.07)', padding: '3px 8px', borderRadius: '5px', color: 'var(--text-muted)' }} data-i18n="trn_ended">Ended</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>FAST TOURNAMENT #2</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>18.05.2026 · 2-hour event</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--gold)' }}>18,450 ₱</span>
                <span style={{ fontSize: '12px', color: 'var(--green)' }}>🏆 Winner: mar***67</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', opacity: .75 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>🎰 Slots</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,.07)', padding: '3px 8px', borderRadius: '5px', color: 'var(--text-muted)' }}>Ended</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>MAY SLOTS MANIA</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>01.05.2026 – 15.05.2026 · 14-day event</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--gold)' }}>320,000 ₱</span>
                <span style={{ fontSize: '12px', color: 'var(--green)' }}>🏆 Winner: kev***12</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', opacity: .75 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>🃏 Live Casino</span>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,.07)', padding: '3px 8px', borderRadius: '5px', color: 'var(--text-muted)' }}>Ended</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>APRIL LIVE LEGENDS</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>20.04.2026 – 30.04.2026 · 10-day event</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--gold)' }}>180,000 ₱</span>
                <span style={{ fontSize: '12px', color: 'var(--green)' }}>🏆 Winner: ana***88</span>
              </div>
            </div>

          </div>
        </div>{/* /trn-section-finished */}

      </div>
    </div>
  );
}
