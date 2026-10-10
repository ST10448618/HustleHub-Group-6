import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminResourceDetail from '../../components/admin/AdminResourceDetail.jsx';
import AdminBookingActions from '../../components/admin/AdminBookingActions.jsx';
import BookingSummary from '../../components/bookings/BookingSummary.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';

/**
 * Screen 28. One booking, shown with the same summary and timeline the
 * client and freelancer see, plus the admin's Cancel / Complete actions
 * while it is CONFIRMED.
 */
function AdminBookingDetails() {
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

  function handleUpdated(updated, action) {
    setBooking((current) => ({ ...current, ...updated }));
    showToast(
      action === 'complete'
        ? `Booking completed. ${formatCurrency(updated.remainingAmount)} released.`
        : 'Booking cancelled. The deposit was retained.',
      'success'
    );
  }

  return (
    <AdminResourceDetail
      entityName="Booking"
      backTo="/admin/bookings"
      backLabel="Back to Bookings"
      breadcrumbs={[{ label: 'Bookings', to: '/admin/bookings' }, { label: 'Booking Details' }]}
      loading={loading}
      error={error}
      onRetry={loadBooking}
      title={booking ? getBookingGigTitle(booking) : undefined}
      subtitle={
        booking && (
          <>
            <StatusBadge status={booking.status} />
            <span>Booked on {formatDate(booking.createdAt)}</span>
          </>
        )
      }
      actions={booking && <AdminBookingActions booking={booking} onUpdated={handleUpdated} />}
    >
      {booking && <BookingSummary booking={booking} perspective="ADMIN" />}
    </AdminResourceDetail>
  );
}

export default AdminBookingDetails;