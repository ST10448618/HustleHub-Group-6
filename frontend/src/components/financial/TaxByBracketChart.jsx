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

function TaxByBracketChart({ tax }) {
  const data = tax.breakdown.map((band) => ({
    label: `${Math.round(band.rate * 100)}%`,
    tax: band.taxInBracket
  }));
  const summary = data.map((point) => `${point.label} bracket ${formatCurrency(point.tax)}`).join(', ');

  return (
    <ChartCard
      title="Tax by Bracket (before rebate)"
      isEmpty={data.length === 0}
      emptyMessage="Tax brackets will appear here once you earn income this tax year."
    >
      <div role="img" aria-label={`Tax by bracket: ${summary}`}>
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
              formatter={(value) => [formatCurrency(value), 'Tax']}
              cursor={{ fill: 'rgba(0, 31, 91, 0.06)' }}
            />
            <Bar dataKey="tax" fill={CHART_COLORS.danger} radius={[6, 6, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default TaxByBracketChart;