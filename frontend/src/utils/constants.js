/**
 * Shared constants.
 *
 * These mirror fixed enums the backend defines and validates against
 * (see backend/src/models/Gig.js, Booking.js, Transaction.js). Kept
 * in exactly one place so a dropdown, a filter, and a status badge
 * can never silently drift out of sync with each other - every screen
 * imports from here rather than typing these strings out again.
 */

// The gig category enum. Exactly these 8 values exist - the backend
// rejects anything else with a 400, both on gig create/update and on
// the ?category= query filter.
export const GIG_CATEGORIES = [
  'Software',
  'Design',
  'Photography',
  'Writing',
  'Marketing',
  'Video',
  'Business',
  'Other'
];

// The three user roles, exact casing as stored and returned by the API.
export const USER_ROLES = {
  CLIENT: 'CLIENT',
  FREELANCER: 'FREELANCER',
  ADMIN: 'ADMIN'
};

// Booking statuses. Deliberately only 3 - there is no PENDING state
// anywhere in this system (see backend/src/models/Booking.js).
export const BOOKING_STATUSES = {
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Ordered list form, for building filter tabs (All / Confirmed /
// Completed / Cancelled) without repeating the literal strings.
export const BOOKING_STATUS_LIST = ['CONFIRMED', 'COMPLETED', 'CANCELLED'];

// Transaction types and their human-readable display labels. The
// backend returns the raw type string; screens should always show the
// label, never the raw enum value.
export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  REMAINDER: 'REMAINDER'
};

export const TRANSACTION_TYPE_LABELS = {
  DEPOSIT: 'Deposit',
  REMAINDER: 'Remaining Payment'
};