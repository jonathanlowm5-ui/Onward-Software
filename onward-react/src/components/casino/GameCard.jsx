import { useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { launchGame as resolveLaunch } from '../../services/gamesService';
import useFavorites from '../../hooks/useFavorites';

const BADGE_LABEL = { hot: '🔥 Hot', new: '✨ New', jackpot: '💎 Jackpot' };

/**
 * Single game tile — mirrors the original renderGameCard() markup exactly so
 * the styling/animation is identical.
 */
export default function GameCard({ game }) {
  const g = game;
  const [imgFailed, setImgFailed] = useState(false);
  const { openModal } = useUI();
  const { isLoggedIn } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const favId = g.id != null ? g.id : g.name;
  const fav = isFavorite(favId);

  const launch = async () => {
    if (!isLoggedIn) { openModal('register'); return; }
    const url = g.id != null ? await resolveLaunch(g.id) : g.launchUrl;
    if (url) window.open(url, '_blank', 'noopener');
    else openModal('game', { name: g.name, icon: g.icon });
  };

  return (
    <div className="game-card" onClick={launch}>
      {g.img && !imgFailed ? (
        <img src={g.img} alt="" loading="lazy" decoding="async" onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} />
      ) : (
        <div className="game-img" style={{ background: `linear-gradient(135deg,${(g.color || '#1a1a2e')}22,${(g.color || '#1a1a2e')}11)` }}>
          <span style={{ fontSize: '52px' }}>{g.icon || '🎰'}</span>
        </div>
      )}
      <div className="game-overlay">
        <div className="game-provider">{g.provider}</div>
        <div className="game-name">{g.name}</div>
      </div>
      {g.badge && <span className={`game-badge badge-${g.badge}`}>{BADGE_LABEL[g.badge] || g.badge}</span>}
      <button
        type="button"
        className={`game-fav${fav ? ' on' : ''}`}
        title={fav ? 'Remove from favourites' : 'Add to favourites'}
        aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
        onClick={(e) => { e.stopPropagation(); toggle(favId); }}
      >
        {fav ? '♥' : '♡'}
      </button>
      <div className="game-play-btn"><div className="play-circle">▶</div></div>
    </div>
  );
}
