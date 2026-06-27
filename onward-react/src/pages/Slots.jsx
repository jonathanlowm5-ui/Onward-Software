import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import GameCard from '../components/casino/GameCard.jsx';
import useFavorites from '../hooks/useFavorites';
import { ALL_SLOTS, GAMES, ALL_GAME_ICONS, PROVIDERS, PROVIDER_LOGOS } from '../services/data/gameData';

// Every known game, so the "favorite" view can resolve a favourited id even if
// it isn't a slot (live, table, etc.).
const ALL_KNOWN = [...ALL_GAME_ICONS, ...GAMES];

const PER_PAGE = 30;

// Provider scroller buttons matching the original provider-filter-btns.
const PROVIDER_LIST = [
  { name: 'All', key: 'all', label: 'All', logo: null },
  ...PROVIDERS.map((p) => ({ name: p.name, key: p.key, label: p.name, logo: p.logo })),
];

export default function Slots() {
  const { searchQuery } = useUI();
  const [params] = useSearchParams();
  const catParam = params.get('cat');
  const isFavView = catParam === 'favorite';
  const { favorites } = useFavorites();
  const [provider, setProvider] = useState('all');
  const [page, setPage] = useState(1);
  const trackRef = useRef(null);

  useEffect(() => { setPage(1); }, [provider, searchQuery, catParam]);

  const filtered = useMemo(() => {
    // Favourites view: resolve the saved ids against the full catalogue.
    let list = isFavView
      ? favorites.map((fid) => ALL_KNOWN.find((g) => String(g.id) === fid || g.name === fid)).filter(Boolean)
      : ALL_SLOTS;
    if (catParam && !isFavView) list = list.filter((g) => g.cat === catParam);
    if (provider !== 'all') list = list.filter((g) => g.provider === provider);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q) || (g.provider || '').toLowerCase().includes(q));
    }
    return list;
  }, [provider, searchQuery, catParam, isFavView, favorites]);

  const visible = filtered.slice(0, page * PER_PAGE);
  const scrollProviders = (dir) => trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <div id="view-slots">
      <div className="section">
        <div className="section-header">
          {isFavView
            ? <h2 className="section-title" data-i18n="sec_favorites">❤️ My Favourites</h2>
            : <h2 className="section-title" data-i18n="sec_all_slots">🎲 All Slot Games</h2>}
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }} id="slot-count">{filtered.length} Games</span>
        </div>

        {/* PROVIDER CARD SCROLLER (hidden in the favourites view) */}
        {!isFavView && (
        <div style={{ position: 'relative', marginBottom: '22px', padding: '0 18px' }}>
          <button onClick={() => scrollProviders(-1)} style={arrowStyle('left')}>‹</button>
          <div ref={trackRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ display: 'flex', gap: '10px', padding: '4px 2px', width: 'max-content' }}>
              {PROVIDER_LIST.map((p) => {
                const active = provider === (p.name === 'All' ? 'all' : p.name);
                return (
                  <button key={p.key} className={`prov-card${active ? ' active' : ''}`} onClick={() => setProvider(p.name === 'All' ? 'all' : p.name)}
                    style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', minWidth: '88px', background: 'var(--surface)', border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                    {p.logo
                      ? <img src={p.logo} alt={p.label} style={{ width: '52px', height: '36px', objectFit: 'contain', marginBottom: '6px', display: 'block' }} />
                      : <span style={{ fontSize: '22px', display: 'block', marginBottom: '6px' }}>🎰</span>}
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: active ? 'var(--gold)' : 'rgba(255,255,255,.6)' }}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={() => scrollProviders(1)} style={arrowStyle('right')}>›</button>
        </div>
        )}

        {isFavView && filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 20px', lineHeight: 1.6 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🤍</div>
            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, marginBottom: 6 }}>No favourites yet</div>
            <div>Tap the heart on any game to add it here.</div>
          </div>
        ) : (
        <div className="game-grid" id="slots-grid">
          {visible.map((g, i) => <GameCard key={g.id ?? i} game={g} />)}
        </div>
        )}

        {visible.length < filtered.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <button onClick={() => setPage((p) => p + 1)} style={{ padding: '12px 40px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '100px', color: 'var(--text)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.03em' }}>
              Load More Games
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function arrowStyle(side) {
  return {
    position: 'absolute', [side]: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
    width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,.5)',
  };
}
