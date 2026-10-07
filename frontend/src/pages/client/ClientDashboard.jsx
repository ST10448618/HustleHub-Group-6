import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, XCircle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/useAuth.js';
import { getMyBookings } from '../../services/bookingService.js';
import { BOOKING_STATUSES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate, formatDateTime } from '../../utils/formatDate.js';
import { getBookingGigTitle } from '../../utils/bookingDisplay.js';
import './ClientDashboard.css';

const UPCOMING_LIMIT = 5;
const ACTIVITY_LIMIT = 6;

/**
 * "Recent activity" is DERIVED from the bookings list - there is no
 * activity or notifications endpoint. Each booking contributes:
 *   - a "booked" event at createdAt (always)
 *   - a "completed" or "cancelled" event at updatedAt, when it has
 *     reached that status (a booking is only ever updated by being
 *     completed or cancelled, so updatedAt is when that happened)
 */
function buildActivity(bookings) {
  const events = [];

  for (const booking of bookings) {
    const title = getBookingGigTitle(booking);

    events.push({
      id: `${booking.id}-created`,
      kind: 'created',
      date: booking.createdAt,
      text: `You booked "${title}" - ${formatCurrency(booking.depositAmount)} deposit paid`
    });

    if (booking.status === BOOKING_STATUSES.COMPLETED) {
      events.push({
        id: `${booking.id}-completed`,
        kind: 'completed',
        date: booking.updatedAt,
        text: `"${title}" was completed - ${formatCurrency(booking.remainingAmount)} released`
      });
    }

    if (booking.status === BOOKING_STATUSES.CANCELLED) {
      events.push({
        id: `${booking.id}-cancelled`,
        kind: 'cancelled',
        date: booking.updatedAt,
        text: `You cancelled "${title}" - deposit retained`
      });
    }
  }

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const ACTIVITY_ICONS = {
  created: CalendarCheck,
  completed: CheckCircle2,
  cancelled: XCircle
};

function ClientDashboard() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await getMyBookings());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const { confirmedCount, completedCount, upcoming, activity } = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === BOOKING_STATUSES.CONFIRMED);
    return {
      confirmedCount: confirmed.length,
      completedCount: bookings.filter((b) => b.status === BOOKING_STATUSES.COMPLETED).length,
      upcoming: [...confirmed]
        .sort((a, b) => new Date(a.bookingDate) - new Date(b.bookingDate))
        .slice(0, UPCOMING_LIMIT),
      activity: buildActivity(bookings).slice(0, ACTIVITY_LIMIT)
    };
  }, [bookings]);

  const firstName = currentUser?.name?.split(' ')[0] ?? '';

  const upcomingColumns = [
    {
      key: 'gig',
      header: 'Gig',
      render: (booking) => (
        <Link to={`/client/bookings/${booking.id}`}>{getBookingGigTitle(booking)}</Link>
      )
    },
    { key: 'freelancer', header: 'Freelancer', render: (booking) => booking.freelancer?.name ?? '—' },
    { key: 'bookingDate', header: 'Service Date', render: (booking) => formatDate(booking.bookingDate) },
    { key: 'amount', header: 'Total', render: (booking) => formatCurrency(booking.amount) }
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening with your bookings."
        actions={<Button to="/marketplace">Browse Gigs</Button>}
      />

      {loading && <LoadingSkeleton count={3} height={110} />}

      {!loading && error && <ErrorState message={error} onRetry={loadBookings} />}

      {!loading && !error && bookings.length === 0 && (
        <div className="card">
          <EmptyState
            icon={CalendarCheck}
            title="No bookings yet"
            description="Find a gig you like and book it - your deposit is recorded instantly."
            action={<Button to="/marketplace">Browse Gigs</Button>}
          />
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="client-dashboard">
          <div className="client-dashboard-metrics">
            <MetricCard label="Confirmed Bookings" value={confirmedCount} accent />
            <MetricCard label="Completed Bookings" value={completedCount} />
          </div>

          <div className="client-dashboard-columns">
            <section className="card">
              <h2 className="section-title">Upcoming Bookings</h2>
              <DataTable
                columns={upcomingColumns}
                rows={upcoming}
                emptyMessage="No upcoming bookings."
              />
              <p className="client-dashboard-link">
                <Link to="/client/bookings">View all bookings</Link>
              </p>
            </section>

            <section className="card">
              <h2 className="section-title">Recent Activity</h2>
              <ul className="activity-list">
                {activity.map((event) => {
                  const Icon = ACTIVITY_ICONS[event.kind];
                  return (
                    <li key={event.id} className={`activity-item activity-item-${event.kind}`}>
                      <Icon size={18} className="activity-icon" aria-hidden="true" />
                      <div>
                        <p className="activity-text">{event.text}</p>
                        <p className="activity-date">{formatDateTime(event.date)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export default ClientDashboard;