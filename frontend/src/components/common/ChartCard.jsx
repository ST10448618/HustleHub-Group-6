import './ChartCard.css';

/**
 * A titled card wrapper for a Recharts chart (Income Over Time,
 * Deposit vs Released - Screens 12/19). Pass isEmpty when there's
 * genuinely no data yet (e.g. a brand-new freelancer with zero
 * transactions) to show a plain message instead of an empty or
 * fake-looking chart - the build reference is explicit that this
 * must never be a fake flat line.
 *
 * chart-card-body has a set min-height because Recharts'
 * ResponsiveContainer requires an explicitly-sized parent to render
 * into - without it, the chart silently renders at 0 height.
 */
function ChartCard({ title, isEmpty = false, emptyMessage = 'No data available yet.', children }) {
  return (
    <div className="chart-card card">
      {title && <h3 className="chart-card-title">{title}</h3>}
      {isEmpty ? (
        <p className="chart-card-empty">{emptyMessage}</p>
      ) : (
        <div className="chart-card-body">{children}</div>
      )}
    </div>
  );
}

export default ChartCard;