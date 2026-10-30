import { TRANSACTION_TYPE_LABELS } from './constants.js';

export function getTransactionTypeLabel(type) {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

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