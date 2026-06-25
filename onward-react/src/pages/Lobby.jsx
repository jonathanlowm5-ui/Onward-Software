import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import useGames from '../hooks/useGames';
import { fetchPromotions } from '../services/gamesService';
import GameCard from '../components/casino/GameCard.jsx';
import LiveCard from '../components/casino/LiveCard.jsx';
import TopMatchCard from '../components/casino/TopMatchCard.jsx';
import PromoCard from '../components/promotions/PromoCard.jsx';
import BannerCarousel from '../components/promotions/BannerCarousel.jsx';
import BigWinsStrip from '../components/casino/BigWinsStrip.jsx';
import LiveJackpots from '../components/casino/LiveJackpots.jsx';
import {
  POPULAR_GAMES, LIVE_GAMES, PROMOS, PROVIDERS, TOP_MATCHES,
} from '../services/data/gameData';

const CATS = [
  { key: 'all', label: '🎰 All Games' },
  { key: 'slots', label: '🎲 Slots', i18n: 'cat_slots' },
  { key: 'table', label: '🃏 Table Games', i18n: 'cat_table' },
  { key: 'live', label: '📡 Live' },
  { key: 'fish', label: '🐟 Fishing', i18n: 'cat_fish' },
  { key: 'crash', label: '🚀 Crash', i18n: 'cat_crash' },
];

export default function Lobby() {
  const { openModal, searchQuery } = useUI();
  const navigate = useNavigate();
  const { games } = useGames();
  const [cat, setCat] = useState('all');
  const [promos, setPromos] = useState(PROMOS);
  const tmRef = useRef(null);

  // Promotions come live from the backend (admin-managed); fall back to bundled.
  useEffect(() => {
    let alive = true;
    fetchPromotions().then((p) => { if (alive && p?.length) setPromos(p); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Popular grid: use bundled popular games, filtered by category + global search.
  const popular = useMemo(() => {
    const source = games.length ? games : POPULAR_GAMES;
    let list = cat === 'all' ? source : source.filter((g) => g.cat === cat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((g) => g.name.toLowerCase().includes(q) || (g.provider || '').toLowerCase().includes(q));
    }
    return list.slice(0, 21);
  }, [games, cat, searchQuery]);

  const tmScroll = (dir) => tmRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  return (
    <div id="view-lobby">
      {/* HERO BANNER — admin-uploaded promo banners (one image fits every page) */}
      <div className="section" style={{ paddingTop: 20, paddingBottom: 0 }}>
        <BannerCarousel promos={promos} />
      </div>

      {/* BIG WINS STRIP */}
      <BigWinsStrip />

      {/* LIVE JACKPOTS */}
      <LiveJackpots />

      {/* POPULAR GAMES */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_popular">🔥 Popular Games</h2>
          <button className="see-all" onClick={() => navigate('/slots')} data-i18n="ui_see_all">See All</button>
        </div>
        <div className="cats" id="cat-buttons">
          {CATS.map((c) => (
            <button key={c.key} className={`cat-btn${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)} data-i18n={c.i18n}>{c.label}</button>
          ))}
        </div>
        <div className="game-grid" id="game-grid">
          {popular.map((g, i) => <GameCard key={g.id ?? i} game={g} />)}
        </div>
      </div>

      {/* LIVE CASINO PREVIEW */}
      <div className="section" style={{ background: 'linear-gradient(180deg,transparent,rgba(26,40,64,.4),transparent)', padding: '60px 24px' }}>
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_live_casino">📡 Live Casino</h2>
          <button className="see-all" data-i18n="ui_see_all" onClick={() => navigate('/live')}>See All</button>
        </div>
        <div className="live-grid" id="live-grid">
          {LIVE_GAMES.slice(0, 3).map((l, i) => <LiveCard key={i} live={l} />)}
        </div>
      </div>

      {/* TOP MATCHES */}
      <div className="section tm-section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_top_matches_h">⚽ Top Matches</h2>
          <div className="tm-nav">
            <button className="tm-nav-btn" onClick={() => tmScroll(-1)}>‹</button>
            <button className="tm-nav-btn" onClick={() => tmScroll(1)}>›</button>
          </div>
        </div>
        <div className="tm-carousel-wrap">
          <div className="tm-carousel" id="lobby-sports" ref={tmRef}>
            {TOP_MATCHES.map((m, i) => <TopMatchCard key={i} match={m} />)}
          </div>
        </div>
        <div className="tm-footer">
          <button className="tm-view-all-btn" onClick={() => navigate('/sports')} data-i18n="tm_view_all">🏆 View All Matches →</button>
        </div>
      </div>

      {/* HOT PROMOTIONS */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_hot_promos">🎁 Hot Promotions</h2>
          <button className="see-all" onClick={() => navigate('/promotions')} data-i18n="ui_see_all">See All</button>
        </div>
        <div className="promo-grid" id="promo-grid-home">
          {promos.slice(0, 8).map((p, i) => <PromoCard key={p.id ?? i} promo={p} index={i} onOpen={() => navigate('/promotions')} />)}
        </div>
      </div>

      {/* PROVIDERS */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_providers">🤝 Game Providers</h2>
        </div>
        <div className="providers-ticker-wrap">
          <div className="providers-ticker" id="providers-grid">
            {[...PROVIDERS, ...PROVIDERS].map((p, i) => (
              <div className="provider-card" key={i}>
                <div className="provider-logo"><img src={p.logo} alt={p.name} style={{ width: '80%', maxHeight: '38px', objectFit: 'contain' }} /></div>
                <div className="provider-name">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
