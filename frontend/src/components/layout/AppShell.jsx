import { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import './AppShell.css';

/**
 * The layout every authenticated screen lives inside: Sidebar on the
 * left, Topbar across the top, and the matched page rendered in the
 * content area via <Outlet />.
 *
 * Used as a "layout route" in AppRoutes.jsx, nested inside
 * ProtectedRoute, so a page only ever renders here AFTER the auth and
 * role checks have passed.
 *
 * Owns the one piece of state the two children share - whether the
 * mobile drawer is open - and closes it on Escape.
 */
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="app-main">
        <Topbar menuOpen={sidebarOpen} onMenuClick={openSidebar} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;