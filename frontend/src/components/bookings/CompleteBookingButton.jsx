import { useState } from 'react';
import Button from '../common/Button.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { useToast } from '../common/useToast.js';
import { completeBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, hasBookingDatePassed } from '../../utils/formatDate.js';
import './CompleteBookingButton.css';

/**
 * "Mark as Complete" - the action that finishes a booking AND releases
 * the remaining payment (the backend creates the REMAINDER transaction
 * in the same call; there is no separate "release payment" step).
 *
 * Everything about that lives here, so the freelancer page now and the
 * admin page later behave identically:
 *
 *  - Shown only while the booking is CONFIRMED (nothing else can be
 *    completed), and disabled until the scheduled date has arrived,
 *    using the same comparison the backend makes (hasBookingDatePassed).
 *    That is a convenience only - the backend has the FINAL word. If it
 *    refuses anyway (e.g. clock/timezone edge, or the booking was
 *    already completed in another tab), its own message is shown as-is.
 *  - Asks for confirmation first, because completing can't be undone.
 *  - On ANY failure the booking is left exactly as it was (the backend
 *    rolls a failed completion back, so it is still CONFIRMED), and
 *    `onFailed` lets the page quietly re-check what the booking
 *    really looks like now.
 *
 *   booking      the booking being completed
 *   onCompleted  (updatedBooking) => void
 *   onFailed     () => void, optional
 *   payee        'FREELANCER' (default, "released to you") or 'ADMIN'
 *                ("released to the freelancer")
 */
function CompleteBookingButton({ booking, onCompleted, onFailed, payee = 'FREELANCER' }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const { showToast } = useToast();

  if (booking.status !== 'CONFIRMED') {
    return null;
  }

  const dateReached = hasBookingDatePassed(booking.bookingDate);
  const recipient = payee === 'ADMIN' ? 'the freelancer' : 'you';

  async function handleConfirm() {
    setConfirming(true);
    try {
      const updated = await completeBooking(booking.id);
      setOpen(false);
      onCompleted(updated);
    } catch (err) {
      showToast(err.message, 'error');
      setOpen(false);
      if (onFailed) {
        onFailed();
      }
    } finally {
      setConfirming(false);
    }
  }

  function handleClose() {
    // Don't let Escape / the overlay dismiss the dialog while the
    // request is already in flight.
    if (!confirming) {
      setOpen(false);
    }
  }

  return (
    <>
      <div className="complete-booking">
        <Button onClick={() => setOpen(true)} disabled={!dateReached}>
          Mark as Complete
        </Button>
        {!dateReached && (
          <p className="complete-booking-hint">
            Available from {formatDate(booking.bookingDate)}, the scheduled service date.
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Mark this booking as complete?"
        message={`The remaining payment of ${formatCurrency(booking.remainingAmount)} will be released to ${recipient}. This cannot be undone.`}
        confirmLabel="Mark as Complete"
        cancelLabel="Not Yet"
        variant="primary"
        confirming={confirming}
      />
    </>
  );
}

export default CompleteBookingButton;