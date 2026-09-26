/**
 * Date formatting and date-logic utilities.
 *
 * Accepts either a Date object or anything Date() can parse (the API
 * always returns ISO 8601 strings for bookingDate/createdAt/updatedAt).
 */

function toDate(input) {
  return input instanceof Date ? input : new Date(input);
}

/**
 * Display-formats a date as en-ZA short date, e.g. "2026/09/25".
 * Used for bookingDate, createdAt, "Member Since", etc.
 */
export function formatDate(input) {
  const date = toDate(input);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-ZA');
}

/**
 * Display-formats a date AND time, e.g. "2026/09/25, 14:30". Used
 * where a timestamp's time-of-day is meaningful (transaction detail,
 * admin tables) rather than just the date.
 */
export function formatDateTime(input) {
  const date = toDate(input);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const datePart = date.toLocaleDateString('en-ZA');
  const timePart = date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${datePart}, ${timePart}`;
}

/**
 * Converts a date into the "YYYY-MM-DD" string an <input type="date">
 * element needs for its value/min/max attributes. Uses LOCAL date
 * components (not UTC) since that's what the date picker itself shows
 * and expects.
 */
export function toDateInputValue(input) {
  const date = toDate(input);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Today's date as a "YYYY-MM-DD" string - used as the `min` attribute
 * on the booking date picker (bookingDate cannot be in the past; today
 * is allowed, per the backend's own validation rule).
 */
export function getTodayDateInputValue() {
  return toDateInputValue(new Date());
}

/**
 * Whether a booking's scheduled date has arrived. Deliberately mirrors
 * the exact comparison the backend itself uses
 * (BookingService.hasBookingDatePassed in bookingService.js:
 * `new Date() >= new Date(booking.bookingDate)`), so the frontend's
 * "Mark as Complete" button enables/disables at the same moment the
 * backend would accept/reject the request. This is a client-side
 * convenience only - the backend's own check is still the one that
 * actually matters and gets the final word.
 */
export function hasBookingDatePassed(bookingDate) {
  return new Date() >= toDate(bookingDate);
}