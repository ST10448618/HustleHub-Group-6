import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import IncomeSummaryCards from '../../components/financial/IncomeSummaryCards.jsx';
import IncomeOverTimeChart from '../../components/financial/IncomeOverTimeChart.jsx';
import DepositVsReleasedChart from '../../components/financial/DepositVsReleasedChart.jsx';
import TaxSummaryCards from '../../components/financial/TaxSummaryCards.jsx';
import IncomeVsTaxChart from '../../components/financial/IncomeVsTaxChart.jsx';
import TaxByBracketChart from '../../components/financial/TaxByBracketChart.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { getMyIncome, getMyTax } from '../../services/incomeService.js';
import { getTransactions } from '../../services/transactionService.js';
import './Finances.css';

function Finances() {
  const [income, setIncome] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tax, setTax] = useState(null);
  const [taxError, setTaxError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFinances = useCallback(async () => {
    setLoading(true);
    setError('');
    setTaxError('');
    try {
      const taxRequest = getMyTax().then(
        (data) => ({ data, message: '' }),
        (err) => ({ data: null, message: err.message })
      );
      const [incomeData, transactionData, taxResult] = await Promise.all([
        getMyIncome(),
        getTransactions(),
        taxRequest
      ]);
      setIncome(incomeData);
      setTransactions(transactionData);
      setTax(taxResult.data);
      setTaxError(taxResult.message);
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
        subtitle="What you've earned, what is still to come, and what to set aside for tax."
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

          <section className="finances-tax">
            <h2 className="section-title">Tax Estimate</h2>

            {taxError && <ErrorState message={taxError} onRetry={loadFinances} />}

            {tax && (
              <>
                <TaxSummaryCards tax={tax} />
                <div className="finances-tax-charts">
                  <IncomeVsTaxChart tax={tax} />
                  <TaxByBracketChart tax={tax} />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export default Finances;