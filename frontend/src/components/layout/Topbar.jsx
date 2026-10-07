import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import Avatar from '../common/Avatar.jsx';
import Button from '../common/Button.jsx';
import { ROLE_LABELS } from './navConfig.js';
import './Topbar.css';

/**
 * The slim bar across the top of the authenticated area: the mobile
 * menu button on the left, and on the right who is signed in plus a
 * Log out button. Logging out goes through AuthContext's logout(),
 * the single place that clears the token and redirects to /login.
 */
function Topbar({ menuOpen, onMenuClick }) {
  const { currentUser, role, logout } = useAuth();

  return (
    <header className="topbar">
      <button
        type="button"
        className="topbar-menu"
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        onClick={onMenuClick}
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="topbar-right">
        <div className="topbar-user">
          <Avatar name={currentUser?.name} size={36} />
          <div className="topbar-user-text">
            <span className="topbar-user-name">{currentUser?.name}</span>
            <span className="topbar-user-role">{ROLE_LABELS[role]}</span>
          </div>
        </div>

        <Button variant="secondary" onClick={logout} aria-label="Log out">
          <LogOut size={16} aria-hidden="true" />
          <span className="topbar-logout-label">Log out</span>
        </Button>
      </div>
    </header>
  );
}

export default Topbar;