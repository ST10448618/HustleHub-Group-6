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

export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  REMAINDER: 'REMAINDER'
};

export const TRANSACTION_TYPE_LABELS = {
  DEPOSIT: 'Deposit',
  REMAINDER: 'Remaining Payment'
};