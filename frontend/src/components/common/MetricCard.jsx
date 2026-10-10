import './MetricCard.css';

/**
 * A big number with a muted label above it. `hint` is an optional
 * small line underneath for a breakdown (e.g. "5 clients · 3
 * freelancers"); nothing changes for cards that don't pass one.
 */
function MetricCard({ label, value, accent = false, hint }) {
  return (
    <div className={`metric-card card ${accent ? 'metric-card-accent' : ''}`.trim()}>
      <p className="metric-card-label">{label}</p>
      <p className="metric-card-value">{value}</p>
      {hint && <p className="metric-card-hint">{hint}</p>}
    </div>
  );
}

export default MetricCard;