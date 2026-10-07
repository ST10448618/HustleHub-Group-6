import {
  LayoutDashboard,
  CalendarCheck,
  Briefcase,
  Wallet,
  Receipt,
  Users,
  UserCircle,
  Store
} from 'lucide-react';
import { USER_ROLES } from '../../utils/constants';

/**
 * The ONE place the authenticated navigation is defined.
 *
 * Sidebar.jsx reads this config by role - it never hardcodes a
 * per-role list of its own. Adding or renaming a nav item for any
 * role means editing exactly this file.
 *
 * This is UX only. Hiding a link never replaces the backend's own
 * role checks (and ProtectedRoute guards the URLs themselves).
 */
export const NAV_ITEMS_BY_ROLE = {
  [USER_ROLES.CLIENT]: [
    { label: 'Dashboard', to: '/client/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', to: '/client/bookings', icon: CalendarCheck },
    { label: 'Browse Gigs', to: '/marketplace', icon: Store }
  ],
  [USER_ROLES.FREELANCER]: [
    { label: 'Dashboard', to: '/freelancer/dashboard', icon: LayoutDashboard },
    { label: 'My Gigs', to: '/freelancer/gigs', icon: Briefcase },
    { label: 'Bookings', to: '/freelancer/bookings', icon: CalendarCheck },
    { label: 'Finances', to: '/freelancer/finances', icon: Wallet },
    { label: 'Transactions', to: '/freelancer/transactions', icon: Receipt }
  ],
  [USER_ROLES.ADMIN]: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Gigs', to: '/admin/gigs', icon: Briefcase },
    { label: 'Bookings', to: '/admin/bookings', icon: CalendarCheck },
    { label: 'Transactions', to: '/admin/transactions', icon: Receipt }
  ]
};

// Shown to every authenticated role, below the role-specific items.
export const COMMON_NAV_ITEMS = [{ label: 'Profile', to: '/profile', icon: UserCircle }];

// Display labels for the raw role strings the API returns.
export const ROLE_LABELS = {
  [USER_ROLES.CLIENT]: 'Client',
  [USER_ROLES.FREELANCER]: 'Freelancer',
  [USER_ROLES.ADMIN]: 'Admin'
};