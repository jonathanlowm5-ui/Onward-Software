import { useLocation } from 'react-router-dom';
import useSectionNav from '../../hooks/useSectionNav';
import { useUI } from '../../context/UIContext';

/*
 * Mobile bottom navigation (#h5-bottom-nav). The styling already lives in
 * global.css (.h5-nav-item / .h5-nav-cta etc.) and only shows at <=640px — this
 * just renders the markup the CSS expects. Center item is the raised gold
 * Deposit CTA.
 */
const ITEMS = [
  { id: 'lobby', icon: '🏠', label: 'Home', match: '/' },
  { id: 'slots', icon: '🎰', label: 'Casino', match: '/slots' },
  { id: 'deposit', icon: '＋', label: 'Deposit', cta: true },
  { id: 'promos', icon: '🎁', label: 'Promos', match: '/promotions' },
  { id: 'profile', icon: '👤', label: 'Account', match: '/profile' },
];

export default function H5BottomNav() {
  const go = useSectionNav();
  const { openModal } = useUI();
  const { pathname } = useLocation();

  const isActive = (m) => (m === '/' ? pathname === '/' : pathname.startsWith(m));

  return (
    <nav id="h5-bottom-nav">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          className={'h5-nav-item' + (it.cta ? ' h5-nav-cta' : '') + (!it.cta && isActive(it.match) ? ' active' : '')}
          onClick={() => (it.cta ? openModal('deposit') : go(it.id))}
        >
          <span className="h5-nav-ico">{it.icon}</span>
          <span className="h5-nav-lbl">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}
