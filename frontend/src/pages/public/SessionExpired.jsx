import { Link } from 'react-router-dom';

/**
 * Screen 06 from the build reference. Reached only one way: AuthContext's
 * global listener for SESSION_EXPIRED_EVENT (fired by services/api.js on
 * any 401) navigates here automatically. No page ever links here directly.
 */
function SessionExpired() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)', textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h2>Your session has expired</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
          Please log in again to continue.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            marginTop: 'var(--space-5)',
            fontWeight: 600
          }}
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}

export default SessionExpired;