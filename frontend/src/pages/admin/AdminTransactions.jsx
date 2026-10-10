import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import AdminResourceTable from '../../components/admin/AdminResourceTable.jsx';
import { getTransactionColumns } from '../../components/financial/transactionColumns.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';
import Alert from '../../components/common/Alert.jsx';
import { getTransactions } from '../../services/transactionService.js';
import { getMyBookings } from '../../services/bookingService.js';
import { TRANSACTION_TYPE_LABELS } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';
import { shortTransactionId } from '../../utils/transactionDisplay.js';
import './AdminTransactions.css';

// Reference, Type, Amount, Date, Status, View booking - the same
// definition the freelancer's table uses, pointed at the admin pages.
const BASE_COLUMNS = getTransactionColumns({
  basePath: '/admin/transactions',
  bookingBasePath: '/admin/bookings'
});

const FILTERS = [
  {
    key: 'type',
    label: 'types',
    options: Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    getValue: (transaction) => transaction.type
  }
];

/**
 * Screen 29. Every payment on the platform, newest first. A transaction
 * only carries ids (no gig or people names), so the Gig / Client /
 * Freelancer columns are looked up from the bookings, which are fetched
 * ONCE alongside the transactions and matched in memory by bookingId
 * (never one request per row). If the bookings can't be loaded the
 * table still works, with a dash in those columns and a notice.
 */
function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsFailed, setBookingsFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    setBookingsFailed(false);

    const [transactionResult, bookingResult] = await Promise.allSettled([
      getTransactions(),
      getMyBookings()
    ]);

    if (transactionResult.status === 'fulfilled') {
      setTransactions(transactionResult.value);
    } else {
      setError(transactionResult.reason.message);
    }

    if (bookingResult.status === 'fulfilled') {
      setBookings(bookingResult.value);
    } else {
      setBookings([]);
      setBookingsFailed(true);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const bookingsById = useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings]
  );

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [transactions]
  );

  // Only PAID money counts as having actually moved.
  const totals = useMemo(() => {
    const paid = transactions.filter((transaction) => transaction.status === 'PAID');
    const sumOf = (type) =>
      paid
        .filter((transaction) => transaction.type === type)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
    const deposits = sumOf('DEPOSIT');
    const released = sumOf('REMAINDER');
    return { deposits, released, volume: deposits + released };
  }, [transactions]);

  const columns = useMemo(() => {
    const bookingFor = (transaction) => bookingsById.get(transaction.bookingId);
    const related = [
      {
        key: 'gig',
        header: 'Gig',
        render: (transaction) => {
          const booking = bookingFor(transaction);
          return booking ? (
            <Link to={`/admin/bookings/${booking.id}`}>{getBookingGigTitle(booking)}</Link>
          ) : (
            '—'
          );
        }
      },
      {
        key: 'client',
        header: 'Client',
        render: (transaction) => bookingFor(transaction)?.client?.name ?? '—'
      },
      {
        key: 'freelancer',
        header: 'Freelancer',
        render: (transaction) => bookingFor(transaction)?.freelancer?.name ?? '—'
      }
    ];
    // Reference and Type first, then who/what it was for, then the rest.
    return [...BASE_COLUMNS.slice(0, 2), ...related, ...BASE_COLUMNS.slice(2)];
  }, [bookingsById]);

  const searchText = useCallback(
    (transaction) => {
      const booking = bookingsById.get(transaction.bookingId);
      return [
        shortTransactionId(transaction.id),
        booking ? getBookingGigTitle(booking) : '',
        booking?.client?.name ?? '',
        booking?.freelancer?.name ?? ''
      ].join(' ');
    },
    [bookingsById]
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every deposit and remaining payment on the platform."
      />

      {!loading && !error && bookingsFailed && (
        <div className="page-alert">
          <Alert variant="info">
            Gig, client and freelancer names couldn&apos;t be loaded just now, so those columns
            show a dash.
          </Alert>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="admin-transactions-totals">
          <MetricCard label="Payments Processed" value={formatCurrency(totals.volume)} accent />
          <MetricCard label="Deposits" value={formatCurrency(totals.deposits)} />
          <MetricCard label="Released Remaining" value={formatCurrency(totals.released)} />
        </div>
      )}

      <AdminResourceTable
        columns={columns}
        rows={sorted}
        loading={loading}
        error={error}
        onRetry={loadTransactions}
        noun="transactions"
        searchPlaceholder="Search by reference, gig, client or freelancer"
        searchText={searchText}
        filters={FILTERS}
        emptyTitle="No transactions yet"
        emptyDescription="A deposit appears here when a client books a gig."
      />
    </>
  );
}

export default AdminTransactions;