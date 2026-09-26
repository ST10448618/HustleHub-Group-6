import api from './api';

/**
 * GET /gigs (public, ACTIVE only) or GET /gigs?category=X
 * filters.category, when provided, must be one of the 8 exact values
 * in utils/constants.js's GIG_CATEGORIES - the backend rejects any
 * other string with a 400 (a deliberate anti-NoSQL-injection check).
 */
export async function getGigs(filters = {}) {
  const params = {};
  if (filters.category) {
    params.category = filters.category;
  }
  const envelope = await api.get('/gigs', { params });
  return envelope.data.gigs;
}

/**
 * GET /gigs?mine=true - FREELANCER only. Returns ALL of the caller's
 * own gigs regardless of status (ACTIVE and INACTIVE) - the backend
 * does not filter this list further, so "My Gigs" screens must show
 * status badges rather than expecting only active ones back.
 */
export async function getMyGigs() {
  const envelope = await api.get('/gigs', { params: { mine: true } });
  return envelope.data.gigs;
}

/**
 * GET /gigs/:id - public, no auth required. Returns the gig
 * regardless of status (soft-deleted/INACTIVE gigs are still
 * reachable directly by id - see deleteGig below).
 */
export async function getGig(id) {
  const envelope = await api.get(`/gigs/${id}`);
  return envelope.data.gig;
}

/**
 * POST /gigs - FREELANCER only.
 * data: { title, description, category, price, depositAmount }
 * Never include freelancerId - it's derived server-side from the
 * authenticated token.
 */
export async function createGig(data) {
  const envelope = await api.post('/gigs', data);
  return envelope.data.gig;
}

/**
 * PUT /gigs/:id - owning FREELANCER or ADMIN. Partial update: only
 * send the fields that changed, or the whole form - both work.
 */
export async function updateGig(id, data) {
  const envelope = await api.put(`/gigs/${id}`, data);
  return envelope.data.gig;
}

/**
 * DELETE /gigs/:id - owning FREELANCER or ADMIN.
 *
 * Backend reality: this is a SOFT delete. It sets status to INACTIVE
 * and returns the updated gig object - never an empty response, and
 * never a 404 afterward. Callers should update local state to reflect
 * the new INACTIVE status rather than removing the item or expecting
 * it to disappear from a refetch of GET /gigs/:id.
 */
export async function deleteGig(id) {
  const envelope = await api.delete(`/gigs/${id}`);
  return envelope.data.gig;
}