import LiveCard from '../components/casino/LiveCard.jsx';
import BannerCarousel from '../components/promotions/BannerCarousel.jsx';
import { LIVE_GAMES } from '../services/data/gameData';

export default function LiveCasino() {
  return (
    <div id="view-live">
      <div className="section" style={{ paddingTop: 20, paddingBottom: 0 }}>
        <BannerCarousel />
      </div>
      <div className="section">
        <div className="section-header">
          <h2 className="section-title" data-i18n="sec_live_casino">📡 Live Casino</h2>
        </div>
        <div className="live-grid" id="live-grid-full">
          {LIVE_GAMES.map((l, i) => <LiveCard key={i} live={l} />)}
        </div>
      </div>
    </div>
  );
}
