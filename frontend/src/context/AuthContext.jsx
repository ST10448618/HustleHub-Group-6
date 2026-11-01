import { createContext, startTransition, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import { TOKEN_STORAGE_KEY, SESSION_EXPIRED_EVENT } from '../services/api';
import { revokeSession } from '../services/sessionService';

const AuthContext = createContext(undefined);
export { AuthContext };

/**
 * AuthProvider - the Context + Provider pattern.
 *
 * Wraps the whole app (see main.jsx) and is the single source of
 * truth for "who is logged in right now." No component anywhere
 * reads localStorage's token directly, or calls authService directly
 * for its own auth state - everything goes through useAuth() below.
 *
 * Must be rendered INSIDE a Router (see main.jsx: BrowserRouter wraps
 * AuthProvider, not the other way around) because it uses useNavigate
 * to redirect on logout and on a global session-expiry event.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const navigate = useNavigate();

  const restoreSession = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * The other half of the Observer pattern started in services/api.js:
   * that file fires this event on window the moment ANY request comes
   * back 401. This is the one and only place that event is listened
   * for - no individual page ever needs to check for a 401 itself.
   */
  useEffect(() => {
    function handleSessionExpired() {
      // Both changes must be applied TOGETHER. React Router applies a
      // navigation inside a transition, so if only navigate() were in
      // one, clearing the user would render first and ProtectedRoute
      // would bounce straight to /login: the Session Expired page
      // would never be shown.
      startTransition(() => {
        setCurrentUser(null);
        navigate('/session-expired', { replace: true });
      });
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const { token, user } = await authService.login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setCurrentUser(user);
    return user;
  }, []);

  /**
   * Backend reality: POST /auth/register never returns a token, by
   * design. This calls register(), then immediately calls login()
   * with the same credentials - the user never has to retype anything
   * or see a separate "please log in now" step.
   */
  const registerThenLogin = useCallback(
    async ({ name, email, password, role }) => {
      await authService.register({ name, email, password, role });
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    revokeSession(localStorage.getItem(TOKEN_STORAGE_KEY));
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setCurrentUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    currentUser,
    role: currentUser?.role ?? null,
    authenticated: Boolean(currentUser),
    loading,
    login,
    registerThenLogin,
    logout,
    restoreSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}