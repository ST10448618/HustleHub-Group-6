import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { USER_ROLES } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary.jsx';
import PagePlaceholder from '../pages/PagePlaceholder.jsx';
import ClientDashboard from '../pages/client/ClientDashboard.jsx';
import ClientBookings from '../pages/client/ClientBookings.jsx';
import ClientBookingDetails from '../pages/client/ClientBookingDetails.jsx';
import MyGigs from '../pages/freelancer/MyGigs.jsx';
import CreateGig from '../pages/freelancer/CreateGig.jsx';
import EditGig from '../pages/freelancer/EditGig.jsx';
import FreelancerGigDetails from '../pages/freelancer/FreelancerGigDetails.jsx';
import FreelancerBookings from '../pages/freelancer/FreelancerBookings.jsx';
import FreelancerBookingDetails from '../pages/freelancer/FreelancerBookingDetails.jsx';
import FreelancerDashboard from '../pages/freelancer/FreelancerDashboard.jsx';
import Finances from '../pages/freelancer/Finances.jsx';
import Transactions from '../pages/freelancer/Transactions.jsx';
import TransactionDetails from '../pages/freelancer/TransactionDetails.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminUserDetails from '../pages/admin/AdminUserDetails.jsx';
import AdminGigs from '../pages/admin/AdminGigs.jsx';
import AdminGigDetails from '../pages/admin/AdminGigDetails.jsx';
import AdminBookings from '../pages/admin/AdminBookings.jsx';
import AdminBookingDetails from '../pages/admin/AdminBookingDetails.jsx';
import AdminTransactions from '../pages/admin/AdminTransactions.jsx';
import AdminTransactionDetails from '../pages/admin/AdminTransactionDetails.jsx';
import Profile from '../pages/Profile.jsx';

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
            <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
            <Route path="/freelancer/gigs" element={<MyGigs />} />
            <Route path="/freelancer/gigs/create" element={<CreateGig />} />
            <Route path="/freelancer/gigs/:id" element={<FreelancerGigDetails />} />
            <Route path="/freelancer/gigs/:id/edit" element={<EditGig />} />
            <Route path="/freelancer/bookings" element={<FreelancerBookings />} />
            <Route path="/freelancer/bookings/:id" element={<FreelancerBookingDetails />} />
            <Route path="/freelancer/finances" element={<Finances />} />
            <Route path="/freelancer/transactions" element={<Transactions />} />
            <Route path="/freelancer/transactions/:id" element={<TransactionDetails />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]} />}>
          <Route element={<AppShell />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:id" element={<AdminUserDetails />} />
            <Route path="/admin/gigs" element={<AdminGigs />} />
            <Route path="/admin/gigs/:id" element={<AdminGigDetails />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/bookings/:id" element={<AdminBookingDetails />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/transactions/:id" element={<AdminTransactionDetails />} />
          </Route>
        </Route>

        {/* Any authenticated role */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
          <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/settings" element={<Navigate to="/profile" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default AppRoutes;