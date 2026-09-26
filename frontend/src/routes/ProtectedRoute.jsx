import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

/**
 * ProtectedRoute - a "layout route" that guards its children.
 *
 * Usage (React Router's Outlet pattern):
 *   <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
 *     <Route path="/client/dashboard" element={<ClientDashboard />} />
 *   </Route>
 *
 * Three states, checked in order:
 *   1. Still restoring the session (loading) -> show a minimal loading
 *      state rather than flashing a redirect to /login before we
 *      actually know if the user is logged in.
 *   2. Not authenticated at all -> redirect to /login.
 *   3. Authenticated, but allowedRoles was given and this user's role
 *      isn't in it -> redirect to /403.
 * Otherwise, render whatever child route matched via <Outlet />.
 *
 * This is UX only, exactly as the backend contract insists: hiding a
 * route here never replaces the backend's own role/ownership checks,
 * which remain the real security boundary.
 */
function ProtectedRoute({ allowedRoles }) {
  const { authenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-10)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;