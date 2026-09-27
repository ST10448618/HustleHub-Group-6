import './MetricCard.css';

/**
 * A single stat tile: label small and muted, value large and bold -
 * per the visual spec's rule that "financial numbers are visually
 * dominant over their labels." Used for income summaries (Screens 12,
 * 19), dashboard counts (Screens 07, 22), and admin user detail's
 * gigsCount/bookingsCount/transactionsCount tiles (Screen 24).
 */
function MetricCard({ label, value, accent = false }) {
  return (
    <div className={`metric-card card ${accent ? 'metric-card-accent' : ''}`.trim()}>
      <p className="metric-card-label">{label}</p>
      <p className="metric-card-value">{value}</p>
    </div>
  );
}

export default MetricCard;