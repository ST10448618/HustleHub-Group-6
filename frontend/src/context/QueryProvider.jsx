import { useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth.js';

/**
 * The app-wide React Query setup.
 *
 * React Query is used in exactly one place by design (the Admin
 * Dashboard's 30-second polling - see pages/admin/useAdminDashboardData.js);
 * every other screen fetches with a plain useEffect. It lives here
 * once so that screen, and any future one, shares one cache.
 *
 * Retry rule: a failed request is retried once, but only for
 * network / server problems. A 4xx (a 401 session expiry, a 403, a
 * 404 ...) is a definite answer and retrying it would just repeat it.
 * (The 401 itself is already handled globally by services/api.js.)
 */
function shouldRetry(failureCount, error) {
  const status = error?.status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < 1;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 5000
    }
  }
});

/**
 * Wipes every cached response when nobody is logged in. Without this,
 * data fetched for one account (an admin's user list, say) would stay
 * in memory after logout and could flash on screen for the next
 * person who logs in on the same browser tab.
 */
function ClearCacheOnLogout() {
  const client = useQueryClient();
  const { authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) {
      client.clear();
    }
  }, [authenticated, client]);

  return null;
}

/**
 * Must sit INSIDE AuthProvider (it reads the login state).
 */
function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClearCacheOnLogout />
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;