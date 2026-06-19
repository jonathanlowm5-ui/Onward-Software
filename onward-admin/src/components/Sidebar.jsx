import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MENU from '../services/menu';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { IMG0 as LOGO } from '../assets/images';

const nbadge = (b) => (b ? <span className={`nbadge ${b[1] || ''}`}>{b[0]}</span> : null);

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, closeSidebar, toast } = useUI();
  const { logout } = useAuth();
  const [openCat, setOpenCat] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const activeId = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);

  const go = (id) => {
    navigate(id === 'dashboard' ? '/' : `/${id}`);
    if (window.innerWidth <= 768) closeSidebar();
    window.scrollTo({ top: 0 });
  };

  return (
    <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} id="sidebar">
      <div className="sb-head">
        <img className="brand-logo brand-logo-sb" src={LOGO} alt="ONWARD" />
        <span className="admin-chip">ADMIN</span>
      </div>
      <nav className="sb-nav" id="sbNav">
        {MENU.map((m, i) => {
          if (m.label) return <div className="sb-label" key={`l${i}`}>{m.label}</div>;
          if (m.link) {
            const it = m.link;
            return (
              <div className="sb-item" key={it.id}>
                <button className={`sb-link${activeId === it.id ? ' active' : ''}`} data-view={it.id} onClick={() => go(it.id)}>
                  <span className="ic">{it.ic}</span>{it.t}{nbadge(it.badge)}
                </button>
              </div>
            );
          }
          const isOpen = openCat === m.id || m.sub.some((s) => s.id === activeId);
          return (
            <div className={`sb-item${isOpen ? ' open' : ''}`} id={`mi-${m.id}`} key={m.id}>
              <button className="sb-cat" onClick={() => setOpenCat(openCat === m.id ? null : m.id)}>
                <span className="ic">{m.ic}</span>{m.cat}<span className="caret">▶</span>
              </button>
              <div className="sb-sub">
                {m.sub.map((s) => (
                  <button key={s.id} className={`sb-link${activeId === s.id ? ' active' : ''}`} data-view={s.id} onClick={() => go(s.id)}>
                    <span className="ic">{s.ic}</span>{s.t}{nbadge(s.badge)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="sb-desktop-note">
          <div className="t">🖥️ Desktop-only tools</div>
          <div className="d">Promotions, Marketing, App, CMS, Reports and Developer are available on the desktop version.</div>
        </div>
      </nav>
      <div className="sb-foot">
        <button className="oneclick" onClick={() => go('setup')}><span>⚡</span> One Click Setup</button>
        <div className="profile" onClick={(e) => { e.stopPropagation(); setProfileOpen((v) => !v); }}>
          <div className="avatar">SA</div>
          <div><div className="nm">Super Admin</div><div className="rl">Administrator</div></div>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>⋮</span>
          <div className={`profile-menu${profileOpen ? ' show' : ''}`} id="profileMenu">
            <button onClick={() => toast('Profile coming soon')}>👤 My Profile</button>
            <button className="signout" onClick={(e) => { e.stopPropagation(); logout(); }}>⏻ Sign Out</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
