import { useNavigate, useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';

const ITEMS = [
  { mv: 'dashboard', ic: '📊', label: 'Home' },
  { mv: 'all-players', ic: '👥', label: 'Players' },
  { mv: 'deposits', ic: '💰', label: 'Deposits' },
  { mv: 'withdrawals', ic: '🏧', label: 'Cash Out' },
];

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSidebar } = useUI();
  const active = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);

  return (
    <nav className="mobile-nav" id="mobileNav">
      {ITEMS.map((it) => (
        <button key={it.mv} className={`mnav-btn${active === it.mv ? ' on' : ''}`} data-mv={it.mv}
          onClick={() => navigate(it.mv === 'dashboard' ? '/' : `/${it.mv}`)}>
          <span className="mic">{it.ic}</span>{it.label}
        </button>
      ))}
      <button className="mnav-btn" data-mv="__more" onClick={openSidebar}><span className="mic">☰</span>More</button>
    </nav>
  );
}
