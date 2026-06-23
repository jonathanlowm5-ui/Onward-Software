import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/*
 * Mini Games modal (#fortune). The sidebar "Mini Games" entry opens this. It is
 * the real Fortune Wheel + Lucky Ticket configured by the admin (Promotions →
 * Mini Games), not the third-party casino catalogue. The wheel slices, prizes,
 * weights, colours and spin economics all come from GET /api/mini-games and a
 * spin is settled server-side (POST /api/mini-games/wheel/spin) so the prize is
 * credited to the player's real balance.
 */

// Build the conic-gradient + per-slice centre angles. Segments are ALWAYS equal
// size visually; a slice's weight only controls its win chance (decided
// server-side), not how big it looks on the wheel.
function wheelGeometry(active) {
  const n = active.length || 1;
  const seg = 360 / n;
  const stops = [];
  const centers = [];
  active.forEach((s, i) => {
    const start = i * seg;
    const end = (i + 1) * seg;
    stops.push(`${s.c} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
    centers.push((start + end) / 2);
  });
  return { gradient: `conic-gradient(from 0deg, ${stops.join(',')})`, centers };
}

function FortuneWheel({ config, onClose }) {
  const { toast, openModal, currency } = useUI();
  const { isLoggedIn, profile, refreshProfile } = useAuth();
  const wheel = config?.wheel || {};
  const active = useMemo(() => (wheel.slices || []).filter((s) => s.on), [wheel.slices]);
  const { gradient, centers } = useMemo(() => wheelGeometry(active), [active]);
  // A custom wheel PNG uses equal segments (in slice order) for landing.
  const wheelImage = wheel.image || '';
  const landCenters = useMemo(
    () => (wheelImage ? active.map((_, i) => (i + 0.5) * (360 / (active.length || 1))) : centers),
    [wheelImage, active, centers],
  );

  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [status, setStatus] = useState(null); // { freeLeft, spinsToday, maxPerDay, spinCost }
  const [result, setResult] = useState(null); // { label, won }
  const timer = useRef(null);

  const loadStatus = () => {
    if (!isLoggedIn) { setStatus(null); return; }
    api.get('/mini-games/wheel/status').then((r) => setStatus(r.data)).catch(() => {});
  };
  useEffect(() => { loadStatus(); return () => clearTimeout(timer.current); /* eslint-disable-next-line */ }, [isLoggedIn]);

  const sym = currency?.symbol || '₱';
  const freeLeft = status?.freeLeft ?? wheel.freeSpinsPerDay ?? 0;
  const spinCost = status?.spinCost ?? wheel.spinCost ?? 0;
  const isPaid = freeLeft <= 0 && spinCost > 0;

  const spin = async () => {
    if (spinning) return;
    if (!isLoggedIn) { toast('Please log in to spin', 'info'); onClose?.(); openModal('login'); return; }
    if (!active.length) { toast('Wheel not available right now', 'error'); return; }
    setResult(null);
    setSpinning(true);
    try {
      const { data } = await api.post('/mini-games/wheel/spin');
      const idx = Math.max(0, Math.min(active.length - 1, data?.result?.index ?? 0));
      const target = landCenters[idx] || 0;
      // Land the winning slice centre under the top pointer with ≥5 full turns.
      const desired = (360 - (target % 360)) % 360;
      const current = ((rot % 360) + 360) % 360;
      let delta = desired - current;
      if (delta < 0) delta += 360;
      const next = rot + 360 * 5 + delta;
      setRot(next);
      timer.current = setTimeout(async () => {
        const won = Number(data?.won || 0);
        const label = data?.result?.slice?.l || 'Prize';
        setResult({ label, won, free: data?.free });
        if (won > 0) toast(`🎉 You won ${sym}${won.toLocaleString()} — ${label}!`, 'success');
        else toast(`🎡 ${label}`, 'info');
        await refreshProfile();
        loadStatus();
        setSpinning(false);
      }, 4200);
    } catch (e) {
      setSpinning(false);
      const msg = e?.message || 'Spin failed';
      toast('⚠ ' + msg, 'error');
    }
  };

  const size = 320;
  const theme = wheel.theme || {};
  const rimColor = theme.rimColor || '#f4b223';
  const hubColor = theme.hubColor || '#f4b223';
  const pointerColor = theme.pointerColor || '#f4b223';
  const showBulbs = theme.bulbs !== false;
  const BULB_COUNT = 16;
  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => {
    const ang = (i / BULB_COUNT) * 2 * Math.PI;
    const rB = size / 2 - 7;
    return { x: size / 2 + rB * Math.cos(ang), y: size / 2 + rB * Math.sin(ang), on: i % 2 === 0 };
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 16, justifyItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' }}>
        <span style={chip}>🎟️ Free today: <b style={{ color: 'var(--gold)' }}>{freeLeft}</b></span>
        {spinCost > 0 && <span style={chip}>Paid spin: <b style={{ color: 'var(--gold)' }}>{sym}{spinCost.toLocaleString()}</b></span>}
        {isLoggedIn && <span style={chip}>Balance: <b style={{ color: 'var(--gold)' }}>{sym}{Number(profile?.balance || 0).toLocaleString()}</b></span>}
      </div>

      {/* Themed stage — background, title banner, gold light-bulb rim */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: size + 80, borderRadius: 18, overflow: 'hidden',
        padding: '16px 14px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        background: theme.bgImage ? `url(${theme.bgImage}) center/cover no-repeat` : 'radial-gradient(120% 90% at 50% 0%, #3a2a14, #190f04 72%)',
        border: `1px solid ${rimColor}55`, boxShadow: 'inset 0 0 70px rgba(0,0,0,.6)',
      }}>
        {/* title */}
        {theme.titleImage
          ? <img src={theme.titleImage} alt="" style={{ maxWidth: '82%', maxHeight: 70, objectFit: 'contain', display: 'block' }} />
          : <div style={fwTitle}>{theme.title || 'WHEEL OF FORTUNE'}</div>}

        <div style={{ position: 'relative', width: size, height: size, maxWidth: '80vw', aspectRatio: '1 / 1' }}>
          {/* pointer */}
          <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', zIndex: 6,
            width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent',
            borderTop: `24px solid ${pointerColor}`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.6))' }} />
          {/* disc */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            ...(wheelImage
              ? { backgroundImage: `url(${wheelImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: gradient }),
            transform: `rotate(${rot}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(.17,.67,.27,1)' : 'none',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,.45)', position: 'relative',
          }}>
            {/* slice labels — only for the generated colour wheel */}
            {!wheelImage && active.map((s, i) => {
              const a = (centers[i] - 90) * (Math.PI / 180); // -90 → 0deg at top
              const r = size * 0.33;
              const x = size / 2 + r * Math.cos(a);
              const y = size / 2 + r * Math.sin(a);
              return (
                <span key={i} style={{
                  position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${centers[i]}deg)`,
                  fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)',
                  maxWidth: 74, textAlign: 'center', lineHeight: 1.05, pointerEvents: 'none', whiteSpace: 'nowrap',
                }}>{s.l}</span>
              );
            })}
          </div>
          {/* gold rim ring */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none', zIndex: 3,
            boxShadow: `inset 0 0 0 3px rgba(0,0,0,.45), inset 0 0 0 13px ${rimColor}, inset 0 0 0 16px rgba(0,0,0,.4)` }} />
          {/* light bulbs */}
          {showBulbs && bulbs.map((b, i) => (
            <span key={i} style={{ position: 'absolute', left: b.x, top: b.y, transform: 'translate(-50%,-50%)', zIndex: 4,
              width: 7, height: 7, borderRadius: '50%', background: b.on ? '#fff7d6' : '#b98e2c',
              boxShadow: b.on ? '0 0 5px 1px rgba(255,240,180,.9)' : 'inset 0 0 2px rgba(0,0,0,.5)' }} />
          ))}
          {/* hub knob */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5,
            width: 46, height: 46, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #fff2c0, ${hubColor})`,
            border: '3px solid rgba(0,0,0,.35)', boxShadow: '0 2px 8px rgba(0,0,0,.55)' }} />
        </div>
      </div>

      {result && (
        <div style={{ textAlign: 'center', fontWeight: 800, color: result.won > 0 ? 'var(--gold,#f4b223)' : 'var(--text-muted,#8898b8)' }}>
          {result.won > 0 ? `🎉 ${sym}${result.won.toLocaleString()} — ${result.label}` : `🎯 ${result.label}`}
        </div>
      )}

      <button onClick={spin} disabled={spinning}
        style={{
          padding: '13px 40px', borderRadius: 999, border: 'none', cursor: spinning ? 'default' : 'pointer',
          fontWeight: 900, fontSize: 16, color: '#1a1205',
          background: spinning ? '#7a6a32' : 'linear-gradient(180deg,#ffd75e,#f4b223)',
          boxShadow: '0 8px 20px rgba(244,178,35,.4)', minWidth: 200,
        }}>
        {spinning ? 'Spinning…' : isPaid ? `▶ Spin (${sym}${spinCost.toLocaleString()})` : '▶ Spin to Win'}
      </button>
      <div style={{ fontSize: 12, color: 'var(--text-muted,#8898b8)', textAlign: 'center', maxWidth: 360 }}>
        {wheel.freeSpinsPerDay ? `${wheel.freeSpinsPerDay} free spin(s) per day` : 'Paid spins'} ·
        {' '}up to {wheel.maxPerDay || 5} spins/day. Prizes are credited to your wallet instantly.
      </div>
    </div>
  );
}

