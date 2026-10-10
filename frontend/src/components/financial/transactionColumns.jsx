import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { getTransactionTypeLabel, shortTransactionId } from '../../utils/transactionDisplay.js';
import './transactionColumns.css';

/**
 * Column definitions for the generic <DataTable /> when it lists
 * transactions. One definition, so the freelancer's table now and the
 * admin's later look and behave the same.
 *
 *   basePath         where a transaction's details page lives,
 *                    e.g. '/freelancer/transactions'
 *   bookingBasePath  where its booking's details page lives,
 *                    e.g. '/freelancer/bookings'
 *
 * Transactions carry only ids (no gig or client names), so the booking
 * link is how a row leads to "what was this for".
 */
export function getTransactionColumns({ basePath, bookingBasePath }) {
  return [
    {
      key: 'reference',
      header: 'Reference',
      render: (transaction) => (
        <Link to={`${basePath}/${transaction.id}`} className="transaction-reference">
          {shortTransactionId(transaction.id)}
        </Link>
      )
    },
    { key: 'type', header: 'Type', render: (transaction) => getTransactionTypeLabel(transaction.type) },
    { key: 'amount', header: 'Amount', render: (transaction) => formatCurrency(transaction.amount) },
    { key: 'createdAt', header: 'Date', render: (transaction) => formatDateTime(transaction.createdAt) },
    { key: 'status', header: 'Status', render: (transaction) => <StatusBadge status={transaction.status} /> },
    {
      key: 'booking',
      header: 'Booking',
      render: (transaction) => (
        <Link
          to={`${bookingBasePath}/${transaction.bookingId}`}
          aria-label={`View booking for transaction ${shortTransactionId(transaction.id)}`}
        >
          View booking
        </Link>
      )
    }
  ];
}