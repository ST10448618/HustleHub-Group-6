import { useContext } from 'react';
import { AuthContext } from './AuthContext.jsx';

/**
 * useAuth() - the only way any component should read or act on auth
 * state. Throws loudly if used outside an AuthProvider, rather than
 * silently returning undefined and causing a confusing crash three
 * lines further down in whatever component forgot to check.
 *
 * Kept in its own file (rather than alongside AuthProvider in
 * AuthContext.jsx) purely so Vite's Fast Refresh can reliably
 * hot-reload component files - a file that exports both a component
 * and a plain hook/function breaks that optimization, which is what
 * Oxlint's react/only-export-components rule flags. No behavior
 * change, just a cleaner split.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}