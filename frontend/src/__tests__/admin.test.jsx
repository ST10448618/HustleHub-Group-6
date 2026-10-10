/**
 * Admin screens (Phases 12-13): gigs, bookings, transactions and the
 * read-only profile. Real components, mocked service layer.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastProvider.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

vi.mock('../services/adminService.js', () => ({ getUsers: vi.fn(), getUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn(), getAllGigs: vi.fn() }));
vi.mock('../services/bookingService.js', () => ({ getMyBookings: vi.fn(), getBooking: vi.fn(), cancelBooking: vi.fn(), completeBooking: vi.fn(), createBooking: vi.fn() }));
vi.mock('../services/transactionService.js', () => ({ getTransactions: vi.fn(), getTransaction: vi.fn() }));
vi.mock('../services/gigService.js', () => ({ getGig: vi.fn(), updateGig: vi.fn(), deleteGig: vi.fn(), getGigs: vi.fn(), getMyGigs: vi.fn(), createGig: vi.fn() }));

import * as admin from '../services/adminService.js';
import * as bookingSvc from '../services/bookingService.js';
import * as txSvc from '../services/transactionService.js';
import * as gigSvc from '../services/gigService.js';
import AdminGigs from '../pages/admin/AdminGigs.jsx';
import AdminGigDetails from '../pages/admin/AdminGigDetails.jsx';
import AdminBookings from '../pages/admin/AdminBookings.jsx';
import AdminBookingDetails from '../pages/admin/AdminBookingDetails.jsx';
import AdminTransactions from '../pages/admin/AdminTransactions.jsx';
import AdminTransactionDetails from '../pages/admin/AdminTransactionDetails.jsx';
import Profile from '../pages/Profile.jsx';

const FUTURE = '2999-01-01T00:00:00.000Z';
const PAST = '2020-01-01T00:00:00.000Z';
const mkGig = (o = {}) => ({ id: 'g1', freelancerId: 'u2', freelancer: { id: 'u2', name: 'Alex Freelancer' }, title: 'Custom Website', description: 'Desc', category: 'Software', price: 2500, depositAmount: 500, status: 'ACTIVE', createdAt: '2026-01-05T10:00:00Z', ...o });
const mkBooking = (o = {}) => ({ id: 'b1', gigId: 'g1', clientId: 'u1', freelancerId: 'u2', bookingDate: FUTURE, amount: 2500, depositAmount: 500, remainingAmount: 2000, status: 'CONFIRMED', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z', gig: { id: 'g1', title: 'Custom Website' }, client: { id: 'u1', name: 'Jane Client' }, freelancer: { id: 'u2', name: 'Alex Freelancer' }, ...o });
const txs = [
  { id: 'aaaaaaaaaaaaaaaaaaaa0001', bookingId: 'b1', type: 'DEPOSIT', amount: 500, status: 'PAID', createdAt: '2026-03-01T10:00:00Z' },
  { id: 'aaaaaaaaaaaaaaaaaaaa0002', bookingId: 'b1', type: 'REMAINDER', amount: 2000, status: 'PAID', createdAt: '2026-03-05T10:00:00Z' },
  { id: 'aaaaaaaaaaaaaaaaaaaa0003', bookingId: 'b9', type: 'DEPOSIT', amount: 999, status: 'CANCELLED', createdAt: '2026-03-06T10:00:00Z' }
];
const adminUser = { id: 'u3', role: 'ADMIN', name: 'Root Admin', email: 'root@x.com', createdAt: '2025-12-01T10:00:00Z' };

function renderAt(path, element, routePath = '*', user = adminUser) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthContext.Provider value={{ currentUser: user, role: user.role, authenticated: true, loading: false }}>
          <Routes><Route path={routePath} element={element} /></Routes>
        </AuthContext.Provider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('Admin Gigs (25)', () => {
  beforeEach(() => admin.getAllGigs.mockResolvedValue([mkGig(), mkGig({ id: 'g2', title: 'Old Logo', category: 'Design', status: 'INACTIVE', freelancer: { id: 'u5', name: 'Sam Maker' } })]));
  it('shows inactive gigs too, and filters by status / category / search', async () => {
    const user = userEvent.setup();
    renderAt('/admin/gigs', <AdminGigs />);
    expect(await screen.findByText('Old Logo')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Inactive')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by statuses'), 'INACTIVE');
    expect(screen.queryByText('Custom Website')).toBeNull();
    expect(screen.getByText('Showing 1 of 2 gigs')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by statuses'), '');
    await user.selectOptions(screen.getByLabelText('Filter by categories'), 'Software');
    expect(screen.queryByText('Old Logo')).toBeNull();
    await user.selectOptions(screen.getByLabelText('Filter by categories'), '');
    await user.type(screen.getByLabelText('Search gigs'), 'sam');
    expect(screen.getByText('Old Logo')).toBeInTheDocument();
    expect(screen.queryByText('Custom Website')).toBeNull();
  });
});

describe('Admin Gig Details (26)', () => {
  beforeEach(() => { gigSvc.getGig.mockResolvedValue(mkGig()); bookingSvc.getMyBookings.mockResolvedValue([mkBooking(), mkBooking({ id: 'bX', gigId: 'other' })]); });
  it("lists only this gig's bookings; Edit links to ?edit=1", async () => {
    renderAt('/admin/gigs/g1', <AdminGigDetails />, '/admin/gigs/:id');
    await screen.findByText('Bookings for this gig (1)');
    expect(screen.getByRole('link', { name: 'Edit Gig' })).toHaveAttribute('href', '/admin/gigs/g1?edit=1');
  });
  it('?edit=1 shows the form and saving calls PUT /gigs/:id, then returns to details', async () => {
    const user = userEvent.setup();
    gigSvc.updateGig.mockResolvedValue(mkGig({ title: 'New Title' }));
    renderAt('/admin/gigs/g1?edit=1', <AdminGigDetails />, '/admin/gigs/:id');
    const title = await screen.findByLabelText('Title');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await user.clear(title); await user.type(title, 'New Title');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(gigSvc.updateGig).toHaveBeenCalledWith('g1', expect.objectContaining({ title: 'New Title', price: 2500, depositAmount: 500 })));
    expect(await screen.findByText('Gig updated.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'New Title' })).toBeInTheDocument();
  });
  it('Delete flips the gig to inactive and removes the Delete button', async () => {
    const user = userEvent.setup();
    gigSvc.deleteGig.mockResolvedValue(mkGig({ status: 'INACTIVE' }));
    renderAt('/admin/gigs/g1', <AdminGigDetails />, '/admin/gigs/:id');
    await user.click(await screen.findByRole('button', { name: 'Delete Gig' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete Gig' }));
    await waitFor(() => expect(gigSvc.deleteGig).toHaveBeenCalledWith('g1'));
    expect(await screen.findByText(/This gig is inactive/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Gig' })).toBeNull();
  });
  it('404 shows "Gig not found" with a way back', async () => {
    gigSvc.getGig.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }));
    renderAt('/admin/gigs/zzz', <AdminGigDetails />, '/admin/gigs/:id');
    expect(await screen.findByText('Gig not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Gigs' })).toBeInTheDocument();
  });
});

describe('Admin Bookings (27)', () => {
  beforeEach(() => bookingSvc.getMyBookings.mockResolvedValue([
    mkBooking({ id: 'b1' }),
    mkBooking({ id: 'b2', status: 'COMPLETED', bookingDate: PAST, gig: { id: 'g2', title: 'Logo Design' }, client: { id: 'u9', name: 'Zed Client' } }),
    mkBooking({ id: 'b3', status: 'CANCELLED', gig: { id: 'g3', title: 'SEO Audit' } })
  ]));
  it('status tabs show counts and filter; date filter and search work', async () => {
    const user = userEvent.setup();
    renderAt('/admin/bookings', <AdminBookings />);
    await screen.findByText('Showing 3 of 3 bookings');
    const tabs = screen.getByRole('group', { name: 'Filter bookings by status' });
    expect(within(tabs).getByRole('button', { name: /^All\s*3$/ })).toBeInTheDocument();
    await user.click(within(tabs).getByRole('button', { name: /^Completed/ }));
    expect(screen.getByText('Showing 1 of 1 bookings')).toBeInTheDocument();
    expect(screen.getByText('Logo Design')).toBeInTheDocument();
    await user.click(within(tabs).getByRole('button', { name: /^All/ }));
    await user.selectOptions(screen.getByLabelText('Filter by service dates'), 'reached');
    expect(screen.getByText('Showing 1 of 3 bookings')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by service dates'), '');
    await user.type(screen.getByLabelText('Search bookings'), 'zed');
    expect(screen.getByText('Showing 1 of 3 bookings')).toBeInTheDocument();
  });
});

describe('Admin Booking Details (28)', () => {
  it('future booking: Complete disabled with hint; Cancel available', async () => {
    bookingSvc.getBooking.mockResolvedValue(mkBooking());
    renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    expect(await screen.findByRole('button', { name: 'Mark as Complete' })).toBeDisabled();
    expect(screen.getByText(/Completion is available from/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Booking' })).toBeEnabled();
  });
  it('due booking: dialog shows exact remaining amount; completing updates the page', async () => {
    const user = userEvent.setup();
    bookingSvc.getBooking.mockResolvedValue(mkBooking({ bookingDate: PAST }));
    bookingSvc.completeBooking.mockResolvedValue(mkBooking({ bookingDate: PAST, status: 'COMPLETED' }));
    renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    await user.click(await screen.findByRole('button', { name: 'Mark as Complete' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/remaining R2,000 will be released to Alex Freelancer/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Complete Booking' }));
    await waitFor(() => expect(bookingSvc.completeBooking).toHaveBeenCalledWith('b1'));
    expect(await screen.findByText('Booking completed. R2,000 released.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as Complete' })).toBeNull();
  });
  it('"Not Yet" changes nothing', async () => {
    const user = userEvent.setup();
    bookingSvc.getBooking.mockResolvedValue(mkBooking({ bookingDate: PAST }));
    renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    await user.click(await screen.findByRole('button', { name: 'Mark as Complete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Not Yet' }));
    expect(bookingSvc.completeBooking).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('cancel uses admin wording and calls the cancel endpoint', async () => {
    const user = userEvent.setup();
    bookingSvc.getBooking.mockResolvedValue(mkBooking());
    bookingSvc.cancelBooking.mockResolvedValue(mkBooking({ status: 'CANCELLED' }));
    renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    await user.click(await screen.findByRole('button', { name: 'Cancel Booking' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/client's deposit will be retained/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel Booking' }));
    await waitFor(() => expect(bookingSvc.cancelBooking).toHaveBeenCalledWith('b1'));
    expect(await screen.findByText('Booking cancelled. The deposit was retained.')).toBeInTheDocument();
  });
  it("shows the backend's message if it refuses (e.g. date not reached)", async () => {
    const user = userEvent.setup();
    bookingSvc.getBooking.mockResolvedValue(mkBooking({ bookingDate: PAST }));
    bookingSvc.completeBooking.mockRejectedValue(Object.assign(new Error('Booking cannot be completed before the booking date'), { status: 400 }));
    renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    await user.click(await screen.findByRole('button', { name: 'Mark as Complete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Complete Booking' }));
    expect(await screen.findByText('Booking cannot be completed before the booking date')).toBeInTheDocument();
  });
  it('a COMPLETED booking offers no actions; unknown id shows "Booking not found"', async () => {
    bookingSvc.getBooking.mockResolvedValue(mkBooking({ status: 'COMPLETED' }));
    const { unmount } = renderAt('/admin/bookings/b1', <AdminBookingDetails />, '/admin/bookings/:id');
    await screen.findByRole('heading', { name: 'Custom Website' });
    expect(screen.queryByRole('button', { name: 'Cancel Booking' })).toBeNull();
    unmount();
    bookingSvc.getBooking.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }));
    renderAt('/admin/bookings/zzz', <AdminBookingDetails />, '/admin/bookings/:id');
    expect(await screen.findByText('Booking not found')).toBeInTheDocument();
  });
});

describe('Admin Transactions (29)', () => {
  it('joins names from bookings with ONE extra request; totals count PAID only', async () => {
    txSvc.getTransactions.mockResolvedValue(txs);
    bookingSvc.getMyBookings.mockResolvedValue([mkBooking()]);
    renderAt('/admin/transactions', <AdminTransactions />);
    await screen.findByText('Showing 3 of 3 transactions');
    expect(bookingSvc.getMyBookings).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('Jane Client').length).toBe(2);
    expect(within(screen.getByRole('table')).getAllByText('Remaining Payment').length).toBe(1);
    const volume = screen.getByText('Payments Processed').closest('.metric-card');
    expect(within(volume).getByText('R2,500')).toBeInTheDocument(); // 500 + 2000, NOT +999 cancelled
  });
  it('type filter and reference search work', async () => {
    const user = userEvent.setup();
    txSvc.getTransactions.mockResolvedValue(txs);
    bookingSvc.getMyBookings.mockResolvedValue([mkBooking()]);
    renderAt('/admin/transactions', <AdminTransactions />);
    await screen.findByText('Showing 3 of 3 transactions');
    await user.selectOptions(screen.getByLabelText('Filter by types'), 'REMAINDER');
    expect(screen.getByText('Showing 1 of 3 transactions')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Filter by types'), '');
    await user.type(screen.getByLabelText('Search transactions'), 'AAAA0003');
    expect(screen.getByText('Showing 1 of 3 transactions')).toBeInTheDocument();
  });
  it('still works with dashes + a notice when bookings fail to load', async () => {
    txSvc.getTransactions.mockResolvedValue(txs);
    bookingSvc.getMyBookings.mockRejectedValue(new Error('x'));
    renderAt('/admin/transactions', <AdminTransactions />);
    expect(await screen.findByText(/couldn't be loaded just now/)).toBeInTheDocument();
    expect(screen.getByText('#AAAA0001')).toBeInTheDocument();
  });
  it('shows an error with Retry if the transactions themselves fail', async () => {
    txSvc.getTransactions.mockRejectedValue(new Error('Server down'));
    bookingSvc.getMyBookings.mockResolvedValue([]);
    renderAt('/admin/transactions', <AdminTransactions />);
    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});

describe('Admin Transaction Details (30)', () => {
  it('shows amount, names and a booking link; read-only (no buttons)', async () => {
    txSvc.getTransaction.mockResolvedValue(txs[1]);
    bookingSvc.getBooking.mockResolvedValue(mkBooking());
    renderAt('/admin/transactions/t2', <AdminTransactionDetails />, '/admin/transactions/:id');
    await screen.findByRole('heading', { name: 'Remaining Payment' });
    expect(within(screen.getByText('Amount').closest('.metric-card')).getByText('R2,000')).toBeInTheDocument();
    expect(screen.getByText('Jane Client')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View booking' })).toHaveAttribute('href', '/admin/bookings/b1');
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('works with dashes if the booking lookup fails; 404 shows not found', async () => {
    txSvc.getTransaction.mockResolvedValue(txs[0]);
    bookingSvc.getBooking.mockRejectedValue(new Error('x'));
    const { unmount } = renderAt('/admin/transactions/t1', <AdminTransactionDetails />, '/admin/transactions/:id');
    await screen.findByRole('heading', { name: 'Deposit' });
    expect(screen.getAllByText('—').length).toBe(3);
    unmount();
    txSvc.getTransaction.mockRejectedValue(Object.assign(new Error('x'), { status: 404 }));
    renderAt('/admin/transactions/zzz', <AdminTransactionDetails />, '/admin/transactions/:id');
    expect(await screen.findByText('Transaction not found')).toBeInTheDocument();
  });
});

describe('Profile (10)', () => {
  it('is read-only and links back to the role dashboard', () => {
    renderAt('/profile', <Profile />, '/profile', { id: 'u1', name: 'Jane Client', email: 'jane@x.com', role: 'CLIENT', createdAt: '2026-01-01T10:00:00Z' });
    expect(screen.getByText('jane@x.com')).toBeInTheDocument();
    expect(screen.getAllByText('Client').length).toBeGreaterThan(0);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to Dashboard' })).toHaveAttribute('href', '/client/dashboard');
  });
});
