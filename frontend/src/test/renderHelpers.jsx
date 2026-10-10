import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastProvider.jsx';
import { AuthContext, AuthProvider } from '../context/AuthContext.jsx';

/**
 * Ready-made people for tests, one per role.
 */
export const USERS = {
  CLIENT: {
    id: 'u-client',
    name: 'Jane Client',
    email: 'jane@example.com',
    role: 'CLIENT',
    createdAt: '2026-01-01T10:00:00.000Z'
  },
  FREELANCER: {
    id: 'u-freelancer',
    name: 'Alex Freelancer',
    email: 'alex@example.com',
    role: 'FREELANCER',
    createdAt: '2026-01-02T10:00:00.000Z'
  },
  ADMIN: {
    id: 'u-admin',
    name: 'Root Admin',
    email: 'root@example.com',
    role: 'ADMIN',
    createdAt: '2025-12-01T10:00:00.000Z'
  }
};

/**
 * Renders a page inside a router, the toast provider and a FAKE auth
 * context, so a test can say "as a client" or "logged out" in one
 * line without going through a real login.
 *
 *   route       the address to start on (default '/')
 *   path        the route pattern the page is mounted on (default '*')
 *   user        a USERS entry, or null for logged out
 *   loading     pretend the session is still being restored
 *   extraRoutes [{ path, element }] other pages the test may navigate to
 */
export function renderWithAuth(
  ui,
  { route = '/', path = '*', user = null, loading = false, extraRoutes = [] } = {}
) {
  const value = {
    currentUser: user,
    role: user?.role ?? null,
    authenticated: Boolean(user),
    loading,
    login: () => {},
    registerThenLogin: () => {},
    logout: () => {},
    restoreSession: () => {}
  };

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthContext.Provider value={value}>
          <Routes>
            <Route path={path} element={ui} />
            {extraRoutes.map((extra) => (
              <Route key={extra.path} path={extra.path} element={extra.element} />
            ))}
          </Routes>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}

/**
 * Renders routes inside the REAL AuthProvider (login, register,
 * session restore and logout actually run). Only the network layer -
 * authService - is expected to be mocked by the test.
 */
export function renderWithRealAuth(routes, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider>{routes}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}
