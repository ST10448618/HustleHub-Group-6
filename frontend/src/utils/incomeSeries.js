/**
 * Turns a freelancer's transactions into "income per month" for the
 * Income Over Time chart. There is no reporting endpoint, so this is
 * derived client-side from GET /transactions.
 *
 *  - Only PAID transactions count (the same ones the backend adds up
 *    for totalIncome).
 *  - Months are grouped by the transaction's createdAt, in the
 *    viewer's local time.
 *  - Months in between with no income are included as R0, so the
 *    chart's time axis is honest rather than skipping quiet months.
 *  - No transactions at all gives [] (the chart then shows its empty
 *    message instead of a fake flat line).
 *
 * Returns [{ key: '2026-10', label: 'Oct 2026', income: 3000 }, ...]
 * oldest month first.
 */
export function groupIncomeByMonth(transactions) {
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.status !== 'PAID') {
      continue;
    }

    const date = new Date(transaction.createdAt);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    // One number per calendar month: year * 12 + month index.
    const monthIndex = date.getFullYear() * 12 + date.getMonth();
    totals.set(monthIndex, (totals.get(monthIndex) ?? 0) + transaction.amount);
  }

  if (totals.size === 0) {
    return [];
  }

  const indexes = [...totals.keys()];
  const first = Math.min(...indexes);
  const last = Math.max(...indexes);
  const series = [];

  for (let index = first; index <= last; index += 1) {
    const year = Math.floor(index / 12);
    const month = index % 12;
    series.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: new Date(year, month, 1).toLocaleDateString('en-ZA', {
        month: 'short',
        year: 'numeric'
      }),
      income: totals.get(index) ?? 0
    });
  }

  return series;
}