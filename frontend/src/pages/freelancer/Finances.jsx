import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import IncomeSummaryCards from '../../components/financial/IncomeSummaryCards.jsx';
import IncomeOverTimeChart from '../../components/financial/IncomeOverTimeChart.jsx';
import DepositVsReleasedChart from '../../components/financial/DepositVsReleasedChart.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { getMyIncome } from '../../services/incomeService.js';
import { getTransactions } from '../../services/transactionService.js';
import './Finances.css';

/**
 * Screen 19 - the financial dashboard. The four figures and the
 * Deposit vs Released chart come straight from GET /income/me; the
 * Income Over Time chart groups GET /transactions by month. No tax
 * card or placeholder anywhere: there is no tax data.
 */
function Finances() {
  const [income, setIncome] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFinances = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [incomeData, transactionData] = await Promise.all([getMyIncome(), getTransactions()]);
      setIncome(incomeData);
      setTransactions(transactionData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  return (
    <>
      <PageHeader
        title="Finances"
        subtitle="What you've earned, and what is still to come."
        actions={
          <Button variant="secondary" to="/freelancer/transactions">
            View Transactions
          </Button>
        }
      />

      {loading && <LoadingSkeleton count={3} height={120} />}

      {!loading && error && <ErrorState message={error} onRetry={loadFinances} />}

      {!loading && !error && income && (
        <div className="finances">
          <IncomeSummaryCards income={income} />

          <div className="finances-charts">
            <IncomeOverTimeChart transactions={transactions} />
            <DepositVsReleasedChart income={income} />
          </div>
        </div>
      )}
    </>
  );
}

export default Finances;