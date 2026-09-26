import { USER_ROLES } from '../utils/constants';

/**
 * Returns the correct default landing route for a given role, right
 * after a successful login or registration. Kept as one small, named
 * function - rather than repeating this switch statement in both
 * Login.jsx AND Register.jsx - so the three dashboard paths are only
 * ever spelled out once, in one place.
 */
export function getDashboardPathForRole(role) {
  switch (role) {
    case USER_ROLES.CLIENT:
      return '/client/dashboard';
    case USER_ROLES.FREELANCER:
      return '/freelancer/dashboard';
    case USER_ROLES.ADMIN:
      return '/admin/dashboard';
    default:
      return '/';
  }
}