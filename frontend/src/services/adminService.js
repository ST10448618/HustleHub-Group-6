import api from './api';

/**
 * GET /admin/users - ADMIN only.
 * Note: unlike gigs/bookings/transactions, this list has no
 * server-side sort order (the backend returns whatever order MongoDB
 * gives it) - if the Admin Users table needs a stable order, sort it
 * client-side after fetching.
 */
export async function getUsers() {
  const envelope = await api.get('/admin/users');
  return envelope.data.users;
}

/**
 * GET /admin/users/:id - ADMIN only. The returned user object
 * includes three extra fields not present anywhere else: gigsCount,
 * bookingsCount, transactionsCount - cheap counts only, never full
 * nested lists. There is no way to fetch "this user's actual gigs"
 * from this endpoint; that requires a separate full-list fetch
 * (getAllGigs / bookingService.getMyBookings under an admin token /
 * transactionService.getTransactions) filtered client-side by id.
 */
export async function getUser(id) {
  const envelope = await api.get(`/admin/users/${id}`);
  return envelope.data.user;
}

/**
 * PUT /admin/users/:id - ADMIN only.
 * data: { name?, role? } - role must be CLIENT or FREELANCER (the
 * backend rejects "ADMIN" with a 400). Calling this on a user whose
 * role is already ADMIN always fails with a 400, unconditionally, on
 * any field - the Admin Users UI should never offer Edit for an ADMIN
 * row in the first place.
 */
export async function updateUser(id, data) {
  const envelope = await api.put(`/admin/users/${id}`, data);
  return envelope.data.user;
}

/**
 * DELETE /admin/users/:id - ADMIN only. Fails with a 400 (message
 * explains why - surface it directly, don't replace it with a generic
 * toast) if the target user has any existing gigs or bookings, or if
 * the target is an ADMIN.
 */
export async function deleteUser(id) {
  const envelope = await api.delete(`/admin/users/${id}`);
  return envelope.data.user;
}

/**
 * GET /admin/gigs - ADMIN only. The ONLY endpoint in the whole API
 * that returns gigs of every status (including INACTIVE) system-wide.
 *
 * There is deliberately no adminService function for bookings or
 * transactions - no /admin/bookings or /admin/transactions endpoint
 * exists, or ever will. bookingService.getMyBookings() and
 * transactionService.getTransactions() already return every booking/
 * transaction system-wide when called with an ADMIN token, because
 * the backend scopes those endpoints by the caller's role. Admin
 * screens for bookings/transactions should call those same services,
 * not invent new ones here.
 */
export async function getAllGigs() {
  const envelope = await api.get('/admin/gigs');
  return envelope.data.gigs;
}