import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from '../common/ChartCard.jsx';
import { CHART_COLORS } from './chartColors.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

/**
 * How income splits between deposits and released remaining payments.
 * Drawn straight from the two numbers GET /income/me already returns -
 * no extra request and no recalculation.
 */
function DepositVsReleasedChart({ income }) {
  const data = [
    { name: 'Deposit Income', value: income.depositIncome, color: CHART_COLORS.primary },
    { name: 'Released Income', value: income.remainingIncome, color: CHART_COLORS.success }
  ];
  const isEmpty = income.depositIncome + income.remainingIncome === 0;
  const summary = data.map((slice) => `${slice.name} ${formatCurrency(slice.value)}`).join(', ');

  return (
    <ChartCard
      title="Deposit vs Released"
      isEmpty={isEmpty}
      emptyMessage="Nothing to compare yet. Deposits and released payments will show here."
    >
      <div role="img" aria-label={`Income split: ${summary}`}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default DepositVsReleasedChart;