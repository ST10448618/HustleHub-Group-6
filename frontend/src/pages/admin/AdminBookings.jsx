import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import AdminResourceTable from '../../components/admin/AdminResourceTable.jsx';
import BookingStatusTabs from '../../components/bookings/BookingStatusTabs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { getMyBookings } from '../../services/bookingService.js';
import { BOOKING_STATUS_LIST } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, hasBookingDatePassed } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';

// Stable references, defined once, so the table's filtering doesn't
// recompute on every render of this page.
const FILTERS = [
  {
    key: 'date',
    label: 'service dates',
    options: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'reached', label: 'Date reached' }
    ],
    getValue: (booking) => (hasBookingDatePassed(booking.bookingDate) ? 'reached' : 'upcoming')
  }
];

const searchText = (booking) =>
  `${getBookingGigTitle(booking)} ${booking.client?.name ?? ''} ${booking.freelancer?.name ?? ''}`;

const COLUMNS = [
  {
    key: 'gig',
    header: 'Gig',
    render: (booking) => (
      <Link to={`/admin/bookings/${booking.id}`}>{getBookingGigTitle(booking)}</Link>
    )
  },
  { key: 'client', header: 'Client', render: (booking) => booking.client?.name ?? '—' },
  { key: 'freelancer', header: 'Freelancer', render: (booking) => booking.freelancer?.name ?? '—' },
  {
    key: 'bookingDate',
    header: 'Service Date',
    render: (booking) => formatDate(booking.bookingDate)
  },
  { key: 'amount', header: 'Total', render: (booking) => formatCurrency(booking.amount) },
  { key: 'status', header: 'Status', render: (booking) => <StatusBadge status={booking.status} /> },
  {
    key: 'view',
    header: '',
    render: (booking) => (
      <Link
        to={`/admin/bookings/${booking.id}`}
        aria-label={`View booking for ${getBookingGigTitle(booking)}`}
      >
        View
      </Link>
    )
  }
];

/**
 * Screen 27. Every booking on the platform (an ADMIN token makes
 * GET /bookings return all of them), newest first. Status tabs with
 * counts - the same ones the client and freelancer see - plus search
 * and a service-date filter, all client-side.
 */
function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await getMyBookings());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const counts = useMemo(() => {
    const result = { ALL: bookings.length };
    for (const value of BOOKING_STATUS_LIST) {
      result[value] = bookings.filter((booking) => booking.status === value).length;
    }
    return result;
  }, [bookings]);

  const rows = useMemo(
    () =>
      bookings
        .filter((booking) => status === 'ALL' || booking.status === status)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bookings, status]
  );

  return (
    <>
      <PageHeader title="Bookings" subtitle="Every booking on the platform." />

      {!loading && !error && bookings.length > 0 && (
        <div className="page-alert">
          <BookingStatusTabs value={status} onChange={setStatus} counts={counts} />
        </div>
      )}

      <AdminResourceTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={loadBookings}
        noun="bookings"
        searchPlaceholder="Search by gig, client or freelancer"
        searchText={searchText}
        filters={FILTERS}
        emptyTitle="No bookings"
        emptyDescription={
          status === 'ALL'
            ? 'Bookings appear here once clients book gigs.'
            : 'There are no bookings with this status.'
        }
      />
    </>
  );
}

export default AdminBookings;