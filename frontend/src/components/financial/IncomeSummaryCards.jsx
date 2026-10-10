import MetricCard from '../common/MetricCard.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import './IncomeSummaryCards.css';

/**
 * The four income figures from GET /income/me, with the display labels
 * the visual spec requires (never the raw field names):
 *
 *   totalIncome     -> "Total Income"       the real, banked headline
 *   depositIncome   -> "Deposit Income"
 *   remainingIncome -> "Released Income"
 *   pendingIncome   -> "Pending / Upcoming" scheduled, NOT yet released
 *
 * Pending is never added into the total - it is money that has not
 * actually been paid out yet - and the note says so. There is no tax
 * figure: the backend doesn't have one.
 */
function IncomeSummaryCards({ income }) {
  return (
    <div>
      <div className="income-cards">
        <MetricCard label="Total Income" value={formatCurrency(income.totalIncome)} accent />
        <MetricCard label="Deposit Income" value={formatCurrency(income.depositIncome)} />
        <MetricCard label="Released Income" value={formatCurrency(income.remainingIncome)} />
        <MetricCard label="Pending / Upcoming" value={formatCurrency(income.pendingIncome)} />
      </div>
      <p className="income-cards-note">
        Total Income is deposits plus released remaining payments. Pending / Upcoming is the
        remaining payment on confirmed bookings that has not been released yet, so it is not
        included in the total.
      </p>
    </div>
  );
}

export default IncomeSummaryCards;