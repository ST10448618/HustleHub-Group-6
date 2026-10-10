import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import BookingCard from '../../components/bookings/BookingCard.jsx';
import BookingStatusTabs from '../../components/bookings/BookingStatusTabs.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getMyBookings } from '../../services/bookingService.js';
import { BOOKING_STATUS_LIST } from '../../utils/constants.js';
import './FreelancerBookings.css';

/**
 * Screen 17. Same shape as the client's list (and the same filter
 * tabs), seen from the other side: each card names the CLIENT, and
 * there is no Cancel button - only the client or an admin can cancel.
 * A freelancer finishes a booking from its details page instead.
 */
function FreelancerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Clients who have booked your gigs, and where each booking stands."
        actions={
          <Button variant="secondary" to="/freelancer/gigs">
            My Gigs
          </Button>
        }
      />

      {loading && <LoadingSkeleton count={3} height={160} />}

      {!loading && error && <ErrorState message={error} onRetry={loadBookings} />}

      {!loading && !error && bookings.length === 0 && (
        <div className="card">
          <EmptyState
            icon={CalendarX}
            title="No bookings yet"
            description="When a client books one of your gigs, it will appear here."
            action={<Button to="/freelancer/gigs">View My Gigs</Button>}
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
            <div className="freelancer-bookings-list">
              {visibleBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  basePath="/freelancer/bookings"
                  perspective="FREELANCER"
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default FreelancerBookings;