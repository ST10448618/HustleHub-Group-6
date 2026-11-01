import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { TOKEN_STORAGE_KEY } from '../services/api.js';
import { useAuth } from '../context/useAuth.js';
import ProtectedRoute from '../routes/ProtectedRoute.jsx';
import { renderWithRealAuth, USERS } from '../test/renderHelpers.jsx';

vi.mock('../services/authService', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn()
}));

import * as authService from '../services/authService';
import { revokeSession } from '../services/sessionService';

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
      <Route element={<ProtectedRoute />}>
        <Route path="/client/dashboard" element={<WhoAmI />} />
      </Route>
    </Routes>
  );
}

describe('logging out', () => {
  it('asks the server to revoke the token, then clears it and returns to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'tok-abc');
    authService.getCurrentUser.mockResolvedValue(USERS.CLIENT);
    renderWithRealAuth(<AppRoutes />, { route: '/client/dashboard' });

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(revokeSession).toHaveBeenCalledWith('tok-abc');
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});