import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import SearchBar from '../common/SearchBar.jsx';
import Select from '../common/Select.jsx';
import DataTable from '../common/DataTable.jsx';
import Button from '../common/Button.jsx';
import LoadingSkeleton from '../common/LoadingSkeleton.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import './AdminResourceTable.css';

/**
 * ONE configurable list for every admin resource (Users now; Gigs,
 * Bookings and Transactions in the next phase) - not four bespoke
 * tables. A page hands it the data plus a little configuration and it
 * provides loading / error / empty states, search, filters, and the
 * "Showing X of Y" line.
 *
 *   columns            DataTable column definitions
 *   rows               the full, already-fetched list
 *   loading, error, onRetry
 *   noun               plural name used in text, e.g. 'users'
 *   searchPlaceholder  placeholder for the search box (omit for no search)
 *   searchText(row)    the text a search is matched against
 *   filters            [{ key, label, options: [{value,label}],
 *                         getValue(row) }] - each renders as a select
 *   emptyTitle / emptyDescription   shown when there are no rows at all
 *
 * Everything is filtered in the browser: the backend has no search or
 * filter parameters on any list.
 */
function AdminResourceTable({
  columns,
  rows,
  loading = false,
  error = '',
  onRetry,
  noun = 'items',
  searchPlaceholder,
  searchText,
  filters = [],
  emptyTitle = 'Nothing here yet',
  emptyDescription
}) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (term && searchText && !searchText(row).toLowerCase().includes(term)) {
        return false;
      }
      return filters.every((filter) => {
        const chosen = filterValues[filter.key];
        return !chosen || filter.getValue(row) === chosen;
      });
    });
  }, [rows, search, filterValues, filters, searchText]);

  const isFiltering = search.trim() !== '' || Object.values(filterValues).some(Boolean);

  function clearAll() {
    setSearch('');
    setFilterValues({});
  }

  if (loading) {
    return <LoadingSkeleton count={4} height={56} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (rows.length === 0) {
    return (
      <div className="card">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="admin-table">
      <div className="admin-table-toolbar">
        {searchPlaceholder && (
          <div className="admin-table-search">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder}
              ariaLabel={`Search ${noun}`}
            />
          </div>
        )}
        {filters.map((filter) => (
          <div key={filter.key} className="admin-table-filter">
            <Select
              id={`admin-filter-${filter.key}`}
              value={filterValues[filter.key] ?? ''}
              onChange={(event) =>
                setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))
              }
              options={filter.options}
              placeholder={`All ${filter.label}`}
              aria-label={`Filter by ${filter.label}`}
            />
          </div>
        ))}
      </div>

      <p className="admin-table-count">
        Showing {visibleRows.length} of {rows.length} {noun}
      </p>

      {visibleRows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={SearchX}
            title={`No ${noun} match`}
            description="Try a different search or filter."
            action={
              isFiltering && (
                <Button variant="secondary" onClick={clearAll}>
                  Clear search and filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <DataTable columns={columns} rows={visibleRows} />
      )}
    </div>
  );
}

export default AdminResourceTable;