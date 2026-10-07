import { SearchX } from 'lucide-react';
import PublicShell from '../components/layout/PublicShell.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import './StatusPages.css';

/**
 * Screen 32 - 404. Any unknown URL is redirected here by the "*" route
 * in AppRoutes.jsx. Wrapped in PublicShell, which is auth-aware, so a
 * logged-in user still gets a way back to their dashboard.
 */
function NotFound() {
  return (
    <PublicShell>
      <div className="container status-page">
        <EmptyState
          icon={SearchX}
          title="Page not found"
          description="The page you are looking for doesn't exist or may have been moved."
          action={<Button to="/">Return Home</Button>}
        />
      </div>
    </PublicShell>
  );
}

export default NotFound;