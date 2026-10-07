import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import BookingCard from '../../components/bookings/BookingCard.jsx';
import BookingStatusTabs from '../../components/bookings/BookingStatusTabs.jsx';
import CancelBookingModal from '../../components/bookings/CancelBookingModal.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getMyBookings } from '../../services/bookingService.js';
import { BOOKING_STATUS_LIST } from '../../utils/constants.js';
import './ClientBookings.css';

function ClientBookings() {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancelTarget, setCancelTarget] = useState(null);

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

  // Newest booking first. GET /bookings takes no parameters, so this
  // ordering, and the status filter below, are both client-side.
  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bookings]
  );

  const counts = useMemo(() => {
    const result = { ALL: bookings.length };
    for (const status of BOOKING_STATUS_LIST) {
      result[status] = bookings.filter((b) => b.status === status).length;
    }
    return result;
  }, [bookings]);

  const visibleBookings =
    statusFilter === 'ALL'
      ? sortedBookings
      : sortedBookings.filter((b) => b.status === statusFilter);

  function handleCancelled(updated) {
    // Merge rather than replace, so nothing the list already had
    // (e.g. the freelancer's name) can be lost if the response is
    // ever slimmer than a list item.
    setBookings((current) =>
      current.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
    );
    setCancelTarget(null);
    showToast('Booking cancelled. Your deposit was retained.', 'success');
  }

  return (
    <>
      <PageHeader
        title="My Bookings"
        subtitle="Everything you've booked, and where each booking stands."
        actions={<Button to="/marketplace">Browse Gigs</Button>}
      />

      {loading && <LoadingSkeleton count={3} height={160} />}

      {!loading && error && <ErrorState message={error} onRetry={loadBookings} />}

      {!loading && !error && bookings.length === 0 && (
        <div className="card">
          <EmptyState
            icon={CalendarX}
            title="No bookings yet"
            description="Find a gig you like and book it - your deposit is recorded instantly."
            action={<Button to="/marketplace">Browse Gigs</Button>}
          />
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <>
          <BookingStatusTabs value={statusFilter} onChange={setStatusFilter} counts={counts} />

          {visibleBookings.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={CalendarX}
                title="No bookings in this view"
                description="Try a different status filter."
                action={
                  <Button variant="secondary" onClick={() => setStatusFilter('ALL')}>
                    Show all bookings
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="client-bookings-list">
              {visibleBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  basePath="/client/bookings"
                  perspective="CLIENT"
                  onCancel={setCancelTarget}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CancelBookingModal
        booking={cancelTarget}
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onCancelled={handleCancelled}
      />
    </>
  );
}

export default ClientBookings;