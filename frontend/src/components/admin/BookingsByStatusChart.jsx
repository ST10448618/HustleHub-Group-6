import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from '../common/ChartCard.jsx';
import { CHART_COLORS } from '../financial/chartColors.js';

/**
 * How the platform's bookings split across the three statuses
 * (Confirmed navy, Completed green, Cancelled red - the same colours
 * as the status badges). Drawn from the counts the dashboard already
 * derived; no extra data.
 */
function BookingsByStatusChart({ bookings }) {
  const data = [
    { name: 'Confirmed', value: bookings.confirmed, color: CHART_COLORS.primary },
    { name: 'Completed', value: bookings.completed, color: CHART_COLORS.success },
    { name: 'Cancelled', value: bookings.cancelled, color: CHART_COLORS.danger }
  ];
  const summary = data.map((slice) => `${slice.name} ${slice.value}`).join(', ');

  return (
    <ChartCard
      title="Bookings by Status"
      isEmpty={bookings.total === 0}
      emptyMessage="No bookings yet."
    >
      <div role="img" aria-label={`Bookings by status: ${summary}`}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export default BookingsByStatusChart;