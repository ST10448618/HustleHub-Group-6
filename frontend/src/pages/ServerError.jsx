import { ServerCrash } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';
import Button from '../components/common/Button.jsx';
import './StatusPages.css';

/**
 * Screen 33 - the generic "something broke" fallback. Rendered by
 * ErrorBoundary when a component crashes while rendering.
 *
 * Deliberately stands alone - no PublicShell, no auth hooks - because
 * it runs AFTER something has already gone wrong, so it must depend on
 * as little of the app as possible. It never shows the underlying
 * error: no message, no stack trace.
 */
function ServerError() {
  return (
    <div className="container status-page status-page-fullscreen">
      <EmptyState
        icon={ServerCrash}
        title="Something went wrong"
        description="An unexpected error occurred. Please try again, or return home."
        action={
          <div className="status-page-actions">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button to="/">Return Home</Button>
          </div>
        }
      />
    </div>
  );
}

export default ServerError;