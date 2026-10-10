import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import IncomeOverTimeChart from '../../components/financial/IncomeOverTimeChart.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { useAuth } from '../../context/useAuth.js';
import { getMyIncome } from '../../services/incomeService.js';
import { getMyBookings } from '../../services/bookingService.js';
import { getTransactions } from '../../services/transactionService.js';
import { BOOKING_STATUSES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';
import { getTransactionTypeLabel } from '../../utils/transactionDisplay.js';
import './FreelancerDashboard.css';

const LIST_LIMIT = 5;

/**
 * Screen 12. Everything comes from three existing endpoints, fetched
 * together once when the page opens (no polling - the numbers only
 * change when a booking is made or completed, and this page reloads
 * whenever you come back to it):
 *   GET /income/me      the four income figures
 *   GET /bookings       for the counts and the upcoming list
 *   GET /transactions   for the chart and the recent list
 * There is no tax card: the backend has no tax data.
 *
 * A brand-new freelancer legitimately has all zeros, so zeros are
 * shown as zeros (with the chart's own empty message) rather than
 * swapping the whole page for an "empty" screen.
 */
function FreelancerDashboard() {
  const { currentUser } = useAuth();
  const [income, setIncome] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [incomeData, bookingData, transactionData] = await Promise.all([
        getMyIncome(),
        getMyBookings(),
        getTransactions()
      ]);
      setIncome(incomeData);
      setBookings(bookingData);
      setTransactions(transactionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const { confirmedCount, completedCount, upcoming, recentTransactions } = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === BOOKING_STATUSES.CONFIRMED);
    return {
      confirmedCount: confirmed.length,
      completedCount: bookings.filter((b) => b.status === BOOKING_STATUSES.COMPLETED).length,
      upcoming: [...confirmed]
        .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
        .slice(0, LIST_LIMIT),
      recentTransactions: [...transactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, LIST_LIMIT)
    };
  }, [bookings, transactions]);

  const firstName = currentUser?.name?.split(' ')[0] ?? '';

  const upcomingColumns = [
    {
      key: 'gig',
      header: 'Gig',
      render: (booking) => (
        <Link to={`/freelancer/bookings/${booking.id}`}>{getBookingGigTitle(booking)}</Link>
      )
    },
    { key: 'client', header: 'Client', render: (booking) => booking.client?.name ?? '—' },
    { key: 'bookingDate', header: 'Service Date', render: (booking) => formatDate(booking.bookingDate) },
    { key: 'amount', header: 'Total', render: (booking) => formatCurrency(booking.amount) }
  ];

  const recentColumns = [
    {
      key: 'type',
      header: 'Type',
      render: (transaction) => (
        <Link to={`/freelancer/transactions/${transaction.id}`}>
          {getTransactionTypeLabel(transaction.type)}
        </Link>
      )
    },
    { key: 'amount', header: 'Amount', render: (transaction) => formatCurrency(transaction.amount) },
    { key: 'createdAt', header: 'Date', render: (transaction) => formatDateTime(transaction.createdAt) },
    { key: 'status', header: 'Status', render: (transaction) => <StatusBadge status={transaction.status} /> }
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's how your business is doing."
        actions={<Button to="/freelancer/gigs/create">Create Gig</Button>}
      />

      {loading && <LoadingSkeleton count={3} height={110} />}

      {!loading && error && <ErrorState message={error} onRetry={loadDashboard} />}

      {!loading && !error && income && (
        <div className="freelancer-dashboard">
          <div className="freelancer-dashboard-metrics">
            <MetricCard label="Total Income" value={formatCurrency(income.totalIncome)} accent />
            <MetricCard label="Pending / Upcoming" value={formatCurrency(income.pendingIncome)} />
            <MetricCard label="Confirmed Bookings" value={confirmedCount} />
            <MetricCard label="Completed Bookings" value={completedCount} />
          </div>

          <IncomeOverTimeChart transactions={transactions} />

          <div className="freelancer-dashboard-columns">
            <section className="card">
              <h2 className="section-title">Upcoming Bookings</h2>
              <DataTable
                columns={upcomingColumns}
                rows={upcoming}
                emptyMessage="No upcoming bookings."
              />
              <p className="freelancer-dashboard-link">
                <Link to="/freelancer/bookings">View all bookings</Link>
              </p>
            </section>

            <section className="card">
              <h2 className="section-title">Recent Transactions</h2>
              <DataTable
                columns={recentColumns}
                rows={recentTransactions}
                emptyMessage="No transactions yet."
              />
              <p className="freelancer-dashboard-link">
                <Link to="/freelancer/transactions">View all transactions</Link>
                {' · '}
                <Link to="/freelancer/finances">Finances</Link>
              </p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export default FreelancerDashboard;