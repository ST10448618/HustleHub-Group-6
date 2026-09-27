import './LoadingSkeleton.css';

/**
 * One or more pulsing placeholder blocks, shown while a screen's
 * initial fetch is in flight - e.g. `<LoadingSkeleton count={4}
 * height={60} />` for a list of 4 gig-card-sized placeholders.
 *
 * The index-based key here is intentional and safe: this list is
 * always a fixed, static length for the duration it's rendered (it's
 * replaced wholesale by real content once loading finishes), never
 * reordered, filtered, or given per-item state - the usual reason to
 * avoid index keys doesn't apply to a purely decorative placeholder.
 */
function LoadingSkeleton({ count = 1, height = 20 }) {
  return (
    <div className="loading-skeleton-group">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="loading-skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export default LoadingSkeleton;