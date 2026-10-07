import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import PagePlaceholder from '../pages/PagePlaceholder.jsx';
import ClientDashboard from '../pages/client/ClientDashboard.jsx';
import ClientBookings from '../pages/client/ClientBookings.jsx';
import ClientBookingDetails from '../pages/client/ClientBookingDetails.jsx';

import Landing from '../pages/public/Landing.jsx';
import Marketplace from '../pages/public/Marketplace.jsx';
import GigDetails from '../pages/public/GigDetails.jsx';
import Login from '../pages/public/Login.jsx';
import Register from '../pages/public/Register.jsx';
import SessionExpired from '../pages/public/SessionExpired.jsx';
import Forbidden from '../pages/Forbidden.jsx';
import NotFound from '../pages/NotFound.jsx';

/**
 * The whole route table (build reference section 7), in one file.
 *
 * Three layers, outermost first, for every authenticated screen:
 *   ProtectedRoute  -> is anyone logged in, and is their role allowed?
 *   AppShell        -> the Sidebar + Topbar frame
 *   <the page>      -> rendered in the shell's content area
 * So a page only ever renders after the auth/role check has passed.
 *
 * Screens a later phase builds are mounted as <PagePlaceholder> at
 * their final route. That phase swaps in the real page; the route
 * itself never changes.
 *
 * Unknown URLs redirect to /404, per the build reference.
 */
function AppRoutes() {
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/gigs/:id" element={<GigDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/404" element={<NotFound />} />

        {/* CLIENT */}
        <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]} />}>
          <Route element={<AppShell />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/bookings" element={<ClientBookings />} />
            <Route path="/client/bookings/:id" element={<ClientBookingDetails />} />
          </Route>
        </Route>

        {/* FREELANCER */}
        <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.FREELANCER]} />}>
          <Route element={<AppShell />}>
            <Route
              path="/freelancer/dashboard"
              element={<PagePlaceholder title="Freelancer Dashboard" phase={10} />}
            />
            <Route
              path="/freelancer/gigs"
              element={<PagePlaceholder title="My Gigs" phase={8} />}
            />
            <Route
              path="/freelancer/gigs/create"
              element={<PagePlaceholder title="Create Gig" phase={8} />}
            />
            <Route
              path="/freelancer/gigs/:id"
              element={<PagePlaceholder title="Gig Details" phase={8} />}
            />
            <Route
              path="/freelancer/gigs/:id/edit"
              element={<PagePlaceholder title="Edit Gig" phase={8} />}
            />
            <Route
              path="/freelancer/bookings"
              element={<PagePlaceholder title="Bookings" phase={9} />}
            />
            <Route
              path="/freelancer/bookings/:id"
              element={<PagePlaceholder title="Booking Details" phase={9} />}
            />
            <Route
              path="/freelancer/finances"
              element={<PagePlaceholder title="Finances" phase={10} />}
            />
            <Route
              path="/freelancer/transactions"
              element={<PagePlaceholder title="Transactions" phase={10} />}
            />
            <Route
              path="/freelancer/transactions/:id"
              element={<PagePlaceholder title="Transaction Details" phase={10} />}
            />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
          <Route element={<AppShell />}>
            <Route
              path="/admin/dashboard"
              element={<PagePlaceholder title="Admin Dashboard" phase={11} />}
            />
            <Route
              path="/admin/users"
              element={<PagePlaceholder title="Users" phase={12} />}
            />
            <Route
              path="/admin/users/:id"
              element={<PagePlaceholder title="User Details" phase={12} />}
            />
            <Route
              path="/admin/gigs"
              element={<PagePlaceholder title="Gigs" phase={12} />}
            />
            <Route
              path="/admin/gigs/:id"
              element={<PagePlaceholder title="Gig Details" phase={12} />}
            />
            <Route
              path="/admin/bookings"
              element={<PagePlaceholder title="Bookings" phase={12} />}
            />
            <Route
              path="/admin/bookings/:id"
              element={<PagePlaceholder title="Booking Details" phase={12} />}
            />
            <Route
              path="/admin/transactions"
              element={<PagePlaceholder title="Transactions" phase={12} />}
            />
            <Route
              path="/admin/transactions/:id"
              element={<PagePlaceholder title="Transaction Details" phase={12} />}
            />
          </Route>
        </Route>

        {/* Any authenticated role */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<PagePlaceholder title="Profile" phase={13} />} />
          </Route>
        </Route>

        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default AppRoutes;