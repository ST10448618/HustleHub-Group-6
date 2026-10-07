import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { getBookingGigTitle, getRemainingPaymentNote } from '../../utils/bookingDisplay.js';
import './BookingCard.css';

/**
 * One booking as a card. Shared by every role's bookings list:
 *   basePath    where its details page lives, e.g. '/client/bookings'
 *   perspective 'CLIENT' shows the freelancer's name, 'FREELANCER'
 *               shows the client's, 'ADMIN' shows both
 *   onCancel    optional - when given, a Cancel Booking button appears
 *               on CONFIRMED bookings (the client list passes it;
 *               other roles don't)
 *
 * Names come straight from booking.client.name / booking.freelancer.name
 * (added by the Phase 0 backend fix) - nothing is looked up separately.
 */
function BookingCard({ booking, basePath, perspective = 'CLIENT', onCancel }) {
  const detailsPath = `${basePath}/${booking.id}`;
  const title = getBookingGigTitle(booking);

  const parties = [];
  if (perspective === 'CLIENT' || perspective === 'ADMIN') {
    parties.push(`Freelancer: ${booking.freelancer?.name ?? '—'}`);
  }
  if (perspective === 'FREELANCER' || perspective === 'ADMIN') {
    parties.unshift(`Client: ${booking.client?.name ?? '—'}`);
  }

  return (
    <article className="card booking-card">
      <div className="booking-card-top">
        <div className="booking-card-heading">
          <h3 className="booking-card-title">
            <Link to={detailsPath}>{title}</Link>
          </h3>
          <p className="booking-card-parties">{parties.join('  ·  ')}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <dl className="booking-card-facts">
        <div>
          <dt>Service Date</dt>
          <dd>{formatDate(booking.bookingDate)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatCurrency(booking.amount)}</dd>
        </div>
        <div>
          <dt>Deposit Paid</dt>
          <dd>{formatCurrency(booking.depositAmount)}</dd>
        </div>
        <div>
          <dt>Remaining</dt>
          <dd>
            {formatCurrency(booking.remainingAmount)}
            <span className="booking-card-note">{getRemainingPaymentNote(booking.status)}</span>
          </dd>
        </div>
      </dl>

      <div className="booking-card-actions">
        <Button variant="secondary" to={detailsPath}>
          View Details
        </Button>
        {onCancel && booking.status === 'CONFIRMED' && (
          <Button
            variant="secondary"
            className="booking-card-cancel"
            onClick={() => onCancel(booking)}
          >
            Cancel Booking
          </Button>
        )}
      </div>
    </article>
  );
}

export default BookingCard;