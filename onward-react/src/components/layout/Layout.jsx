import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Footer from './Footer.jsx';
import H5BottomNav from './H5BottomNav.jsx';
import ModalsRoot from '../modals/ModalsRoot.jsx';
import Dropdowns from './Dropdowns.jsx';
import Toaster from '../common/Toaster.jsx';
import { useUI } from '../../context/UIContext';

export default function Layout() {
  const { sidebarOpen, toggleSidebar } = useUI();

  return (
    <>
      <Header />

      {/* MOBILE SIDEBAR OVERLAY */}
      <div id="sb-overlay" className={sidebarOpen ? 'open' : ''} onClick={toggleSidebar}></div>

      {/* PAGE WRAPPER: sidebar + content side by side */}
      <div id="page-wrapper">
        <Sidebar />
        <div id="page-content">
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
    </>
  );
}
