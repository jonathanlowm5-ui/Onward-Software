import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import MobileNav from '../components/MobileNav.jsx';
import { useUI } from '../context/UIContext';

export default function AdminLayout() {
  const { sidebarOpen, closeSidebar, toastMsg } = useUI();

  return (
    <>
      <div id="app" className="active">
        <div className={`sb-overlay${sidebarOpen ? ' show' : ''}`} id="sbOverlay" onClick={closeSidebar} />
        <Sidebar />
        <div className="main">
          <Topbar />
          <main className="content" id="content">
            <section className="view active">
              <Outlet />
            </section>
          </main>
        </div>
      </div>
      <MobileNav />
      <div id="toast" className={toastMsg ? 'show' : ''}>{toastMsg}</div>
    </>
  );
}
