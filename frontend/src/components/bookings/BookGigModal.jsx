import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import DateInput from '../common/DateInput.jsx';
import { createBooking } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { getTodayDateInputValue } from '../../utils/formatDate.js';

/**
 * The date-picker + confirm flow for POST /bookings. gigId/depositAmount
 * etc. are never sent by the caller beyond gigId and the chosen date -
 * amount/depositAmount/remainingAmount are always derived server-side
 * from the gig's current price, per the backend contract.
 */
function BookGigModal({ isOpen, onClose, gig, onSuccess }) {
  const [bookingDate, setBookingDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!bookingDate) {
      setError('Please choose a date.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const booking = await createBooking({ gigId: gig.id, bookingDate });
      onSuccess(booking);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book "${gig.title}"`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Booking…' : `Confirm & Pay ${formatCurrency(gig.depositAmount)} Deposit`}
          </Button>
        </>
      }
    >
      <p>
        Choose a date for this booking. Your deposit of{' '}
        <strong>{formatCurrency(gig.depositAmount)}</strong> is recorded as paid immediately; the
        remaining <strong>{formatCurrency(gig.price - gig.depositAmount)}</strong> is released once
        the work is marked complete.
      </p>
      <DateInput
        id="booking-date"
        label="Booking Date"
        min={getTodayDateInputValue()}
        value={bookingDate}
        onChange={(event) => setBookingDate(event.target.value)}
        error={error}
      />
    </Modal>
  );
}

export default BookGigModal;