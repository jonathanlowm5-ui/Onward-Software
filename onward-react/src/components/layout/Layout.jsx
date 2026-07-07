import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import useWebDesign from '../../hooks/useWebDesign';
import NotificationTicker from './NotificationTicker.jsx';
import PopoutAnnouncement from './PopoutAnnouncement.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import H5BottomNav from './H5BottomNav.jsx';
import ModalsRoot from '../modals/ModalsRoot.jsx';
import Dropdowns from './Dropdowns.jsx';
import Toaster from '../common/Toaster.jsx';
import { useUI } from '../../context/UIContext';

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useUI();

  // Admin Website Design overrides (only present once the admin saves them):
  // primary CTA button colours + the VIP hero background.
  const wd = useWebDesign();
  const wdCss = wd ? `
    ${wd.btnBg ? `.btn-primary,.hdr-deposit-btn{background:${wd.btnBg} !important;color:${wd.btnTx || '#10131c'} !important;}` : ''}
    ${wd.vip?.c1 ? `.vip-hero{background:linear-gradient(110deg,${wd.vip.c1},${wd.vip.c2 || wd.vip.c1}) !important;}` : ''}
  ` : '';

  return (
    <>
      {wdCss && <style id="wd-overrides">{wdCss}</style>}
      <Header />

      {/* MOBILE SIDEBAR OVERLAY */}
      <div id="sb-overlay" className={sidebarOpen ? 'open' : ''} onClick={toggleSidebar}></div>

      {/* PAGE WRAPPER: sidebar + content side by side */}
      <div id="page-wrapper">
        <Sidebar />
        <div id="page-content">
          {/* Announcement ticker — within the content column (clears the sidebar) */}
          <NotificationTicker />
          <main id="main-content">
            <Outlet />
          </main>
        </div>
      </div>

      <Footer />

      {/* Mobile bottom navigation (shown <=640px via CSS) */}
      <H5BottomNav />

      {/* Modals, dropdowns, toasts */}
      <ModalsRoot />
      <Dropdowns />
      <Toaster />
      <PopoutAnnouncement />
    </>
  );
}
