import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import { renderWithAuth, USERS } from '../test/renderHelpers.jsx';

function navLabels() {
  const nav = screen.getByRole('navigation', { name: 'Primary' });
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent);
}

describe('Role-aware sidebar', () => {
  it('a CLIENT sees only client items (plus Profile)', () => {
    renderWithAuth(<Sidebar open={false} onClose={() => {}} />, { user: USERS.CLIENT });

    expect(navLabels()).toEqual(['Dashboard', 'My Bookings', 'Browse Gigs', 'Profile']);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/client/dashboard'
    );
  });

  it('a FREELANCER sees the gig, booking and money items', () => {
    renderWithAuth(<Sidebar open={false} onClose={() => {}} />, { user: USERS.FREELANCER });

    expect(navLabels()).toEqual([
      'Dashboard',
      'My Gigs',
      'Bookings',
      'Finances',
      'Transactions',
      'Profile'
    ]);
    expect(screen.getByRole('link', { name: 'Finances' })).toHaveAttribute(
      'href',
      '/freelancer/finances'
    );
  });

  it('an ADMIN sees the platform-wide items', () => {
    renderWithAuth(<Sidebar open={false} onClose={() => {}} />, { user: USERS.ADMIN });

    expect(navLabels()).toEqual(['Dashboard', 'Users', 'Gigs', 'Bookings', 'Transactions', 'Profile']);
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users');
  });

  it('a client never sees freelancer or admin links', () => {
    renderWithAuth(<Sidebar open={false} onClose={() => {}} />, { user: USERS.CLIENT });
    const labels = navLabels();

    for (const forbidden of ['My Gigs', 'Finances', 'Users', 'Transactions']) {
      expect(labels).not.toContain(forbidden);
    }
  });
});

describe('ProtectedRoute guards', () => {
  // Built the way the real app nests it: the guard is a layout route and
  // the page sits inside it.
  function renderGuarded({ user = null, loading = false } = {}) {
    const value = {
      currentUser: user,
      role: user?.role ?? null,
      authenticated: Boolean(user),
      loading
    };

    return render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AuthContext.Provider value={value}>
          <Routes>
            <Route path="/login" element={<p>Login page</p>} />
            <Route path="/403" element={<p>Access denied page</p>} />
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/dashboard" element={<p>Admin secrets</p>} />
            </Route>
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  it('sends a logged-out visitor to /login', () => {
    renderGuarded({ user: null });
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Admin secrets')).toBeNull();
  });

  it('sends the wrong role to /403, never showing the page', () => {
    renderGuarded({ user: USERS.CLIENT });
    expect(screen.getByText('Access denied page')).toBeInTheDocument();
    expect(screen.queryByText('Admin secrets')).toBeNull();
  });

  it('lets the right role through to the page', () => {
    renderGuarded({ user: USERS.ADMIN });
    expect(screen.getByText('Admin secrets')).toBeInTheDocument();
  });

  it('shows "Loading…" (not a login redirect) while the session is being restored', () => {
    renderGuarded({ user: null, loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).toBeNull();
    expect(screen.queryByText('Admin secrets')).toBeNull();
  });
});
