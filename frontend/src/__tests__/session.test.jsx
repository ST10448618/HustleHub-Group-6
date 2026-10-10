import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import api, { SESSION_EXPIRED_EVENT, TOKEN_STORAGE_KEY } from '../services/api.js';
import { useAuth } from '../context/useAuth.js';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import SessionExpired from '../pages/public/SessionExpired.jsx';
import { renderWithRealAuth, USERS } from '../test/renderHelpers.jsx';

vi.mock('../services/authService', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn()
}));

import * as authService from '../services/authService';

/**
 * Replaces axios's network adapter with a fake server, so the REAL
 * interceptors in services/api.js run but no request leaves the test.
 *   reply  (config) => { status, data }   or throws to simulate no network
 */
function fakeServer(reply) {
  const seen = [];
  api.defaults.adapter = async (config) => {
    seen.push(config);
    const result = reply(config);
    if (result.status >= 400) {
      // Shaped like an axios failure: the interceptor reads .response and .config
      return Promise.reject({ response: result, config });
    }
    return { ...result, config, headers: {} };
  };
  return seen;
}

function listenForExpiry() {
  const handler = vi.fn();
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return { handler, stop: () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler) };
}

describe('api interceptors (the ONE place 401 is handled)', () => {
  it('attaches the stored token as a Bearer header, and none when logged out', async () => {
    const seen = fakeServer(() => ({ status: 200, data: { success: true, data: {} } }));

    await api.get('/gigs');
    expect(seen[0].headers.Authorization).toBeUndefined();

    localStorage.setItem(TOKEN_STORAGE_KEY, 'abc123');
    await api.get('/gigs');
    expect(seen[1].headers.Authorization).toBe('Bearer abc123');
  });

  it('returns the response envelope directly (already unwrapped from axios)', async () => {
    fakeServer(() => ({ status: 200, data: { success: true, message: 'ok', data: { gigs: [] } } }));
    await expect(api.get('/gigs')).resolves.toEqual({
      success: true,
      message: 'ok',
      data: { gigs: [] }
    });
  });

  it('a 401 on a normal endpoint clears the token and announces the expired session', async () => {
    fakeServer(() => ({ status: 401, data: { success: false, message: 'Invalid or expired token' } }));
    localStorage.setItem(TOKEN_STORAGE_KEY, 'old-token');
    const expiry = listenForExpiry();

    await expect(api.get('/bookings')).rejects.toEqual({
      status: 401,
      message: 'Invalid or expired token',
      errors: null
    });

    expect(expiry.handler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expiry.stop();
  });

  it('a 401 from the LOGIN endpoint is just a wrong password, not an expired session', async () => {
    fakeServer(() => ({ status: 401, data: { success: false, message: 'Invalid email or password' } }));
    const expiry = listenForExpiry();

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({ status: 401 });

    expect(expiry.handler).not.toHaveBeenCalled();
    expiry.stop();
  });

  it('keeps field errors from a 400 so forms can show them', async () => {
    fakeServer(() => ({
      status: 400,
      data: { success: false, message: 'Validation failed', errors: [{ field: 'title', message: 'Required' }] }
    }));

    await expect(api.post('/gigs', {})).rejects.toEqual({
      status: 400,
      message: 'Validation failed',
      errors: [{ field: 'title', message: 'Required' }]
    });
  });

  it('a network failure gives a friendly message and is NOT treated as a session expiry', async () => {
    api.defaults.adapter = async (config) => Promise.reject({ config }); // no response at all
    const expiry = listenForExpiry();

    await expect(api.get('/gigs')).rejects.toEqual({
      status: null,
      message: 'Connection problem. Please check your network and try again.',
      errors: null
    });

    expect(expiry.handler).not.toHaveBeenCalled();
    expiry.stop();
  });

  it('an error with no message from the server falls back to a safe generic one', async () => {
    fakeServer(() => ({ status: 500, data: {} }));
    await expect(api.get('/gigs')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.'
    });
  });
});

// A tiny page that shows who is logged in and can log out.
function WhoAmI() {
  const { currentUser, logout } = useAuth();
  return (
    <div>
      <p>Hello {currentUser.name}</p>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route path="/session-expired" element={<SessionExpired />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/client/dashboard" element={<WhoAmI />} />
      </Route>
    </Routes>
  );
}

describe('session handling in the app', () => {
  it('a global 401 event sends the user to the Session Expired page', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    authService.getCurrentUser.mockResolvedValue(USERS.CLIENT);
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });
    expect(await screen.findByText('Hello Jane Client')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    });

    expect(await screen.findByText('Your session has expired')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to Login' })).toHaveAttribute('href', '/login');
    expect(screen.queryByText('Hello Jane Client')).toBeNull();
  });

  it('restores the session on page load when a valid token is stored', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    authService.getCurrentUser.mockResolvedValue(USERS.CLIENT);
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });

    expect(screen.getByText('Loading…')).toBeInTheDocument(); // not bounced to login while checking
    expect(await screen.findByText('Hello Jane Client')).toBeInTheDocument();
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('a stored token the server rejects ends up at the login page', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'stale');
    authService.getCurrentUser.mockRejectedValue({ status: 401, message: 'expired' });
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
  });

  it('with no token it goes straight to login without asking the server', async () => {
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it('logging out clears the token and returns to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok');
    authService.getCurrentUser.mockResolvedValue(USERS.CLIENT);
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
