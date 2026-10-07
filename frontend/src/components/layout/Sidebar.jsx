import { Link, NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { getDashboardPathForRole } from '../../routes/RoleRedirect.jsx';
import { NAV_ITEMS_BY_ROLE, COMMON_NAV_ITEMS } from './navConfig.js';
import './Sidebar.css';

/**
 * The authenticated left navigation.
 *
 * On desktop it is a permanent column. On tablet/mobile it becomes an
 * off-canvas drawer: AppShell owns the open/closed state and passes it
 * in, so the Topbar's menu button and this component stay in sync
 * without either knowing about the other (lifting state up).
 *
 * The item list comes from navConfig.js by role - one config, not
 * three hardcoded copies.
 */
function Sidebar({ open, onClose }) {
  const { role } = useAuth();
  const items = [...(NAV_ITEMS_BY_ROLE[role] ?? []), ...COMMON_NAV_ITEMS];

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside id="app-sidebar" className={`sidebar${open ? ' sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to={getDashboardPathForRole(role)} className="sidebar-logo" onClick={onClose}>
            HUSTLEHUB<span className="sidebar-logo-accent">+</span>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {items.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link-active' : ''}`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;