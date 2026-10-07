import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { getDashboardPathForRole } from '../../routes/RoleRedirect.jsx';
import Button from '../common/Button.jsx';
import './PublicShell.css';

/**
 * Wraps every marketing/browsing screen (Landing, Marketplace, Gig
 * Details, and the 403/404 pages) with a consistent header and footer.
 *
 * Auth-aware (Phase 6): a logged-in user browsing the marketplace used
 * to still see "Login / Register". Now they see a button back to their
 * own dashboard instead. While the session is still being restored on
 * page load, that slot renders nothing - so a returning user never
 * sees Login/Register flash and then swap.
 *
 * Login and Register deliberately do NOT use this shell - they have
 * their own minimal, centered layout (built in Phase 3).
 */
function PublicShell({ children }) {
  const { authenticated, role, loading } = useAuth();

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="container public-header-inner">
          <Link to="/" className="public-logo">
            HUSTLEHUB<span className="public-logo-accent">+</span>
          </Link>
          <nav className="public-nav" aria-label="Main">
            <Link to="/marketplace" className="public-nav-link">
              Marketplace
            </Link>
            <Link to="/#how-it-works" className="public-nav-link">
              How It Works
            </Link>
            {!loading && authenticated && (
              <Button to={getDashboardPathForRole(role)} variant="primary">
                Dashboard
              </Button>
            )}
            {!loading && !authenticated && (
              <>
                <Link to="/login" className="public-nav-link">
                  Login
                </Link>
                <Button to="/register" variant="primary">
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="public-footer">
        <div className="container public-footer-inner">
          <span className="public-logo public-footer-logo">
            HUSTLEHUB<span className="public-logo-accent">+</span>
          </span>
          <p className="public-footer-copy">
            &copy; {new Date().getFullYear()} HustleHub+. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default PublicShell;