import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';

// Mirrors the tm-card markup produced by renderLobbySports().
export default function TopMatchCard({ match }) {
  const m = match;
  const navigate = useNavigate();
  const { openModal } = useUI();
  const tipFirst = (m.hotTip || '').split(' ')[0];

  return (
    <div className="tm-card" onClick={() => navigate('/sports')}>
      <div className="tm-meta">
        <div className="tm-meta-left">
          <div className="tm-time-badge">{m.time}</div>
          <div className="tm-meta-icon">{m.market1}</div>
          <div className="tm-meta-icon">{m.market2}</div>
        </div>
        <div className="tm-viewers">
          <span className="tm-viewers-icon">👥</span>
          {m.viewers}
          <span style={{ fontSize: '14px' }}>⚙</span>
        </div>
      </div>
      <div className="tm-teams">
        <div className="tm-team-logo">{m.homeLogo}</div>
        <div className="tm-teams-center">
          <div className="tm-team-name">{m.homeTeam}</div>
          <div className="tm-vs" data-i18n="tm_vs">vs</div>
          <div className="tm-team-name">{m.awayTeam}</div>
        </div>
        <div className="tm-team-logo">{m.awayLogo}</div>
      </div>
      <div className="tm-hot-tip">🔥 <strong>{tipFirst}</strong> <span>{m.hotTip.replace(tipFirst, '').trim()}</span></div>
      <div className="tm-odds">
        {m.odds.map((o, i) => (
          <button key={i} className="tm-odd" onClick={(e) => { e.stopPropagation(); openModal('register'); }}>
            <span className="tm-odd-label">{o.label}</span>
            <span className="tm-odd-val">{o.val}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
