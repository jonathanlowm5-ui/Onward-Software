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

// Build the conic-gradient + per-slice centre angles for the active slices.
function wheelGeometry(active) {
  const total = active.reduce((a, s) => a + (s.w > 0 ? s.w : 0), 0) || active.length;
  let acc = 0;
  const stops = [];
  const centers = [];
  active.forEach((s) => {
    const w = s.w > 0 ? s.w : (total / active.length);
    const start = (acc / total) * 360;
    acc += w;
    const end = (acc / total) * 360;
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
      const target = centers[idx] || 0;
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 18, justifyItems: 'center' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' }}>
        <span style={chip}>🎟️ Free today: <b style={{ color: 'var(--gold)' }}>{freeLeft}</b></span>
        {spinCost > 0 && <span style={chip}>Paid spin: <b style={{ color: 'var(--gold)' }}>{sym}{spinCost.toLocaleString()}</b></span>}
        {isLoggedIn && <span style={chip}>Balance: <b style={{ color: 'var(--gold)' }}>{sym}{Number(profile?.balance || 0).toLocaleString()}</b></span>}
      </div>

      <div style={{ position: 'relative', width: size, height: size, maxWidth: '86vw' }}>
        {/* pointer */}
        <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 3,
          width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
          borderTop: '26px solid var(--gold,#f4b223)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.5))' }} />
        {/* disc */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%', background: gradient,
          transform: `rotate(${rot}deg)`,
          transition: spinning ? 'transform 4s cubic-bezier(.17,.67,.27,1)' : 'none',
          boxShadow: '0 0 0 8px rgba(244,178,35,.85), 0 0 0 12px rgba(0,0,0,.35), 0 14px 40px rgba(0,0,0,.5)',
          position: 'relative',
        }}>
          {/* slice labels */}
          {active.map((s, i) => {
            const a = (centers[i] - 90) * (Math.PI / 180); // -90 → 0deg at top
            const r = size * 0.34;
            const x = size / 2 + r * Math.cos(a);
            const y = size / 2 + r * Math.sin(a);
            return (
              <span key={i} style={{
                position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)',
                fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)',
                maxWidth: 76, textAlign: 'center', lineHeight: 1.05, pointerEvents: 'none',
              }}>{s.l}</span>
            );
          })}
        </div>
        {/* hub */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2,
          width: 54, height: 54, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #2a3350, #121a2c)',
          border: '3px solid var(--gold,#f4b223)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎡</div>
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

function LuckyTicket({ config }) {
  const { currency } = useUI();
  const ticket = config?.ticket || {};
  const tiers = ticket.prizeTiers || [];
  const sym = currency?.symbol || '₱';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
        <div style={infoCard}><div style={infoLbl}>Next Draw</div><div style={infoVal}>{ticket.drawDate || 'To be announced'}</div></div>
        <div style={infoCard}><div style={infoLbl}>Winners</div><div style={infoVal}>{ticket.winnersCount || 0}</div></div>
        <div style={infoCard}><div style={infoLbl}>Earn a Ticket</div><div style={{ ...infoVal, fontSize: 13 }}>{ticket.earnBy || `Every ${sym}100 deposited`}</div></div>
      </div>
      <div style={{ borderRadius: 12, border: '1px solid var(--border,#243049)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', fontWeight: 800, background: 'rgba(255,255,255,.04)' }}>🏆 Prize Tiers</div>
        {tiers.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: '1px solid var(--border,#243049)' }}>
            <span style={{ fontWeight: 800, minWidth: 80 }}>{t.rank}</span>
            <span style={{ color: 'var(--gold,#f4b223)', fontWeight: 900, flex: 1 }}>{t.prize}</span>
            <span style={{ color: 'var(--text-muted,#8898b8)', fontSize: 13 }}>{t.winners} winner{t.winners === 1 ? '' : 's'}</span>
          </div>
        ))}
        {!tiers.length && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted,#8898b8)' }}>No active draw right now.</div>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted,#8898b8)', textAlign: 'center' }}>
        Deposit & play to collect Lucky Tickets — winners are drawn automatically and credited on draw day.
      </div>
    </div>
  );
}

const chip = { fontSize: 13, color: 'var(--text-muted,#8898b8)', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border,#243049)', borderRadius: 999, padding: '5px 12px' };
const infoCard = { background: 'rgba(255,255,255,.04)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: '12px 14px' };
const infoLbl = { fontSize: 12, color: 'var(--text-muted,#8898b8)' };
const infoVal = { fontWeight: 800, marginTop: 3 };

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
          <LuckyTicket config={config} />
        ) : wheelOn ? (
          <FortuneWheel config={config} onClose={closeModal} />
        ) : (
          <LuckyTicket config={config} />
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
