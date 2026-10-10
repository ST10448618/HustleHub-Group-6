import { useMemo } from 'react';
import { CalendarCheck, CheckCircle2, PackagePlus, UserPlus, XCircle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import BookingsByStatusChart from '../../components/admin/BookingsByStatusChart.jsx';
import MetricCard from '../../components/common/MetricCard.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { buildAdminActivity, computeAdminStats } from '../../utils/adminStats.js';
import { DASHBOARD_POLL_MS, useAdminDashboardData } from './useAdminDashboardData.js';
import './AdminDashboard.css';

const ACTIVITY_ICONS = {
  user: UserPlus,
  gig: PackagePlus,
  booking: CalendarCheck,
  completed: CheckCircle2,
  cancelled: XCircle
};

/**
 * Screen 22. A live overview of the whole platform, refreshed every 30
 * seconds (and when you switch back to the tab) via React Query. All
 * numbers and the activity feed are derived in the browser from the
 * four lists - see utils/adminStats.js.
 *
 * Loading / error behaviour while polling:
 *   - first load: skeleton, or an error with Retry if nothing arrived
 *   - a LATER refresh that fails: keep showing the last good data and
 *     say so, rather than blanking a dashboard that was working
 */
function AdminDashboard() {
  const {
    users,
    gigs,
    bookings,
    transactions,
    isLoading,
    isFetching,
    hasData,
    error,
    lastUpdated,
    refetchAll
  } = useAdminDashboardData();

  const { stats, activity } = useMemo(
    () => ({
      stats: computeAdminStats({ users, gigs, bookings, transactions }),
      activity: buildAdminActivity({ users, gigs, bookings })
    }),
    [users, gigs, bookings, transactions]
  );

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle={
          hasData
            ? `Last updated ${new Date(lastUpdated).toLocaleTimeString('en-ZA')} · refreshes every ${
                DASHBOARD_POLL_MS / 1000
              } seconds`
            : 'Platform overview'
        }
        actions={
          <Button variant="secondary" onClick={() => refetchAll()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      {isLoading && <LoadingSkeleton count={3} height={110} />}

      {!isLoading && !hasData && error && (
        <ErrorState message={error.message} onRetry={() => refetchAll()} />
      )}

      {hasData && (
        <div className="admin-dashboard">
          {error && (
            <Alert variant="danger">
              Couldn&apos;t refresh just now. Showing the last data that loaded. {error.message}
            </Alert>
          )}

          <div className="admin-dashboard-metrics">
            <MetricCard
              label="Total Users"
              value={stats.users.total}
              accent
              hint={`${stats.users.clients} clients · ${stats.users.freelancers} freelancers · ${stats.users.admins} admin`}
            />
            <MetricCard
              label="Gigs"
              value={stats.gigs.total}
              hint={`${stats.gigs.active} active · ${stats.gigs.inactive} inactive`}
            />
            <MetricCard
              label="Bookings"
              value={stats.bookings.total}
              hint={`${stats.bookings.confirmed} confirmed · ${stats.bookings.completed} completed · ${stats.bookings.cancelled} cancelled`}
            />
            <MetricCard
              label="Platform Volume"
              value={formatCurrency(stats.money.volume)}
              hint={`${formatCurrency(stats.money.deposits)} deposits · ${formatCurrency(stats.money.released)} released`}
            />
          </div>

          <div className="admin-dashboard-columns">
            <BookingsByStatusChart bookings={stats.bookings} />

            <section className="card">
              <h2 className="section-title">Recent Activity</h2>
              {activity.length === 0 ? (
                <p className="admin-dashboard-empty">Nothing has happened yet.</p>
              ) : (
                <ul className="admin-activity-list">
                  {activity.map((event) => {
                    const Icon = ACTIVITY_ICONS[event.kind];
                    return (
                      <li key={event.id} className={`admin-activity-item admin-activity-${event.kind}`}>
                        <Icon size={18} className="admin-activity-icon" aria-hidden="true" />
                        <div>
                          <p className="admin-activity-text">{event.text}</p>
                          <p className="admin-activity-date">{formatDateTime(event.date)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;