import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import useSectionNav from '../hooks/useSectionNav';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';
import { JP_WINNINGS, JP_FAV_GAMES } from '../services/data/gameData';
// Uploaded jackpot tier badges (replace the medal/crown emoji on each card).
import jpImperial from '../assets/jackpot/jackpot-imperial.avif';
import jpGolden from '../assets/jackpot/jackpot-golden.avif';
import jpSilver from '../assets/jackpot/jackpot-silver.avif';
import jpBronze from '../assets/jackpot/jackpot-bronze.avif';

const TIER_ICONS = { Bronze: jpBronze, Silver: jpSilver, Golden: jpGolden, Imperial: jpImperial };

function formatJPAmount(v) {
  if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(2) + 'K';
  return v.toFixed(2);
}

function formatMega(v) {
  const s = v.toFixed(2);
  const [int, dec] = s.split('.');
  return Number(int).toLocaleString('en').replace(/,/g, ' ') + '.' + dec;
}

export default function Jackpots() {
  const { openModal } = useUI();
  const go = useSectionNav();
  const hero = usePageHero('jackpots'); // admin-editable eyebrow / title / desc

  const [favTab, setFavTab] = useState('slots');
  const [tiers, setTiers] = useState({ t1: 7740000, t2: 173550, t3: 16560, t4: 682200 });
  const [mega, setMega] = useState(8610389.37);

  useEffect(() => {
    const id = setInterval(() => {
      setTiers((prev) => ({
        t1: prev.t1 + Math.floor(Math.random() * 2800 + 800),
        t2: prev.t2 + Math.floor(Math.random() * 280 + 80),
        t3: prev.t3 + Math.floor(Math.random() * 55 + 15),
        t4: prev.t4 + Math.floor(Math.random() * 120 + 40),
      }));
      setMega((prev) => prev + Math.floor(Math.random() * 3200 + 900));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const playSlots = (e) => {
    e.stopPropagation();
    go('slots');
  };

  return (
    <div id="view-jackpots">
      <div className="jp-page">

        {/* ORNATE HEADER (uploadable banner falls back to the built-in hero) */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 20px 0' }}>
          <PageBanner pageKey="jackpots"
            eyebrow={hero.eyebrow || 'Exclusive'}
            title={hero.title || 'Onward Jackpots'}
            desc={hero.desc || 'Four internal progressive jackpots. All games are included. Play any games you like, place a bet of at least RM0.01. No extra effort from your side, no wager from us.'}
          >
            <div className="jp-header">
              <div className="jp-header-ornament">
                <span>🏆</span><span>💰</span><span>🎰</span><span>💎</span>
                <span>👑</span><span>🪙</span><span>🎲</span><span>🎁</span>
              </div>
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '400px' }}>
                <div className="jp-header-eyebrow" {...(hero.eyebrow ? {} : { 'data-i18n': 'jp_exclusive' })}>{hero.eyebrow || 'Exclusive'}</div>
                <div className="jp-header-title" {...(hero.title ? {} : { 'data-i18n': 'jp_title' })}>{hero.title || 'Onward Jackpots'}</div>
                <div className="jp-header-desc">{hero.desc || 'Four internal progressive jackpots. All games are included. Play any games you like, place a bet of at least RM0.01. No extra effort from your side, no wager from us.'}</div>
              </div>
            </div>
          </PageBanner>
        </div>

        {/* MEGA TOTAL COUNTER */}
        <div className="jp-mega-counter">
          <div className="jp-mega-amount"><span className="jp-mega-currency">₱</span><span id="jp-mega-val">{formatMega(mega)}</span></div>
        </div>

        {/* 4 TIER CARDS */}
        <div className="jp-tiers">

          <div className="jp-tier-card imperial" onClick={() => openModal('register')}>
            <span className="jp-tier-hot">HOT</span>
            <img className="jp-tier-crown" src={jpImperial} alt="" />
            <div className="jp-tier-name" data-i18n="jp_imperial">Imperial</div>
            <div className="jp-tier-label" data-i18n="misc_jackpot">Jackpot</div>
            <div className="jp-tier-amount imperial-color">
              <span id="jp-t1-val">{formatJPAmount(tiers.t1)}</span>
              <span className="jp-tier-currency">₱</span>
            </div>
            <div className="jp-tier-meta">
              <div className="jp-tier-meta-row"><span data-i18n="jp_min_bet">Minimum bet</span><span className="jp-tier-meta-val" id="jp-t1-min">307.52 ₱</span></div>
              <div className="jp-tier-meta-row"><span data-i18n="jp_max_win">Max win</span><span className="jp-tier-meta-val">3 075 250.00 ₱</span></div>
            </div>
            <button className="jp-tier-btn" onClick={playSlots} data-i18n="ui_play_now">Play Now</button>
          </div>

          <div className="jp-tier-card golden" onClick={() => openModal('register')}>
            <img className="jp-tier-crown" src={jpGolden} alt="" />
            <div className="jp-tier-name" data-i18n="jp_golden">Golden</div>
            <div className="jp-tier-label">Jackpot</div>
            <div className="jp-tier-amount golden-color">
              <span id="jp-t2-val">{formatJPAmount(tiers.t2)}</span>
              <span className="jp-tier-currency">₱</span>
            </div>
            <div className="jp-tier-meta">
              <div className="jp-tier-meta-row"><span>Minimum bet</span><span className="jp-tier-meta-val" id="jp-t2-min">153.76 ₱</span></div>
              <div className="jp-tier-meta-row"><span>Max win</span><span className="jp-tier-meta-val">615 050.00 ₱</span></div>
            </div>
            <button className="jp-tier-btn" onClick={playSlots}>Play Now</button>
          </div>

          <div className="jp-tier-card silver" onClick={() => openModal('register')}>
            <img className="jp-tier-crown" src={jpSilver} alt="" />
            <div className="jp-tier-name" data-i18n="jp_silver">Silver</div>
            <div className="jp-tier-label">Jackpot</div>
            <div className="jp-tier-amount silver-color">
              <span id="jp-t3-val">{formatJPAmount(tiers.t3)}</span>
              <span className="jp-tier-currency">₱</span>
            </div>
            <div className="jp-tier-meta">
              <div className="jp-tier-meta-row"><span>Minimum bet</span><span className="jp-tier-meta-val" id="jp-t3-min">30.75 ₱</span></div>
              <div className="jp-tier-meta-row"><span>Max win</span><span className="jp-tier-meta-val">61 505.00 ₱</span></div>
            </div>
            <button className="jp-tier-btn" onClick={playSlots}>Play Now</button>
          </div>

          <div className="jp-tier-card bronze" onClick={() => openModal('register')}>
            <img className="jp-tier-crown" src={jpBronze} alt="" />
            <div className="jp-tier-name" data-i18n="jp_bronze">Bronze</div>
            <div className="jp-tier-label">Jackpot</div>
            <div className="jp-tier-amount bronze-color">
              <span id="jp-t4-val">{formatJPAmount(tiers.t4)}</span>
              <span className="jp-tier-currency">₱</span>
            </div>
            <div className="jp-tier-meta">
              <div className="jp-tier-meta-row"><span>Minimum bet</span><span className="jp-tier-meta-val" id="jp-t4-min">12.30 ₱</span></div>
              <div className="jp-tier-meta-row"><span>Max win</span><span className="jp-tier-meta-val">15 376.25 ₱</span></div>
            </div>
            <button className="jp-tier-btn" onClick={playSlots}>Play Now</button>
          </div>

        </div>

        {/* LAST WINNINGS TABLE */}
        <div className="jp-winnings">
          <div className="jp-winnings-title" data-i18n="jp_last_win">Last winnings</div>
          <div className="jp-winnings-table">
            <table>
              <thead>
                <tr>
                  <th data-i18n="misc_date">Date</th>
                  <th data-i18n="misc_user">User</th>
                  <th>Jackpot</th>
                  <th style={{ textAlign: 'right' }}>Prize</th>
                </tr>
              </thead>
              <tbody id="jp-winnings-tbody">
                {JP_WINNINGS.map((w, i) => (
                  <tr key={i}>
                    <td style={{ color: 'rgba(255,255,255,.45)', fontSize: '12px' }}>{w.date}</td>
                    <td>
                      <div className="jp-user-cell">
                        <div className="jp-user-avatar">{w.user.charAt(0).toUpperCase()}</div>
                        {w.user}
                      </div>
                    </td>
                    <td>
                      <div className="jp-jackpot-cell">
                        {TIER_ICONS[w.tier]
                          ? <img className="jp-jackpot-crown" src={TIER_ICONS[w.tier]} alt="" />
                          : <span className="jp-jackpot-crown">🏅</span>}
                        <span className={w.tierClass}>{w.tier}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={'jp-prize-cell ' + w.tierClass}>{w.prize.toLocaleString('en', { minimumFractionDigits: 2 })} ₱</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="jp-winnings-btn" onClick={() => go('slots')} data-i18n="jp_play_games">PLAY GAMES</button>
        </div>

        {/* HOW TO CATCH A PRIZE */}
        <div className="jp-how">
          <div className="jp-how-title" data-i18n="jp_how_title">How to catch a prize</div>
          <div className="jp-how-steps">
            <div className="jp-how-step">
              <span className="jp-how-step-icon">🎲</span>
              <div className="jp-how-step-text" data-i18n="jp_play_desc">Play your favorite games whenever you like</div>
            </div>
            <div className="jp-how-step">
              <span className="jp-how-step-icon">💰</span>
              <div className="jp-how-step-text">Make a bet while playing, even minimal bets of <strong>₱6.15</strong> can be winning</div>
            </div>
            <div className="jp-how-step">
              <span className="jp-how-step-icon">🎁</span>
              <div className="jp-how-step-text">Have a chance to catch <strong>your prize!</strong></div>
            </div>
          </div>
        </div>

        {/* ALL FAVORITE GAMES */}
        <div className="jp-fav">
          <div className="jp-fav-header">
            <div className="jp-fav-title" data-i18n="jp_all_games">All your Favorite Games</div>
            <div className="jp-fav-tabs">
              <button className={'jp-fav-tab' + (favTab === 'slots' ? ' active' : '')} onClick={() => setFavTab('slots')}>Slots</button>
              <button className={'jp-fav-tab' + (favTab === 'live' ? ' active' : '')} onClick={() => setFavTab('live')} data-i18n="jp_live_games">Live games</button>
            </div>
          </div>
          <div className="jp-fav-grid" id="jp-fav-grid">
            {JP_FAV_GAMES.map((g, i) => (
              <div key={i} className="jp-fav-card" onClick={() => openModal('register')}>
                <div className="jp-fav-thumb" style={{ background: `linear-gradient(135deg,${g.color},${g.color}88)` }}>{g.icon}</div>
                <div className="jp-fav-players">{g.players}</div>
                <div className="jp-fav-name">{g.name}</div>
                <div className="jp-fav-overlay"><div className="jp-fav-play">▶</div></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
