import { useEffect, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { PROVIDER_LOGOS } from '../../services/data/gameData';
import { makeDisplayMoney } from '../../utils/displayMoney';

// The four live-jackpot cards. The amounts tick up like the original
// startJackpotTicker() did.
const CARDS = [
  { prov: 'pp', name: 'Pragmatic Play', base: 12847322, winners: '247 winners', color: '#f0c040', color2: '#fde98a', glow: 'rgba(240,192,64,.15)', pct: '82%' },
  { prov: 'pg', name: 'PG Soft', base: 3241500, winners: '89 winners', color: '#e8293a', color2: '#ff6b6b', glow: 'rgba(232,41,58,.15)', pct: '65%' },
  { prov: 'jili', name: 'Jili', base: 987650, winners: '412 winners', color: '#38bdf8', color2: '#7dd3fc', glow: 'rgba(56,189,248,.15)', pct: '48%' },
  { prov: 'evo', name: 'Evolution Gaming', base: 456200, winners: '63 winners', color: '#a855f7', color2: '#d8b4fe', glow: 'rgba(168,85,247,.15)', pct: '31%' },
];

export default function LiveJackpots() {
  const { openModal, currency, fxConvert } = useUI();
  const money = makeDisplayMoney(currency, fxConvert);
  const [amounts, setAmounts] = useState(CARDS.map((c) => c.base));

  useEffect(() => {
    const t = setInterval(() => {
      setAmounts((prev) => prev.map((a) => a + Math.floor(Math.random() * 50) + 1));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="jackpots-section">
      <div className="jackpots-header">
        <div className="jackpots-title" data-i18n="sec_live_jackpots">Live Jackpots</div>
        <div className="jackpots-live-dot" data-i18n="misc_live_badge">Live</div>
      </div>
      <div className="jackpots-grid">
        {CARDS.map((c, i) => (
          <div className="jp-card" key={c.prov} onClick={() => openModal('register')}
            style={{ '--jp-color': c.color, '--jp-color2': c.color2, '--jp-glow': c.glow, '--jp-pct': c.pct }}>
            {PROVIDER_LOGOS[c.prov]
              ? <img className="jp-icon" src={PROVIDER_LOGOS[c.prov]} alt={c.name} style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '10px', display: 'block', borderRadius: '6px' }} />
              : <span className="jp-icon">🎰</span>}
            <div className="jp-game">{c.name}</div>
            <div className="jp-amount">{money(amounts[i], { decimals: 0 })}</div>
            <div className="jp-bar-wrap"><div className="jp-bar"></div></div>
            <div className="jp-meta">
              <span className="jp-provider" data-i18n="jp_pool">Total Jackpot Pool</span>
              <span className="jp-winners">{c.winners}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
