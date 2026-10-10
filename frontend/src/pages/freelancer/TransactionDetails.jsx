import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getTransaction } from '../../services/transactionService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';
import {
  getTransactionDescription,
  getTransactionTypeLabel,
  shortTransactionId
} from '../../utils/transactionDisplay.js';
import './TransactionDetails.css';

/**
 * Screen 21. One payment in full. Strictly read-only - transactions
 * can't be edited or removed, so there are no actions here beyond
 * jumping to the booking it belongs to.
 */
function TransactionDetails() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTransaction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransaction(await getTransaction(id));
    } catch (err) {
      setError({ message: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  if (loading) {
    return <LoadingSkeleton count={2} height={200} />;
  }

  // 404 (no such transaction), 400 (malformed id) and 403 (someone
  // else's) all get a friendly page with a way back; anything else is
  // a real failure worth a Retry.
  if (error && [400, 403, 404].includes(error.status)) {
    return (
      <div className="card">
        <EmptyState
          icon={Receipt}
          title="Transaction not found"
          description={
            error.status === 403
              ? "You don't have access to this transaction."
              : "This transaction doesn't exist."
          }
          action={<Button to="/freelancer/transactions">Back to Transactions</Button>}
        />
      </div>
    );
  }

  if (error || !transaction) {
    return <ErrorState message={error?.message} onRetry={loadTransaction} />;
  }

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs
          items={[
            { label: 'Transactions', to: '/freelancer/transactions' },
            { label: shortTransactionId(transaction.id) }
          ]}
        />
      </div>

      <PageHeader
        title={getTransactionTypeLabel(transaction.type)}
        subtitle={<StatusBadge status={transaction.status} />}
      />

      <section className="card transaction-detail">
        <p className="transaction-detail-amount">{formatCurrency(transaction.amount)}</p>
        <p className="transaction-detail-description">{getTransactionDescription(transaction.type)}</p>

        <dl className="transaction-detail-list">
          <div>
            <dt>Reference</dt>
            <dd className="transaction-detail-mono">{shortTransactionId(transaction.id)}</dd>
          </div>
          <div>
            <dt>Transaction ID</dt>
            <dd className="transaction-detail-mono">{transaction.id}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{getTransactionTypeLabel(transaction.type)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={transaction.status} />
            </dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatDateTime(transaction.createdAt)}</dd>
          </div>
          <div>
            <dt>Booking</dt>
            <dd>
              <Link to={`/freelancer/bookings/${transaction.bookingId}`}>View booking</Link>
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}

export default TransactionDetails;