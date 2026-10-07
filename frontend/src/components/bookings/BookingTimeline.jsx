import Timeline from '../common/Timeline.jsx';
import { BOOKING_STATUSES } from '../../utils/constants.js';
import { formatDate, hasBookingDatePassed } from '../../utils/formatDate.js';

/**
 * Turns a booking's status into the steps the generic <Timeline />
 * draws. This is the ONE place that logic lives - the client
 * (Screen 09) and freelancer (Screen 18) booking detail pages both
 * use this component, so they can never disagree.
 *
 *   CONFIRMED -> 1. Booking Created & Deposit Paid   (done)
 *                2. waiting for / reached the service date (current)
 *                3. Completed & Remaining Payment Released (pending)
 *   COMPLETED -> all three steps done
 *   CANCELLED -> the forward timeline is REPLACED, not extended:
 *                Booking Created & Deposit Paid (done), then
 *                Booking Cancelled (cancelled). There is no step 3,
 *                because the remaining payment is never released.
 *
 * Deposit and booking creation are ONE combined step because the
 * backend records them together in a single action - there is no
 * separate "pending payment" state (no PENDING status exists).
 */
function buildSteps(booking) {
  const created = {
    id: 'created',
    label: 'Booking Created & Deposit Paid',
    status: 'done'
  };

  if (booking.status === BOOKING_STATUSES.CANCELLED) {
    return [created, { id: 'cancelled', label: 'Booking Cancelled', status: 'cancelled' }];
  }

  const isCompleted = booking.status === BOOKING_STATUSES.COMPLETED;
  const serviceDate = formatDate(booking.bookingDate);

  let serviceLabel;
  if (isCompleted) {
    serviceLabel = `Service Delivered (${serviceDate})`;
  } else if (hasBookingDatePassed(booking.bookingDate)) {
    serviceLabel = `Service date reached (${serviceDate}) - awaiting completion`;
  } else {
    serviceLabel = `Awaiting service date (${serviceDate})`;
  }

  return [
    created,
    { id: 'service', label: serviceLabel, status: isCompleted ? 'done' : 'current' },
    {
      id: 'completed',
      label: 'Completed & Remaining Payment Released',
      status: isCompleted ? 'done' : 'pending'
    }
  ];
}

function BookingTimeline({ booking }) {
  return <Timeline steps={buildSteps(booking)} />;
}

export default BookingTimeline;