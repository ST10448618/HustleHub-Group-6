import { formatCurrency } from './formatCurrency.js';
import { getBookingGigTitle } from './bookingDisplay.js';
import { getRoleLabel } from './userDisplay.js';

/**
 * Everything on the Admin Dashboard is DERIVED from four full lists
 * the app already fetches - there is no stats or reporting endpoint.
 * Keeping the maths here, as plain functions, means it is easy to
 * reason about and to test.
 */

export function computeAdminStats({ users, gigs, bookings, transactions }) {
  const paid = transactions.filter((t) => t.status === 'PAID');
  const sumPaid = (type) =>
    paid.filter((t) => (type ? t.type === type : true)).reduce((sum, t) => sum + t.amount, 0);

  return {
    users: {
      total: users.length,
      clients: users.filter((u) => u.role === 'CLIENT').length,
      freelancers: users.filter((u) => u.role === 'FREELANCER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length
    },
    gigs: {
      total: gigs.length,
      active: gigs.filter((g) => g.status === 'ACTIVE').length,
      inactive: gigs.filter((g) => g.status === 'INACTIVE').length
    },
    bookings: {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length
    },
    money: {
      // Every PAID transaction on the platform (deposits + released
      // remaining payments) - money that has actually moved.
      volume: sumPaid(),
      deposits: sumPaid('DEPOSIT'),
      released: sumPaid('REMAINDER')
    }
  };
}

/**
 * A "what's been happening" feed, newest first, built from existing
 * records:
 *   - a user joining (their createdAt; admin accounts are skipped)
 *   - a gig being listed (its createdAt)
 *   - a booking being made (createdAt)
 *   - a booking completing / cancelling (updatedAt - a booking is only
 *     ever updated by being completed or cancelled)
 */
export function buildAdminActivity({ users, gigs, bookings }, limit = 8) {
  const events = [];

  for (const user of users) {
    if (user.role === 'ADMIN') {
      continue;
    }
    events.push({
      id: `user-${user.id}`,
      kind: 'user',
      date: user.createdAt,
      text: `${user.name} joined as a ${getRoleLabel(user.role).toLowerCase()}`
    });
  }

  for (const gig of gigs) {
    events.push({
      id: `gig-${gig.id}`,
      kind: 'gig',
      date: gig.createdAt,
      text: `${gig.freelancer?.name ?? 'A freelancer'} listed "${gig.title}"`
    });
  }

  for (const booking of bookings) {
    const title = getBookingGigTitle(booking);
    const client = booking.client?.name ?? 'A client';

    events.push({
      id: `booking-${booking.id}`,
      kind: 'booking',
      date: booking.createdAt,
      text: `${client} booked "${title}"`
    });

    if (booking.status === 'COMPLETED') {
      events.push({
        id: `completed-${booking.id}`,
        kind: 'completed',
        date: booking.updatedAt,
        text: `"${title}" was completed - ${formatCurrency(booking.remainingAmount)} released`
      });
    }

    if (booking.status === 'CANCELLED') {
      events.push({
        id: `cancelled-${booking.id}`,
        kind: 'cancelled',
        date: booking.updatedAt,
        text: `Booking for "${title}" was cancelled`
      });
    }
  }

  return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}