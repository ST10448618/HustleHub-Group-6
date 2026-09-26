import api from './api';

/**
 * POST /auth/register
 *
 * Backend reality: this does NOT log the user in. Returns the safe
 * user object directly (data is the user, not { user }) - no token is
 * issued. AuthContext.registerThenLogin() (Phase 3) is responsible for
 * calling login() immediately afterward with the same credentials.
 */
export async function register({ name, email, password, role }) {
  const envelope = await api.post('/auth/register', { name, email, password, role });
  return envelope.data;
}

/**
 * POST /auth/login
 *
 * Returns { token, user }. This function does not persist the token -
 * it just returns it. AuthContext decides when/how to store it, so
 * this file stays a pure API client with no side effects.
 */
export async function login(email, password) {
  const envelope = await api.post('/auth/login', { email, password });
  return envelope.data;
}

/**
 * GET /auth/me
 *
 * Returns the safe user object directly. Used on app boot to restore
 * a session from a stored token, and never to read anything out of
 * the JWT payload itself (which deliberately only contains id/role).
 */
export async function getCurrentUser() {
  const envelope = await api.get('/auth/me');
  return envelope.data;
}