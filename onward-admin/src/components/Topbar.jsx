import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import MENU from '../services/menu';

// Resolve the page title for the current route from the MENU hierarchy.
function titleFor(id) {
  for (const m of MENU) {
    if (m.link && m.link.id === id) return m.link.t;
    if (m.sub) { const s = m.sub.find((x) => x.id === id); if (s) return s.t; }
  }
  return 'Dashboard';
}

export default function Topbar() {
  const { openSidebar, toggleTheme, light, toast } = useUI();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const id = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);

  return (
    <header className="topbar">
      <button className="hamburger" onClick={openSidebar} aria-label="Open menu">☰</button>
      <div className="page-title" id="pageTitle">{titleFor(id)}</div>
      <div className="tb-right">
        <div style={{ position: 'relative' }} id="nbWrap">
          <button className="tb-btn bell" onClick={() => toast('Notifications')}>🔔<span className="dot" id="nbDot">6</span></button>
        </div>
        <button className="tb-btn tb-theme" id="themeBtn" title="Toggle day / night" onClick={toggleTheme}>
          <span className="ic">{light ? '☀️' : '🌙'}</span>
        </button>
        <button className="tb-btn hide-m" onClick={() => toast('Opening player site…')}>View Site</button>
        <button className="tb-btn hide-m">🇵🇭 PHP ▾</button>
        <div className="lang-wrap" id="langWrap">
          <button className="tb-btn" onClick={() => setLangOpen((v) => !v)} id="langBtn">🇺🇸 EN ▾</button>
          <div className={`lang-menu${langOpen ? ' show' : ''}`} id="langMenu" onClick={(e) => e.stopPropagation()} />
        </div>
      </div>
    </header>
  );
}
