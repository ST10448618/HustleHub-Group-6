import api from './api';

/**
 * POST /bookings - CLIENT only.
 * data: { gigId, bookingDate } - bookingDate as a "YYYY-MM-DD" string
 * (see utils/formatDate.js's toDateInputValue/getTodayDateInputValue).
 *
 * amount/depositAmount/remainingAmount are never sent - they are
 * always derived server-side from the gig's current price/deposit at
 * the moment of booking. A client CAN book the same gig more than
 * once; this is allowed by design, never blocked here.
 */
export async function createBooking({ gigId, bookingDate }) {
  const envelope = await api.post('/bookings', { gigId, bookingDate });
  return envelope.data.booking;
}

/**
 * GET /bookings - takes no parameters, ever. The backend scopes the
 * result entirely by the authenticated caller's role: CLIENT gets
 * their own bookings, FREELANCER gets bookings on their gigs, ADMIN
 * gets every booking system-wide. There is nothing for the frontend
 * to choose here.
 *
 * Since Phase 0's backend fix, every booking in the returned array
 * includes booking.gig.title, booking.client.name, and
 * booking.freelancer.name alongside the plain gigId/clientId/
 * freelancerId strings - use those directly, no extra lookups needed.
 */
export async function getMyBookings() {
  const envelope = await api.get('/bookings');
  return envelope.data.bookings;
}

/**
 * GET /bookings/:id - only the participating client, the owning
 * freelancer, or an admin can view it; anyone else gets a 403.
 */
export async function getBooking(id) {
  const envelope = await api.get(`/bookings/${id}`);
  return envelope.data.booking;
}

/**
 * PATCH /bookings/:id/cancel - owning CLIENT or ADMIN only, and only
 * while the booking is still CONFIRMED. The deposit is retained (its
 * transaction is untouched) and the remainder is simply never
 * scheduled - there is nothing else to call after this.
 */
export async function cancelBooking(id) {
  const envelope = await api.patch(`/bookings/${id}/cancel`);
  return envelope.data.booking;
}

/**
 * PATCH /bookings/:id/complete - owning FREELANCER or ADMIN only, and
 * only once bookingDate has actually arrived (see
 * utils/formatDate.js's hasBookingDatePassed for the client-side
 * mirror of this same gate). This single call both marks the booking
 * COMPLETED and releases the remaining payment (creates the REMAINDER
 * transaction) - there is no separate "release payment" action.
 */
export async function completeBooking(id) {
  const envelope = await api.patch(`/bookings/${id}/complete`);
  return envelope.data.booking;
}