import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminResourceDetail from '../../components/admin/AdminResourceDetail.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { getTransaction } from '../../services/transactionService.js';
import { getBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';
import {
  getTransactionDescription,
  getTransactionTypeLabel,
  shortTransactionId
} from '../../utils/transactionDisplay.js';

/**
 * Screen 30. One payment, strictly read-only (nothing can be done to a
 * transaction anywhere in the system, so there are no actions). It only
 * carries ids, so its booking is fetched once, best-effort, to show the
 * gig, client and freelancer; if that fails the page still works and
 * those lines show a dash.
 */
function AdminTransactionDetails() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransaction = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBooking(null);
    try {
      const loaded = await getTransaction(id);
      setTransaction(loaded);
      try {
        setBooking(await getBooking(loaded.bookingId));
      } catch {
        setBooking(null);
      }
    } catch (err) {
      setError({ message: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  return (
    <AdminResourceDetail
      entityName="Transaction"
      backTo="/admin/transactions"
      backLabel="Back to Transactions"
      breadcrumbs={[
        { label: 'Transactions', to: '/admin/transactions' },
        { label: transaction ? shortTransactionId(transaction.id) : 'Transaction' }
      ]}
      loading={loading}
      error={error}
      onRetry={loadTransaction}
      title={transaction ? getTransactionTypeLabel(transaction.type) : undefined}
      subtitle={transaction && getTransactionDescription(transaction.type)}
      tiles={transaction ? [{ label: 'Amount', value: formatCurrency(transaction.amount) }] : []}
      fields={
        transaction
          ? [
              { label: 'Reference', value: shortTransactionId(transaction.id) },
              { label: 'Transaction ID', value: transaction.id },
              { label: 'Type', value: getTransactionTypeLabel(transaction.type) },
              { label: 'Status', value: <StatusBadge status={transaction.status} /> },
              { label: 'Date', value: formatDateTime(transaction.createdAt) },
              { label: 'Gig', value: booking ? getBookingGigTitle(booking) : '—' },
              { label: 'Client', value: booking?.client?.name ?? '—' },
              { label: 'Freelancer', value: booking?.freelancer?.name ?? '—' },
              {
                label: 'Booking',
                value: <Link to={`/admin/bookings/${transaction.bookingId}`}>View booking</Link>
              }
            ]
          : []
      }
    />
  );
}

export default AdminTransactionDetails;