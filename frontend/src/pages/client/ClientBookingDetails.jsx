import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import BookingSummary from '../../components/bookings/BookingSummary.jsx';
import CancelBookingModal from '../../components/bookings/CancelBookingModal.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getBooking } from '../../services/bookingService.js';
import { formatDate } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';

function ClientBookingDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);

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

  function handleCancelled(updated) {
    setBooking((current) => ({ ...current, ...updated }));
    setCancelOpen(false);
    showToast('Booking cancelled. Your deposit was retained.', 'success');
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
          action={<Button to="/client/bookings">Back to My Bookings</Button>}
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
          items={[{ label: 'My Bookings', to: '/client/bookings' }, { label: 'Booking Details' }]}
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
          booking.status === 'CONFIRMED' && (
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel Booking
            </Button>
          )
        }
      />

      <BookingSummary booking={booking} perspective="CLIENT" />

      <CancelBookingModal
        booking={booking}
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
      />
    </>
  );
}

export default ClientBookingDetails;