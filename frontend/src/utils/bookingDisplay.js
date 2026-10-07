/**
 * Small display helpers shared by every screen that shows a booking
 * (client, freelancer and admin views), so the wording lives in one
 * place and can never differ between screens.
 */

// What the "remaining payment" actually means at each point in a
// booking's life. The amount itself (booking.remainingAmount) never
// changes - only whether it has been, or will be, paid out.
export function getRemainingPaymentNote(status) {
  switch (status) {
    case 'COMPLETED':
      return 'Released';
    case 'CANCELLED':
      return 'Not released';
    default:
      return 'Due on completion';
  }
}

// A booking always carries booking.gig.title since the Phase 0 backend
// fix, but a missing title should never crash a whole list.
export function getBookingGigTitle(booking) {
  return booking.gig?.title || 'Gig unavailable';
}