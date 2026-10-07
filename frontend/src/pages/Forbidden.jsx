import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/useAuth.js';
import { getDashboardPathForRole } from '../routes/RoleRedirect.jsx';
import PublicShell from '../components/layout/PublicShell.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import './StatusPages.css';

/**
 * Screen 31 - 403. ProtectedRoute redirects here when a logged-in user
 * opens a page their role isn't allowed to see. The button is
 * role-appropriate: back to that user's own dashboard. If someone
 * lands on /403 directly while logged out, there is no dashboard to
 * return to, so it falls back to a plain "Return Home".
 */
function Forbidden() {
  const { authenticated, role } = useAuth();

  return (
    <PublicShell>
      <div className="container status-page">
        <EmptyState
          icon={ShieldAlert}
          title="Access denied"
          description="You don't have permission to view this page."
          action={
            authenticated ? (
              <Button to={getDashboardPathForRole(role)}>Return to Dashboard</Button>
            ) : (
              <Button to="/">Return Home</Button>
            )
          }
        />
      </div>
    </PublicShell>
  );
}

export default Forbidden;