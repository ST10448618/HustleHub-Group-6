import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

/**
 * A single toast notification. Rendered by ToastProvider's container -
 * no page ever renders this directly, always through useToast().
 */
function Toast({ type = 'info', children, onDismiss }) {
  const Icon = ICONS[type] || Info;

  return (
    <div className={`toast toast-${type}`} role="status">
      <Icon size={18} className="toast-icon" aria-hidden="true" />
      <span className="toast-message">{children}</span>
      <button type="button" className="toast-dismiss-btn" onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}

export default Toast;