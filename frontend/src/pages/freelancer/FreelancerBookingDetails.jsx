import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import BookingSummary from '../../components/bookings/BookingSummary.jsx';
import CompleteBookingButton from '../../components/bookings/CompleteBookingButton.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';

/**
 * Screen 18. The booking as the freelancer sees it: names the CLIENT,
 * shows the same payment breakdown and progress timeline as the
 * client's page (they share BookingSummary / BookingTimeline), and
 * offers the one action only this side has - Mark as Complete.
 */
function FreelancerBookingDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBooking(await getBooking(id));
    } catch (err) {
      setError({ message: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  function handleCompleted(updated) {
    setBooking((current) => ({ ...current, ...updated }));
    showToast(
      `Booking completed. ${formatCurrency(updated.remainingAmount)} has been released to you.`,
      'success'
    );
  }

  // After a refused completion the page may be showing stale data
  // (e.g. the booking was already completed in another tab). Quietly
  // re-read it - no loading skeleton, and if this refresh fails too,
  // just keep what is already on screen.
  async function refreshQuietly() {
    try {
      setBooking(await getBooking(id));
    } catch {
      // Keep the current view; the error toast already explained the failure.
    }
  }

  if (loading) {
    return <LoadingSkeleton count={2} height={200} />;
  }

  // 404 (no such booking) and 403 (someone else's booking) get a
  // friendly page with a way back; anything else is a real failure
  // worth a Retry.
  if (error && (error.status === 404 || error.status === 403)) {
    return (
      <div className="card">
        <EmptyState
          icon={CalendarX}
          title="Booking not found"
          description={
            error.status === 403
              ? "You don't have access to this booking."
              : "This booking doesn't exist."
          }
          action={<Button to="/freelancer/bookings">Back to Bookings</Button>}
        />
      </div>
    );
  }

  if (error || !booking) {
    return <ErrorState message={error?.message} onRetry={loadBooking} />;
  }

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs
          items={[{ label: 'Bookings', to: '/freelancer/bookings' }, { label: 'Booking Details' }]}
        />
      </div>

      <PageHeader
        title={getBookingGigTitle(booking)}
        subtitle={
          <>
            <StatusBadge status={booking.status} />
            <span>Booked on {formatDate(booking.createdAt)}</span>
          </>
        }
        actions={
          <CompleteBookingButton
            booking={booking}
            onCompleted={handleCompleted}
            onFailed={refreshQuietly}
          />
        }
      />

      <BookingSummary booking={booking} perspective="FREELANCER" />
    </>
  );
}

export default FreelancerBookingDetails;