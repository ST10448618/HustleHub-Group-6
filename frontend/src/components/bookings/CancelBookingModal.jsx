import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { useToast } from '../common/useToast.js';
import { cancelBooking } from '../../services/bookingService.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';

/**
 * The cancel-booking confirmation AND the API call behind it, in one
 * place, so the bookings list and the booking details page share
 * exactly the same behaviour and wording instead of each wiring their
 * own copy.
 *
 * On success it hands the updated booking to `onCancelled`. On
 * failure (e.g. the booking was already cancelled in another tab, or
 * the backend refuses) it shows the backend's own message as a toast
 * and closes - the page is then showing stale data, so closing is
 * better than leaving a dialog that can no longer succeed.
 *
 * The confirmation copy is fixed by the build reference.
 */
const CANCEL_MESSAGE =
  'Your deposit will be retained by the freelancer. The remaining payment will not be released.';

function CancelBookingModal({ booking, isOpen, onClose, onCancelled }) {
  const [confirming, setConfirming] = useState(false);
  const { showToast } = useToast();

  async function handleConfirm() {
    if (!booking) {
      return;
    }

    setConfirming(true);
    try {
      const updated = await cancelBooking(booking.id);
      onCancelled(updated);
    } catch (err) {
      showToast(err.message, 'error');
      onClose();
    } finally {
      setConfirming(false);
    }
  }

  function handleClose() {
    // Don't let Escape / the overlay dismiss the dialog while the
    // request is already in flight.
    if (!confirming) {
      onClose();
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen && Boolean(booking)}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={booking ? `Cancel booking for "${getBookingGigTitle(booking)}"?` : 'Cancel booking?'}
      message={CANCEL_MESSAGE}
      confirmLabel="Cancel Booking"
      cancelLabel="Keep Booking"
      variant="danger"
      confirming={confirming}
    />
  );
}

export default CancelBookingModal;