import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MENU from '../services/menu';
import ComingSoon from '../pages/ComingSoon.jsx';

// id "all-players" -> "AllPlayers"
const pascal = (id) => id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

// Auto-discover converted page components in src/pages.
const modules = import.meta.glob('../pages/*.jsx');

function pageFor(id) {
  const path = `../pages/${pascal(id)}.jsx`;
  if (modules[path]) return lazy(modules[path]);
  return null;
}

// Flatten every navigable view id from the MENU hierarchy.
function allViews() {
  const out = [];
  for (const m of MENU) {
    if (m.link) out.push({ id: m.link.id, title: m.link.t });
    if (m.sub) m.sub.forEach((s) => out.push({ id: s.id, title: s.t }));
  }
  // Views reachable but not in the nav (e.g. One Click Setup).
  out.push({ id: 'setup', title: 'One Click Setup' });
  return out;
}

export default function AppRoutes() {
  const views = allViews();
  return (
    <Suspense fallback={<div className="card">Loading…</div>}>
      <Routes>
        {views.map(({ id, title }) => {
          const Page = pageFor(id);
          const element = Page ? <Page /> : <ComingSoon title={title} />;
          return <Route key={id} path={id === 'dashboard' ? '/' : `/${id}`} element={element} />;
        })}
        <Route path="*" element={<ComingSoon title="Dashboard" />} />
      </Routes>
    </Suspense>
  );
}
