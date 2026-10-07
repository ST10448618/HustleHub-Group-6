import { Link } from 'react-router-dom';
import Alert from '../common/Alert.jsx';
import BookingTimeline from './BookingTimeline.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import { getBookingGigTitle, getRemainingPaymentNote } from '../../utils/bookingDisplay.js';
import './BookingSummary.css';

/**
 * The body of a booking details page: booking facts, the payment
 * breakdown and the progress timeline. Used by the client page now,
 * and by the freelancer (Screen 18) and admin (Screen 28) pages in
 * later phases - `perspective` only changes which party is named.
 *
 * Every name comes from booking.gig.title / booking.client.name /
 * booking.freelancer.name; nothing is fetched separately.
 */
function BookingSummary({ booking, perspective = 'CLIENT' }) {
  const showFreelancer = perspective === 'CLIENT' || perspective === 'ADMIN';
  const showClient = perspective === 'FREELANCER' || perspective === 'ADMIN';

  return (
    <div className="booking-summary">
      {booking.status === 'CANCELLED' && (
        <Alert variant="info">
          This booking was cancelled. The deposit was retained and the remaining payment was not
          released.
        </Alert>
      )}
      {booking.status === 'COMPLETED' && (
        <Alert variant="success">
          This booking is complete and the remaining payment has been released.
        </Alert>
      )}

      <div className="booking-summary-grid">
        <div className="booking-summary-main">
          <section className="card">
            <h2 className="section-title">Booking Details</h2>
            <dl className="booking-summary-list">
              <div>
                <dt>Gig</dt>
                <dd>
                  <Link to={`/gigs/${booking.gigId}`}>{getBookingGigTitle(booking)}</Link>
                </dd>
              </div>
              {showClient && (
                <div>
                  <dt>Client</dt>
                  <dd>{booking.client?.name ?? '—'}</dd>
                </div>
              )}
              {showFreelancer && (
                <div>
                  <dt>Freelancer</dt>
                  <dd>{booking.freelancer?.name ?? '—'}</dd>
                </div>
              )}
              <div>
                <dt>Service Date</dt>
                <dd>{formatDate(booking.bookingDate)}</dd>
              </div>
              <div>
                <dt>Booked On</dt>
                <dd>{formatDate(booking.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <h2 className="section-title">Payment</h2>
            <dl className="booking-summary-list">
              <div>
                <dt>Total</dt>
                <dd className="booking-summary-money">{formatCurrency(booking.amount)}</dd>
              </div>
              <div>
                <dt>Deposit</dt>
                <dd>
                  {formatCurrency(booking.depositAmount)}
                  <span className="booking-summary-note">Paid</span>
                </dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>
                  {formatCurrency(booking.remainingAmount)}
                  <span className="booking-summary-note">
                    {getRemainingPaymentNote(booking.status)}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="card booking-summary-progress">
          <h2 className="section-title">Progress</h2>
          <BookingTimeline booking={booking} />
        </aside>
      </div>
    </div>
  );
}

export default BookingSummary;