import './EmptyState.css';

/**
 * A friendly "there's nothing here yet" state - Marketplace's
 * no-results-matching-filters case, My Gigs before creating any gig,
 * a freelancer with zero bookings, etc. `icon` takes a Lucide icon
 * component (not an element - this renders it itself so it can apply
 * consistent sizing/color).
 */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} className="empty-state-icon" aria-hidden="true" />}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;