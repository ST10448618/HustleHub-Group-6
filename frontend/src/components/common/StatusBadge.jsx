import './StatusBadge.css';

/**
 * The exact status color mapping locked in the visual spec:
 *   Booking CONFIRMED -> navy, COMPLETED -> success green,
 *   CANCELLED -> accent red
 *   Transaction PAID -> success green
 *   Gig ACTIVE -> navy, INACTIVE -> muted/silver
 * Always paired with a text label - never color alone - per the
 * spec's own accessibility note.
 */
const STATUS_STYLES = {
  CONFIRMED: { className: 'status-badge-navy', label: 'Confirmed' },
  COMPLETED: { className: 'status-badge-success', label: 'Completed' },
  CANCELLED: { className: 'status-badge-danger', label: 'Cancelled' },
  PAID: { className: 'status-badge-success', label: 'Paid' },
  ACTIVE: { className: 'status-badge-navy', label: 'Active' },
  INACTIVE: { className: 'status-badge-muted', label: 'Inactive' }
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { className: 'status-badge-muted', label: status };
  return <span className={`status-badge ${style.className}`}>{style.label}</span>;
}

export default StatusBadge;