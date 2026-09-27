import './DataTable.css';

/**
 * A generic table.
 *   columns: [{ key, header, render?(row) }] - render is optional;
 *     without it, the cell just shows row[key] directly.
 *   rows: array of data objects.
 *   rowKey: (row) => string, defaults to row.id (every model in this
 *     backend returns a string `id`, so this default covers gigs,
 *     bookings, transactions, and users without change).
 *
 * Deliberately has NO pagination controls or props for them - nothing
 * in this backend supports server-side paging, and every list
 * endpoint already returns its full scoped result set in one
 * response (see the backend contract's "no pagination anywhere" note).
 */
function DataTable({ columns, rows, rowKey = (row) => row.id, emptyMessage = 'No records found.' }) {
  if (rows.length === 0) {
    return <p className="data-table-empty">{emptyMessage}</p>;
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;