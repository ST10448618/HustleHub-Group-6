import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import ChartCard from '../common/ChartCard.jsx';
import { CHART_COLORS } from './chartColors.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { groupIncomeByMonth } from '../../utils/incomeSeries.js';

/**
 * Income per month, from the freelancer's PAID transactions. Bars
 * rather than a line: with only a month or two of data a line is a
 * single invisible dot, while a bar is always readable.
 *
 * With no transactions it shows ChartCard's empty message - never a
 * fake flat line. The text summary in aria-label means the chart's
 * information is also available to screen readers.
 */
function IncomeOverTimeChart({ transactions }) {
  const data = useMemo(() => groupIncomeByMonth(transactions), [transactions]);
  const summary = data.map((point) => `${point.label} ${formatCurrency(point.income)}`).join(', ');

  return (
    <ChartCard
      title="Income Over Time"
      isEmpty={data.length === 0}
      emptyMessage="No income yet. Your earnings will appear here once clients book your gigs."
    >
      <div role="img" aria-label={`Income by month: ${summary}`}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              tickLine={false}
              axisLine={false}
              width={84}
              tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Income']}
              cursor={{ fill: 'rgba(0, 31, 91, 0.06)' }}
            />
            <Bar
              dataKey="income"
              fill={CHART_COLORS.primary}
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default IncomeOverTimeChart;