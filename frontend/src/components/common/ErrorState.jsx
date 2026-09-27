import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';
import './EmptyState.css';

/**
 * Shown when a fetch genuinely fails (network error, 500). `message`
 * should be the safe string already produced by services/api.js's
 * response interceptor - never a raw error object or stack trace.
 */
function ErrorState({ message = 'Something went wrong. Please try again later.', onRetry }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={40} className="empty-state-icon empty-state-icon-danger" aria-hidden="true" />
      <h3 className="empty-state-title">Something went wrong</h3>
      <p className="empty-state-description">{message}</p>
      {onRetry && (
        <div className="empty-state-action">
          <Button variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;