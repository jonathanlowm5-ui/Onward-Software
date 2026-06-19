import { useMemo, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import GameCard from '../components/casino/GameCard.jsx';
import { ALL_GAME_ICONS, GAMES } from '../services/data/gameData';

// Build the fish catalogue exactly like the original initFishSection().
const ALL_FISH = (() => {
  const merged = [
    ...ALL_GAME_ICONS.filter((g) => /fish|fishing|crab|prawn|ocean\s*king/i.test(g.name)),
    ...GAMES.filter((g) => g.cat === 'fish'),
  ];
  const seen = new Set();
  return merged.filter((g) => (seen.has(g.name) ? false : (seen.add(g.name), true)));
})();

export default function Fish() {
  const { searchQuery } = useUI();
  const [provider, setProvider] = useState('All');
  const trackRef = useRef(null);

  const providers = useMemo(
    () => ['All', ...new Set(ALL_FISH.map((g) => g.provider).filter(Boolean))].sort((a, b) => (a === 'All' ? -1 : a.localeCompare(b))),
    []
  );

  const filtered = useMemo(() => {
    let list = provider === 'All' ? ALL_FISH : ALL_FISH.filter((g) => g.provider === provider);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    }
    return list;
  }, [provider, searchQuery]);

  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 250, behavior: 'smooth' });

  return (
    <div id="view-fish">
      <div className="section">
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h2 className="section-title">🐟 Fish Games</h2>
          <div className="hero-badge" style={{ fontSize: '11px' }}>{filtered.length} Games</div>
        </div>
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <button onClick={() => scroll(-1)} style={fishArrow('left')}>‹</button>
          <div ref={trackRef} style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollBehavior: 'smooth', padding: '4px 34px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {providers.map((p) => {
              const active = provider === p;
              return (
                <button key={p} className={`prov-card${active ? ' active' : ''}`} onClick={() => setProvider(p)}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 14px', minWidth: '80px', background: 'var(--surface)', border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '18px', marginBottom: '4px' }}>{p === 'All' ? '🎣' : '🎮'}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: active ? 'var(--gold)' : '#888', letterSpacing: '.5px', textTransform: 'uppercase' }}>{p === 'All' ? 'ALL' : p.replace(' Gaming', '').replace(' Play', '')}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => scroll(1)} style={fishArrow('right')}>›</button>
        </div>
        <div className="game-grid" id="fish-grid">
          {filtered.map((g, i) => <GameCard key={g.id ?? i} game={g} />)}
        </div>
      </div>
    </div>
  );
}

function fishArrow(side) {
  return { position: 'absolute', [side]: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'rgba(10,10,24,.85)', border: '1px solid var(--border)', color: '#aaa', borderRadius: '8px', width: '28px', height: '36px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 };
}