const parseAmount = (s) => {
  const m = String(s ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};
const RANK_BADGE = ['🥇', '🥈', '🥉'];

function LuckyTicket({ config, onClose }) {
  const { currency, openModal } = useUI();
  const ticket = config?.ticket || {};
  const tiers = ticket.prizeTiers || [];
  const sym = currency?.symbol || '₱';
  const totalWinners = tiers.reduce((a, t) => a + (Number(t.winners) || 0), 0) || ticket.winnersCount || 0;
  const prizePool = tiers.reduce((a, t) => a + parseAmount(t.prize) * (Number(t.winners) || 0), 0);

  const deposit = () => { onClose?.(); openModal('deposit'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero — prize pool + next draw */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '20px 18px',
        background: 'radial-gradient(120% 140% at 0% 0%, rgba(244,178,35,.22), transparent 60%), linear-gradient(135deg,#241a0e,#171c2e)',
        border: '1px solid rgba(244,178,35,.4)', textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', right: -14, top: -10, fontSize: 96, opacity: 0.08, pointerEvents: 'none' }}>🎟️</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold,#f4b223)' }}>
          🎟️ Lucky Ticket Draw
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted,#8898b8)', marginTop: 12, letterSpacing: '.05em', textTransform: 'uppercase' }}>Total Prize Pool</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: 'var(--gold,#f4b223)', lineHeight: 1.1, textShadow: '0 2px 12px rgba(244,178,35,.35)' }}>
          {prizePool > 0 ? `${sym}${prizePool.toLocaleString()}` : '—'}
        </div>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.1)' }}>
          <span style={{ fontSize: 13 }}>🗓️</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted,#8898b8)' }}>Next draw:</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{ticket.drawDate || 'To be announced'}</span>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={ltStat}><div style={ltLbl}>🏆 Total Winners</div><div style={ltVal}>{totalWinners}</div></div>
        <div style={ltStat}><div style={ltLbl}>🎫 Earn a Ticket</div><div style={{ ...ltVal, fontSize: 13, lineHeight: 1.25 }}>{ticket.earnBy || `Every ${sym}100 deposited`}</div></div>
      </div>

      {/* Prize tiers */}
      <div style={{ borderRadius: 14, border: '1px solid var(--border,#243049)', overflow: 'hidden', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ padding: '12px 14px', fontWeight: 800, fontSize: 13, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-muted,#8898b8)', background: 'rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Prize Tiers</span><span>Winners</span>
        </div>
        {tiers.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: '1px solid var(--border,#243049)', background: i < 3 ? 'rgba(244,178,35,.05)' : 'transparent' }}>
            <span style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < 3 ? 16 : 11, fontWeight: 800, color: '#fff',
              background: i < 3 ? 'rgba(244,178,35,.14)' : 'rgba(255,255,255,.05)', border: '1px solid var(--border,#243049)',
            }}>{RANK_BADGE[i] || (i + 1)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', whiteSpace: 'nowrap' }}>{String(t.rank).replace(/^[🥇🥈🥉]\s*/u, '')}</div>
              <div style={{ color: 'var(--gold,#f4b223)', fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap' }}>{t.prize}</div>
            </span>
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--text-muted,#8898b8)', padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border,#243049)' }}>×{t.winners}</span>
          </div>
        ))}
        {!tiers.length && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted,#8898b8)' }}>No active draw right now.</div>}
      </div>

      {/* CTA */}
      <button onClick={deposit} style={{
        width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        fontWeight: 900, fontSize: 15, color: '#1a1205',
        background: 'linear-gradient(180deg,#ffd75e,#f0c040)', boxShadow: '0 8px 20px rgba(240,192,64,.3)',
      }}>💰 Deposit to Earn Tickets</button>

      <div style={{ fontSize: 12, color: 'var(--text-muted,#8898b8)', textAlign: 'center', lineHeight: 1.5 }}>
        Collect Lucky Tickets as you deposit &amp; play. Winners are drawn automatically and credited on draw day.
      </div>
    </div>
  );
}

