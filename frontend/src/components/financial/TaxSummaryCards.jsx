import MetricCard from '../common/MetricCard.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import './TaxSummaryCards.css';

const formatPercent = (fraction) => `${(fraction * 100).toFixed(1)}%`;

function formatBand(band) {
  return band.to === null
    ? `${formatCurrency(band.from)} and above`
    : `${formatCurrency(band.from)} – ${formatCurrency(band.to)}`;
}

function TaxSummaryCards({ tax }) {
  return (
    <div>
      <div className="tax-cards">
        <MetricCard
          label="Taxable Income (YTD)"
          value={formatCurrency(tax.taxableIncome)}
          hint={`Tax year ${tax.taxYear}`}
          accent
        />
        <MetricCard
          label="Estimated Tax"
          value={formatCurrency(tax.estimatedTax)}
          hint={
            tax.estimatedTax === 0
              ? 'Below the tax-free threshold'
              : `Marginal rate ${formatPercent(tax.marginalRate)}`
          }
        />
        <MetricCard label="Take-home After Tax" value={formatCurrency(tax.afterTaxIncome)} />
        <MetricCard
          label="Effective Tax Rate"
          value={formatPercent(tax.effectiveRate)}
          hint={`Tax-free up to ${formatCurrency(tax.taxFreeThreshold)} a year`}
        />
      </div>

      <p className="tax-note">{tax.disclaimer}</p>

      <details className="tax-details">
        <summary>How is this calculated?</summary>
        <ol className="tax-steps">
          <li>
            We add up your paid deposits and released payments from {formatDate(tax.periodStart)}{' '}
            to {formatDate(tax.periodEnd)}. That total is your taxable income so far this tax
            year.
          </li>
          <li>
            Each slice of income is taxed at the rate for its bracket, so higher rates only apply
            to the part of your income above each threshold.
          </li>
          <li>
            The primary rebate of {formatCurrency(tax.rebate)} is subtracted. Tax cannot drop
            below zero, which is why income under {formatCurrency(tax.taxFreeThreshold)} is
            untaxed.
          </li>
        </ol>

        {tax.breakdown.length > 0 && (
          <div className="tax-table-wrap">
            <table className="tax-table">
              <thead>
                <tr>
                  <th scope="col">Income band</th>
                  <th scope="col">Rate</th>
                  <th scope="col">Income in band</th>
                  <th scope="col">Tax</th>
                </tr>
              </thead>
              <tbody>
                {tax.breakdown.map((band) => (
                  <tr key={band.from}>
                    <td>{formatBand(band)}</td>
                    <td>{Math.round(band.rate * 100)}%</td>
                    <td>{formatCurrency(band.amountInBracket)}</td>
                    <td>{formatCurrency(band.taxInBracket)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" colSpan={3}>Tax before rebate</th>
                  <td>{formatCurrency(tax.grossTax)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3}>Primary rebate</th>
                  <td>−{formatCurrency(tax.rebate)}</td>
                </tr>
                <tr>
                  <th scope="row" colSpan={3}>Tax payable after rebate</th>
                  <td>{formatCurrency(tax.estimatedTax)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}

export default TaxSummaryCards;