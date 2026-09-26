import api from './api';

/**
 * GET /transactions - role-scoped, same pattern as bookings: CLIENT
 * sees transactions where they paid, FREELANCER sees transactions
 * where they were paid, ADMIN sees everything. Takes no parameters.
 *
 * There is deliberately no createTransaction/updateTransaction/
 * deleteTransaction export in this file - no such endpoint exists on
 * the backend. Transactions only ever come into existence as a side
 * effect of bookingService.createBooking (DEPOSIT) or
 * bookingService.completeBooking (REMAINDER).
 */
export async function getTransactions() {
  const envelope = await api.get('/transactions');
  return envelope.data.transactions;
}

/**
 * GET /transactions/:id - only the participating client, the
 * participating freelancer, or an admin can view it.
 */
export async function getTransaction(id) {
  const envelope = await api.get(`/transactions/${id}`);
  return envelope.data.transaction;
}