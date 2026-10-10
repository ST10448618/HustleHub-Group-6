import { useQuery } from '@tanstack/react-query';
import { getUsers, getAllGigs } from '../../services/adminService.js';
import { getMyBookings } from '../../services/bookingService.js';
import { getTransactions } from '../../services/transactionService.js';

/**
 * The Admin Dashboard's four requests, polled together every 30
 * seconds - the one place in the app that polls.
 *
 *   GET /admin/users, GET /admin/gigs   (admin-only endpoints)
 *   GET /bookings, GET /transactions    (the same endpoints everyone
 *       uses: with an ADMIN token the backend returns EVERYTHING)
 *
 * Why React Query rather than a hand-written setInterval: with
 * `refetchIntervalInBackground` left off, it pauses polling while the
 * browser tab is hidden and catches up when you return, and it
 * de-duplicates and cancels in-flight requests for us. The 30-second
 * interval is also the floor - nothing here ever polls faster.
 */
export const DASHBOARD_POLL_MS = 30000;

const POLLING = { refetchInterval: DASHBOARD_POLL_MS, refetchIntervalInBackground: false };

export function useAdminDashboardData() {
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: getUsers, ...POLLING });
  const gigs = useQuery({ queryKey: ['admin', 'gigs'], queryFn: getAllGigs, ...POLLING });
  const bookings = useQuery({ queryKey: ['admin', 'bookings'], queryFn: getMyBookings, ...POLLING });
  const transactions = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: getTransactions,
    ...POLLING
  });

  const queries = [users, gigs, bookings, transactions];
  const hasData = queries.every((query) => query.data !== undefined);

  return {
    users: users.data ?? [],
    gigs: gigs.data ?? [],
    bookings: bookings.data ?? [],
    transactions: transactions.data ?? [],
    // True only for the very first load, before there is anything to show.
    isLoading: !hasData && queries.some((query) => query.isPending),
    // True during every request, including background polls.
    isFetching: queries.some((query) => query.isFetching),
    hasData,
    error: queries.find((query) => query.error)?.error ?? null,
    lastUpdated: hasData ? Math.max(...queries.map((query) => query.dataUpdatedAt)) : null,
    refetchAll: () => Promise.all(queries.map((query) => query.refetch()))
  };
}