const chip = { fontSize: 13, color: 'var(--text-muted,#8898b8)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border,#243049)', borderRadius: 999, padding: '5px 12px' };
const fwTitle = { fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 26, lineHeight: 1.05, textAlign: 'center', color: '#ffd75e', textShadow: '0 2px 0 #a8730a, 0 4px 8px rgba(0,0,0,.6)', letterSpacing: '.04em' };
const ltStat = { background: 'rgba(255,255,255,.04)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: '11px 13px' };
const ltLbl = { fontSize: 11, color: 'var(--text-muted,#8898b8)', textTransform: 'uppercase', letterSpacing: '.04em' };
const ltVal = { fontWeight: 800, marginTop: 4, color: '#fff' };

export default function MiniGamesModal() {
  const { activeModal, closeModal } = useUI();
  const open = activeModal === 'fortune';
  const [tab, setTab] = useState('wheel');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/mini-games')
      .then((r) => setConfig(r.data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const wheelOn = config?.wheel?.enabled !== false;
  const ticketOn = config?.ticket?.enabled !== false;

  return (
    <Modal id="fortune-modal" open={open} onClose={closeModal} maxWidth="640px">
      <div className="modal-header">
        <span className="modal-title">🎡 Mini Games</span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 18px', marginTop: 6 }}>
        {wheelOn && <TabBtn active={tab === 'wheel'} onClick={() => setTab('wheel')}>🎡 Fortune Wheel</TabBtn>}
        {ticketOn && <TabBtn active={tab === 'ticket'} onClick={() => setTab('ticket')}>🎟️ Lucky Ticket</TabBtn>}
      </div>
      <div className="modal-body" style={{ paddingTop: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : !config ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Mini games are unavailable right now.</div>
        ) : tab === 'ticket' && ticketOn ? (
          <LuckyTicket config={config} onClose={closeModal} />
        ) : wheelOn ? (
          <FortuneWheel config={config} onClose={closeModal} />
        ) : (
          <LuckyTicket config={config} onClose={closeModal} />
        )}
      </div>
    </Modal>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 999, cursor: 'pointer', fontWeight: 800, fontSize: 14,
      border: '1px solid ' + (active ? 'var(--gold,#f4b223)' : 'var(--border,#243049)'),
      background: active ? 'rgba(244,178,35,.16)' : 'transparent',
      color: active ? 'var(--gold,#f4b223)' : 'var(--text,#fff)',
    }}>{children}</button>
  );
}
