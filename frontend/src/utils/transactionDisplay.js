import { TRANSACTION_TYPE_LABELS } from './constants.js';

/**
 * Display helpers for transactions, shared by every role's
 * transaction screens so the wording lives in one place.
 */

// Raw type string -> the label people should see ("Remaining
// Payment", never "REMAINDER").
export function getTransactionTypeLabel(type) {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

// A transaction has no human-friendly number of its own, only a long
// database id. The last 8 characters make a short, readable reference
// that is still unique enough to quote in a support message.
export function shortTransactionId(id) {
  return `#${String(id).slice(-8).toUpperCase()}`;
}

// One neutral sentence on what the payment was for.
export function getTransactionDescription(type) {
  if (type === 'DEPOSIT') {
    return 'Deposit paid when the booking was made.';
  }
  if (type === 'REMAINDER') {
    return 'Remaining payment released when the booking was completed.';
  }
  return '';
}