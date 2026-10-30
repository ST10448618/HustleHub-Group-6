import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from '../common/ChartCard.jsx';
import { CHART_COLORS } from './chartColors.js';
import { formatCurrency } from '../../utils/formatCurrency.js';

function IncomeVsTaxChart({ tax }) {
  const data = [
    { name: 'Take-home', value: tax.afterTaxIncome, color: CHART_COLORS.success },
    { name: 'Estimated tax', value: tax.estimatedTax, color: CHART_COLORS.danger }
  ];
  const summary = data.map((slice) => `${slice.name} ${formatCurrency(slice.value)}`).join(', ');

  return (
    <ChartCard
      title="Income vs Estimated Tax"
      isEmpty={tax.taxableIncome === 0}
      emptyMessage="No taxable income yet this tax year."
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

export default IncomeVsTaxChart;