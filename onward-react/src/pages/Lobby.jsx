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
  POPULAR_GAMES, LIVE_GAMES, PROMOS, PROVIDERS, TOP_MATCHES, PROVIDER_LOGOS,
} from '../services/data/gameData';
import { makeDisplayMoney } from '../utils/displayMoney';
import api from '../services/api';

// ---- Live variants of the showcase strips (rendered when /public/stats has
// real data; the original showcase components stay as the fallback). ----

const BW_COLORS = ['#7c3aed', '#0ea5e9', '#f0c040', '#e8293a', '#22c55e', '#f97316'];

// Big Wins marquee fed by real recent wins (same markup as BigWinsStrip).
function LiveBigWinsStrip({ wins }) {
  const { openModal, currency, fxConvert } = useUI();
  const money = makeDisplayMoney(currency, fxConvert);
  const items = wins.map((w, i) => ({
    n: w.game || 'Game', user: w.player || 'pla***', mult: w.provider || '',
    prize: Number(w.win) || 0, cur: w.currency || 'PHP',
    c: BW_COLORS[i % BW_COLORS.length], i: '🎰',
  }));
  const loop = [...items, ...items];
  return (
    <div className="bw-strip">
      <div className="bw-strip-header" data-i18n="sec_big_wins">Big Wins</div>
      <div className="bw-track" id="bw-track">
        {loop.map((w, i) => (
          <div className="bw-card" key={i} onClick={() => openModal('register')}>
            <div className="bw-thumb" style={{ background: w.c }}>{w.i}</div>
            <div className="bw-info">
              <div className="bw-name">{w.n}</div>
              <div className="bw-meta">
                <span>{w.user}</span>
                <span className="bw-mult">{w.mult}</span>
              </div>
              <div className="bw-prize">{money(w.prize, { base: w.cur })}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Live Jackpots cards scaled from the real jackpot pool (same markup/design as
// LiveJackpots; amounts still tick up like the original startJackpotTicker()).
const JP_CARDS = [
  { prov: 'pp', name: 'Pragmatic Play', share: 1, wShare: 1, color: '#f0c040', color2: '#fde98a', glow: 'rgba(240,192,64,.15)', pct: '82%' },
  { prov: 'pg', name: 'PG Soft', share: 0.32, wShare: 0.6, color: '#e8293a', color2: '#ff6b6b', glow: 'rgba(232,41,58,.15)', pct: '65%' },
  { prov: 'jili', name: 'Jili', share: 0.08, wShare: 0.3, color: '#38bdf8', color2: '#7dd3fc', glow: 'rgba(56,189,248,.15)', pct: '48%' },
  { prov: 'evo', name: 'Evolution Gaming', share: 0.025, wShare: 0.15, color: '#a855f7', color2: '#d8b4fe', glow: 'rgba(168,85,247,.15)', pct: '31%' },
];
const JP_FALLBACK_WINNERS = ['247 winners', '89 winners', '412 winners', '63 winners'];

function LiveJackpotsReal({ pool, winnersToday }) {
  const { openModal, currency, fxConvert } = useUI();
  const money = makeDisplayMoney(currency, fxConvert);
  const [amounts, setAmounts] = useState(JP_CARDS.map((c) => Math.round(pool * c.share)));

  useEffect(() => {
    setAmounts(JP_CARDS.map((c) => Math.round(pool * c.share)));
    const t = setInterval(() => {
      setAmounts((prev) => prev.map((a) => a + Math.floor(Math.random() * 50) + 1));
    }, 2000);
    return () => clearInterval(t);
  }, [pool]);

  return (
    <div className="jackpots-section">
      <div className="jackpots-header">
        <div className="jackpots-title" data-i18n="sec_live_jackpots">Live Jackpots</div>
        <div className="jackpots-live-dot" data-i18n="misc_live_badge">Live</div>
      </div>
      <div className="jackpots-grid">
        {JP_CARDS.map((c, i) => (
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
              <span className="jp-winners">
                {winnersToday > 0
                  ? `${Math.max(1, Math.round(winnersToday * c.wShare))} winners`
                  : JP_FALLBACK_WINNERS[i]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icon kept separate from the translatable label so switching language never
// wipes the emoji (and the icon can render as a muted glyph until active).
const CATS = [
  { key: 'all', icon: '🎰', label: 'All Games' },
  { key: 'slots', icon: '🎲', label: 'Slots', i18n: 'cat_slots' },
  { key: 'table', icon: '🃏', label: 'Table Games', i18n: 'cat_table' },
  { key: 'live', icon: '📡', label: 'Live' },
  { key: 'fish', icon: '🐟', label: 'Fishing', i18n: 'cat_fish' },
  { key: 'crash', icon: '🚀', label: 'Crash', i18n: 'cat_crash' },
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

  // Public stats: real big wins + jackpot pool feed the two live strips below
  // (the bundled showcase components stay in place until real data arrives).
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/public/stats').then((r) => { if (alive && r.data) setStats(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const realWins = Array.isArray(stats?.bigWins) ? stats.bigWins : [];
  const realPool = Number(stats?.jackpotPool) || 0;

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
  const promoRef = useRef(null);
  const promoScroll = (dir) => promoRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });

  return (
    <div id="view-lobby">
      {/* HERO BANNER — admin-uploaded promo banners (one image fits every page) */}
      <div className="section" style={{ paddingTop: 20, paddingBottom: 0 }}>
        <BannerCarousel promos={promos} />
      </div>

      {/* BIG WINS STRIP */}
      {realWins.length ? <LiveBigWinsStrip wins={realWins} /> : <BigWinsStrip />}

      {/* LIVE JACKPOTS */}
      {realPool > 0
        ? <LiveJackpotsReal pool={realPool} winnersToday={Number(stats?.winnersToday) || 0} />
        : <LiveJackpots />}

      {/* POPULAR GAMES */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_popular">🔥 Popular Games</h2>
          <button className="see-all" onClick={() => navigate('/slots')} data-i18n="ui_see_all">See All</button>
        </div>
        <div className="cats" id="cat-buttons">
          {CATS.map((c) => (
            <button key={c.key} className={`cat-btn${cat === c.key ? ' active' : ''}`} onClick={() => setCat(c.key)}>
              <span className="cat-btn-ico" aria-hidden="true">{c.icon}</span>
              <span {...(c.i18n ? { 'data-i18n': c.i18n } : {})}>{c.label}</span>
            </button>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="tm-nav-btn" onClick={() => promoScroll(-1)} aria-label="Previous">‹</button>
            <button className="tm-nav-btn" onClick={() => promoScroll(1)} aria-label="Next">›</button>
            <button className="see-all" onClick={() => navigate('/promotions')} data-i18n="ui_see_all">See All</button>
          </div>
        </div>
        <div className="promo-grid" id="promo-grid-home" ref={promoRef}>
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
