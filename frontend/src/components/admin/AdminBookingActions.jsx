import { useState } from 'react';
import Button from '../common/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { useToast } from '../common/useToast.js';
import { cancelBooking, completeBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, hasBookingDatePassed } from '../../utils/formatDate.js';
import './AdminBookingActions.css';

/**
 * Cancel / Complete for the admin booking page. The backend lets an
 * ADMIN do both on any CONFIRMED booking through the same endpoints the
 * client and freelancer use. Completing is only offered once the
 * service date has arrived - the same rule the backend enforces, which
 * still has the final word (its message is shown if it disagrees).
 * Wording is written for an admin, not for the booking's client.
 */
function AdminBookingActions({ booking, onUpdated }) {
  const { showToast } = useToast();
  const [dialog, setDialog] = useState(null); // 'cancel' | 'complete' | null
  const [working, setWorking] = useState(false);

  if (booking.status !== 'CONFIRMED') {
    return null;
  }

  const dateReached = hasBookingDatePassed(booking.bookingDate);
  const isComplete = dialog === 'complete';

  async function handleConfirm() {
    setWorking(true);
    try {
      const updated = isComplete
        ? await completeBooking(booking.id)
        : await cancelBooking(booking.id);
      onUpdated(updated, dialog);
      setDialog(null);
    } catch (err) {
      showToast(err.message, 'error');
      setDialog(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <div className="admin-booking-actions">
        <Button variant="secondary" disabled={!dateReached} onClick={() => setDialog('complete')}>
          Mark as Complete
        </Button>
        <Button variant="danger" onClick={() => setDialog('cancel')}>
          Cancel Booking
        </Button>
        {!dateReached && (
          <span className="admin-booking-hint">
            Completion is available from {formatDate(booking.bookingDate)}.
          </span>
        )}
      </div>

      <ConfirmDialog
        isOpen={dialog !== null}
        onClose={() => !working && setDialog(null)}
        onConfirm={handleConfirm}
        title={isComplete ? 'Complete this booking?' : 'Cancel this booking?'}
        message={
          isComplete
            ? `The remaining ${formatCurrency(booking.remainingAmount)} will be released to ${
                booking.freelancer?.name ?? 'the freelancer'
              }. This cannot be undone.`
            : "The client's deposit will be retained by the freelancer and the remaining payment will not be released. This cannot be undone."
        }
        confirmLabel={isComplete ? 'Complete Booking' : 'Cancel Booking'}
        cancelLabel={isComplete ? 'Not Yet' : 'Keep Booking'}
        variant={isComplete ? 'primary' : 'danger'}
        confirming={working}
      />
    </>
  );
}

export default AdminBookingActions;