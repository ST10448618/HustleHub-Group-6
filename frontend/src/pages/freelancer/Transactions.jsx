import { useCallback, useEffect, useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { getTransactionColumns } from '../../components/financial/transactionColumns.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getTransactions } from '../../services/transactionService.js';

// Defined once, outside the component, so the table isn't handed a
// brand-new columns array on every render.
const COLUMNS = getTransactionColumns({
  basePath: '/freelancer/transactions',
  bookingBasePath: '/freelancer/bookings'
});

/**
 * Screen 20. Every payment made to this freelancer, newest first.
 * Transactions are read-only and only ever created by the backend as a
 * side effect of a booking (DEPOSIT) or its completion (REMAINDER).
 */
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTransactions(await getTransactions());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [transactions]
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every deposit and remaining payment you've received."
        actions={
          <Button variant="secondary" to="/freelancer/finances">
            Finances
          </Button>
        }
      />

      {loading && <LoadingSkeleton count={4} height={56} />}

      {!loading && error && <ErrorState message={error} onRetry={loadTransactions} />}

      {!loading && !error && sorted.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="A deposit appears here when a client books one of your gigs, and the remaining payment when you complete the booking."
            action={<Button to="/freelancer/bookings">View Bookings</Button>}
          />
        </div>
      )}

      {!loading && !error && sorted.length > 0 && <DataTable columns={COLUMNS} rows={sorted} />}
    </>
  );
}

export default Transactions;