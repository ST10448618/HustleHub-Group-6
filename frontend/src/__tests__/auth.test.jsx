import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import { renderWithRealAuth, USERS } from '../test/renderHelpers.jsx';

vi.mock('../services/authService', () => ({
  register: vi.fn(),
  login: vi.fn(),
  getCurrentUser: vi.fn()
}));

import * as authService from '../services/authService';

// The real AuthProvider runs; only the network (authService) is faked.
function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/client/dashboard" element={<p>Client dashboard page</p>} />
      <Route path="/freelancer/dashboard" element={<p>Freelancer dashboard page</p>} />
    </Routes>
  );
}

describe('Login', () => {
  async function fillAndSubmit(user, email = 'jane@example.com', password = 'Password1') {
    await user.type(screen.getByLabelText('Email'), email);
    await user.type(screen.getByLabelText('Password'), password);
    await user.click(screen.getByRole('button', { name: 'Log In' }));
  }

  it('logs in, stores the token and lands on the role dashboard', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ token: 'tok-123', user: USERS.CLIENT });
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    await fillAndSubmit(user);

    expect(await screen.findByText('Client dashboard page')).toBeInTheDocument();
    expect(authService.login).toHaveBeenCalledWith('jane@example.com', 'Password1');
    expect(localStorage.getItem('hustlehub_token')).toBe('tok-123');
  });

  it('sends a freelancer to the freelancer dashboard', async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ token: 't', user: USERS.FREELANCER });
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    await fillAndSubmit(user, 'alex@example.com');

    expect(await screen.findByText('Freelancer dashboard page')).toBeInTheDocument();
  });

  it("a 401 shows the backend's generic message and logs nobody in", async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue({
      status: 401,
      message: 'Invalid email or password',
      errors: null
    });
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    await fillAndSubmit(user, 'jane@example.com', 'WrongPass1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: 'Log In' })).toBeEnabled();
    expect(localStorage.getItem('hustlehub_token')).toBeNull();
    expect(screen.queryByText('Client dashboard page')).toBeNull();
  });

  it('shows a rate-limit (429) message exactly as the backend wrote it', async () => {
    const user = userEvent.setup();
    authService.login.mockRejectedValue({
      status: 429,
      message: 'Too many attempts, please try again later.',
      errors: null
    });
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts, please try again later.'
    );
  });

  it('disables the button while logging in, to prevent double submits', async () => {
    const user = userEvent.setup();
    authService.login.mockReturnValue(new Promise(() => {})); // never resolves
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    await fillAndSubmit(user);

    const button = await screen.findByRole('button', { name: 'Logging in…' });
    expect(button).toBeDisabled();
  });

  it('the eye button shows and hides the password', async () => {
    const user = userEvent.setup();
    renderWithRealAuth(<AuthRoutes />, { route: '/login' });

    const field = screen.getByLabelText('Password');
    expect(field).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field).toHaveAttribute('type', 'password');
  });
});

describe('Register', () => {
  async function fillForm(user, overrides = {}) {
    const values = {
      name: 'New Person',
      email: 'new@example.com',
      password: 'Password1',
      confirm: 'Password1',
      ...overrides
    };
    if (values.name) await user.type(screen.getByLabelText('Full Name'), values.name);
    if (values.email) await user.type(screen.getByLabelText('Email'), values.email);
    if (values.password) await user.type(screen.getByLabelText('Password'), values.password);
    if (values.confirm) await user.type(screen.getByLabelText('Confirm Password'), values.confirm);
  }

  it('validates on the client and never calls the server when invalid', async () => {
    const user = userEvent.setup();
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Please provide a valid email')).toBeInTheDocument();
    expect(screen.getByText('Password needs: at least 8 characters')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('names the first password rule that is not met', async () => {
    const user = userEvent.setup();
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user, { password: 'alllowercase1', confirm: 'alllowercase1' });
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Password needs: one uppercase letter')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup();
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user, { confirm: 'Different1' });
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('offers only Client and Freelancer - there is no way to register as an admin', () => {
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios.map((radio) => radio.value).sort()).toEqual(['CLIENT', 'FREELANCER']);
    expect(screen.getByLabelText('Hire Freelancers')).toBeChecked();
  });

  it('registers THEN logs in automatically with the same credentials', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValue(USERS.CLIENT);
    authService.login.mockResolvedValue({ token: 'new-token', user: USERS.CLIENT });
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Client dashboard page')).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith({
      name: 'New Person',
      email: 'new@example.com',
      password: 'Password1',
      role: 'CLIENT'
    });
    expect(authService.login).toHaveBeenCalledWith('new@example.com', 'Password1');
    // register must happen before login (there is no token from register)
    expect(authService.register.mock.invocationCallOrder[0]).toBeLessThan(
      authService.login.mock.invocationCallOrder[0]
    );
    expect(localStorage.getItem('hustlehub_token')).toBe('new-token');
  });

  it('registers a freelancer and lands on the freelancer dashboard', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValue(USERS.FREELANCER);
    authService.login.mockResolvedValue({ token: 't', user: USERS.FREELANCER });
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user);
    await user.click(screen.getByLabelText('Offer Freelance Services'));
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Freelancer dashboard page')).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'FREELANCER' })
    );
  });

  it('a duplicate email (409) shows the backend message and does not try to log in', async () => {
    const user = userEvent.setup();
    authService.register.mockRejectedValue({
      status: 409,
      message: 'An account with this email already exists',
      errors: null
    });
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'An account with this email already exists'
    );
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('shows backend field errors under the matching input', async () => {
    const user = userEvent.setup();
    authService.register.mockRejectedValue({
      status: 400,
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'Email domain is not allowed' }]
    });
    renderWithRealAuth(<AuthRoutes />, { route: '/register' });

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(screen.getByText('Email domain is not allowed')).toBeInTheDocument()
    );
    expect(authService.login).not.toHaveBeenCalled();
  });
});
