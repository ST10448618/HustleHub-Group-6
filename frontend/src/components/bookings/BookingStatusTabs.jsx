import { BOOKING_STATUS_LIST } from '../../utils/constants.js';
import './BookingStatusTabs.css';

const TABS = [
  { value: 'ALL', label: 'All' },
  ...BOOKING_STATUS_LIST.map((status) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase()
  }))
];

/**
 * The All / Confirmed / Completed / Cancelled filter row, with a count
 * on each. There is no Pending tab - that status doesn't exist.
 *
 * Purely a client-side filter control: the list it filters was already
 * fetched in full (GET /bookings takes no parameters). `counts` is an
 * object like { ALL: 4, CONFIRMED: 2, COMPLETED: 1, CANCELLED: 1 }.
 * Reused by the freelancer bookings list in a later phase.
 */
function BookingStatusTabs({ value, onChange, counts }) {
  return (
    <div className="booking-tabs" role="group" aria-label="Filter bookings by status">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            className={`booking-tab${active ? ' booking-tab-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
            <span className="booking-tab-count">{counts[tab.value] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

export default BookingStatusTabs;