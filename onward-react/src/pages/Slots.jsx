import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import GameCard from '../components/casino/GameCard.jsx';
import useFavorites from '../hooks/useFavorites';
import useGames from '../hooks/useGames';
import { ALL_SLOTS, GAMES, ALL_GAME_ICONS, LIVE_GAMES, PROVIDERS, PROVIDER_LOGOS, POPULAR_GAMES } from '../services/data/gameData';
import HB_LOGOS from '../services/data/heibaoLogos.json';
import svgAll from '../assets/sidebar/svg/all.svg';

// Every bundled game, so the "favorite" view can resolve a favourited id even if
// it isn't a slot (live, table, etc.).
const ALL_KNOWN = [...ALL_GAME_ICONS, ...GAMES, ...LIVE_GAMES];

const PER_PAGE = 30;

// Keyword-backed categories so sidebar links resolve to real games (matched by
// game name / provider) instead of an empty filter.
const CAT_KEYWORDS = {
  jackpot: /jackpot/i,
  bingo: /bingo/i,
  mahjong: /mahjong/i,
  megaways: /megaways/i,
  cards: /poker|blackjack|baccarat|\bcards?\b|hold ?'?em|teen ?patti|rummy/i,
  fishing: /fish/i,
};

// Section titles per category.
const CAT_TITLE = {
  popular: '🔥 Popular Games',
  new: '🆕 New Games',
  crash: '⚡ Instant Games',
  roulette: '🎡 Roulette',
  table: '🎲 Table Games',
  jackpot: '💎 Jackpot Games',
  bingo: '🎱 Bingo',
  mahjong: '🀄 Mahjong',
  megaways: '🎇 Megaways',
  cards: '🃏 Card Games',
  fishing: '🐟 Fishing Games',
};

// Provider scroller buttons — built from the live catalogue when loaded (all
// providers, sorted by game count) with bundled logos where the names match.
const STATIC_PROVIDER_LIST = [
  { name: 'All', key: 'all', label: 'All', logo: svgAll },
  ...PROVIDERS.map((p) => ({ name: p.name, key: p.key, label: p.name, logo: p.logo })),
];
function buildProviderList(games) {
  if (!games || !games.length) return STATIC_PROVIDER_LIST;
  const counts = {};
  games.forEach((g) => { if (g.provider) counts[g.provider] = (counts[g.provider] || 0) + 1; });
  const logoFor = (name) => HB_LOGOS[name] || PROVIDERS.find((p) => p.name.toLowerCase() === name.toLowerCase())?.logo || null;
  return [
    { name: 'All', key: 'all', label: 'All', logo: svgAll },
    ...Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([name]) => ({ name, key: name, label: name, logo: logoFor(name) })),
  ];
}

export default function Slots() {
  const { searchQuery } = useUI();
  const [params] = useSearchParams();
  const catParam = params.get('cat');
  const isFavView = catParam === 'favorite';
  const { favorites } = useFavorites();
  const { games: liveGames } = useGames(); // same source as the lobby/cards
  const [provider, setProvider] = useState('all');
  const [page, setPage] = useState(1);
  const trackRef = useRef(null);

  useEffect(() => { setPage(1); }, [provider, searchQuery, catParam]);

  // id → game lookup spanning the LIVE catalogue (what the cards actually came
  // from) plus every bundled game, so a favourited id always resolves.
  const catalog = useMemo(() => {
    const m = new Map();
    [...(liveGames || []), ...ALL_KNOWN].forEach((g) => {
      const key = String(g.id != null ? g.id : g.name);
      if (!m.has(key)) m.set(key, g);
    });
    return m;
  }, [liveGames]);

  // Live catalogue is the primary source (thousands of admin-managed games
  // with real icons); the bundled showcase is only the offline fallback.
  const baseList = (liveGames && liveGames.length) ? liveGames : ALL_SLOTS;

  const filtered = useMemo(() => {
    // Favourites view: resolve the saved ids against the full catalogue.
    let list;
    if (isFavView) {
      list = favorites.map((fid) => catalog.get(String(fid))).filter(Boolean);
    } else if (catParam === 'new') {
      // "New" = freshly-added games (badge=new), topped up with the newest games.
      const flagged = baseList.filter((g) => g.badge === 'new');
      const seen = new Set(flagged.map((g) => g.id));
      list = [...flagged, ...baseList.slice(0, 48).filter((g) => !seen.has(g.id))];
    } else if (catParam === 'popular') {
      list = (liveGames && liveGames.length) ? liveGames.slice(0, 60) : POPULAR_GAMES;
    } else if (catParam === 'roulette') {
      list = baseList.filter((g) => /roulette/i.test(g.name) || /roulette/i.test(g.provider || ''));
    } else if (catParam && CAT_KEYWORDS[catParam]) {
      const re = CAT_KEYWORDS[catParam];
      list = baseList.filter((g) => re.test(g.name) || re.test(g.provider || '')
        || (catParam === 'jackpot' && g.badge === 'jackpot'));
    } else if (catParam) {
      list = baseList.filter((g) => g.cat === catParam);
    } else {
      list = baseList;
    }
    if (provider !== 'all') list = list.filter((g) => g.provider === provider);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q) || (g.provider || '').toLowerCase().includes(q));
    }
    return list;
  }, [provider, searchQuery, catParam, isFavView, favorites, catalog, baseList, liveGames]);

  const visible = filtered.slice(0, page * PER_PAGE);
  const scrollProviders = (dir) => trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  return (
    <div id="view-slots">
      <div className="section">
        <div className="section-header">
          {isFavView
            ? <h2 className="section-title" data-i18n="sec_favorites">❤️ My Favourites</h2>
            : catParam && CAT_TITLE[catParam] ? <h2 className="section-title">{CAT_TITLE[catParam]}</h2>
            : <h2 className="section-title" data-i18n="sec_all_slots">🎲 All Slot Games</h2>}
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }} id="slot-count">{filtered.length} Games</span>
        </div>

        {/* PROVIDER CARD SCROLLER (hidden in the favourites view) */}
        {!isFavView && (
        <div style={{ position: 'relative', marginBottom: '22px', padding: '0 18px' }}>
          <button onClick={() => scrollProviders(-1)} style={arrowStyle('left')}>‹</button>
          <div ref={trackRef} style={{ overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ display: 'flex', gap: '10px', padding: '4px 2px', width: 'max-content' }}>
              {buildProviderList(liveGames).map((p) => {
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

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '80px 20px', lineHeight: 1.6 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>{isFavView ? '🤍' : '🎰'}</div>
            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16, marginBottom: 6 }}>
              {isFavView ? 'No favourites yet' : 'No games here yet'}
            </div>
            <div>{isFavView ? 'Tap the heart on any game to add it here.' : 'Check back soon — new games are added regularly.'}</div>
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
