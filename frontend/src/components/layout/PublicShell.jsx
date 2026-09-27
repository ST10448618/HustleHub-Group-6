import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import './PublicShell.css';

/**
 * Wraps every unauthenticated marketing/browsing screen (Landing,
 * Marketplace, Gig Details) with a consistent header and footer.
 *
 * Login and Register deliberately do NOT use this shell - the build
 * reference describes them as their own minimal, centered layout
 * ("decorative service visual, not a giant marketing page"), which
 * is what Phase 3 already built.
 */
function PublicShell({ children }) {
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
            <Link to="/login" className="public-nav-link">
              Login
            </Link>
            <Button to="/register" variant="primary">
              Register
            </Button>
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