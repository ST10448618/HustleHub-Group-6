import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookGigModal from '../components/bookings/BookGigModal.jsx';
import GigDetails from '../pages/public/GigDetails.jsx';
import { renderWithAuth, USERS } from '../test/renderHelpers.jsx';
import { getTodayDateInputValue } from '../utils/formatDate.js';

vi.mock('../services/bookingService.js', () => ({
  createBooking: vi.fn(),
  getMyBookings: vi.fn(),
  getBooking: vi.fn(),
  cancelBooking: vi.fn(),
  completeBooking: vi.fn()
}));
vi.mock('../services/gigService.js', () => ({
  getGig: vi.fn(),
  getGigs: vi.fn(),
  getMyGigs: vi.fn(),
  createGig: vi.fn(),
  updateGig: vi.fn(),
  deleteGig: vi.fn()
}));

import * as bookingService from '../services/bookingService.js';
import * as gigService from '../services/gigService.js';

const gig = {
  id: 'g1',
  freelancerId: 'u-freelancer',
  freelancer: { id: 'u-freelancer', name: 'Alex Freelancer' },
  title: 'Custom Website',
  description: 'A full business website.',
  category: 'Software',
  price: 2500,
  depositAmount: 500,
  status: 'ACTIVE'
};

function renderModal(props = {}) {
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  renderWithAuth(
    <BookGigModal isOpen onClose={onClose} gig={gig} onSuccess={onSuccess} {...props} />,
    { user: USERS.CLIENT }
  );
  return { onSuccess, onClose };
}

describe('Booking modal', () => {
  it('cannot pick a date before today (min = today)', () => {
    renderModal();
    expect(screen.getByLabelText('Booking Date')).toHaveAttribute('min', getTodayDateInputValue());
  });

  it('shows the exact deposit and remaining amounts', () => {
    renderModal();
    expect(screen.getByRole('button', { name: 'Confirm & Pay R500 Deposit' })).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('R2,000')).toBeInTheDocument(); // remaining
  });

  it('asks for a date and does not call the server without one', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderModal();

    await user.click(screen.getByRole('button', { name: /Confirm & Pay/ }));

    expect(screen.getByText('Please choose a date.')).toBeInTheDocument();
    expect(bookingService.createBooking).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('books with the gig id and chosen date, then reports success', async () => {
    const user = userEvent.setup();
    bookingService.createBooking.mockResolvedValue({ id: 'b1' });
    const { onSuccess } = renderModal();

    await user.type(screen.getByLabelText('Booking Date'), '2999-01-15');
    await user.click(screen.getByRole('button', { name: /Confirm & Pay/ }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 'b1' }));
    expect(bookingService.createBooking).toHaveBeenCalledWith({
      gigId: 'g1',
      bookingDate: '2999-01-15'
    });
  });

  it("shows the backend's message when booking fails, and lets the user try again", async () => {
    const user = userEvent.setup();
    bookingService.createBooking.mockRejectedValue({
      status: 400,
      message: 'Booking date cannot be in the past',
      errors: null
    });
    const { onSuccess } = renderModal();

    await user.type(screen.getByLabelText('Booking Date'), '2999-01-15');
    await user.click(screen.getByRole('button', { name: /Confirm & Pay/ }));

    expect(await screen.findByText('Booking date cannot be in the past')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Confirm & Pay/ })).toBeEnabled();
  });

  it('disables both buttons while the booking is in flight (no double booking)', async () => {
    const user = userEvent.setup();
    bookingService.createBooking.mockReturnValue(new Promise(() => {}));
    renderModal();

    await user.type(screen.getByLabelText('Booking Date'), '2999-01-15');
    await user.click(screen.getByRole('button', { name: /Confirm & Pay/ }));

    expect(await screen.findByRole('button', { name: 'Booking…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(bookingService.createBooking).toHaveBeenCalledTimes(1);
  });
});

describe('Gig details: what each visitor can do', () => {
  function renderDetails(user, overrides = {}) {
    gigService.getGig.mockResolvedValue({ ...gig, ...overrides });
    return renderWithAuth(<GigDetails />, {
      route: '/gigs/g1',
      path: '/gigs/:id',
      user,
      extraRoutes: [{ path: '/client/bookings', element: <p>My bookings page</p> }]
    });
  }

  it('shows the payment breakdown to everyone', async () => {
    renderDetails(null);
    expect(await screen.findByRole('heading', { name: 'Custom Website' })).toBeInTheDocument();
    expect(screen.getByText('R2,500')).toBeInTheDocument();
    expect(screen.getByText('R500')).toBeInTheDocument();
    expect(screen.getByText('R2,000')).toBeInTheDocument();
  });

  it('a logged-out visitor is asked to log in to book', async () => {
    renderDetails(null);
    expect(await screen.findByRole('link', { name: 'Login to Book' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Book This Gig' })).toBeNull();
  });

  it('a client can book an active gig', async () => {
    const user = userEvent.setup();
    renderDetails(USERS.CLIENT);

    await user.click(await screen.findByRole('button', { name: 'Book This Gig' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Book "Custom Website"');
  });

  it('a client cannot book an inactive gig', async () => {
    renderDetails(USERS.CLIENT, { status: 'INACTIVE' });

    const button = await screen.findByRole('button', { name: 'This gig is no longer available' });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Book This Gig' })).toBeNull();
  });

  it('the owning freelancer gets Manage Gig; any other freelancer gets no booking action', async () => {
    const { unmount } = renderDetails(USERS.FREELANCER);
    expect(await screen.findByRole('link', { name: 'Manage Gig' })).toHaveAttribute(
      'href',
      '/freelancer/gigs/g1'
    );
    unmount();

    renderDetails({ ...USERS.FREELANCER, id: 'someone-else' });
    await screen.findByRole('heading', { name: 'Custom Website' });
    expect(screen.queryByRole('link', { name: 'Manage Gig' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Book/ })).toBeNull();
  });

  it('an admin gets Manage Gig pointing at the admin gig page', async () => {
    renderDetails(USERS.ADMIN);
    expect(await screen.findByRole('link', { name: 'Manage Gig' })).toHaveAttribute(
      'href',
      '/admin/gigs/g1'
    );
  });

  it('a successful booking toasts and goes to My Bookings', async () => {
    const user = userEvent.setup();
    bookingService.createBooking.mockResolvedValue({ id: 'b1' });
    renderDetails(USERS.CLIENT);

    await user.click(await screen.findByRole('button', { name: 'Book This Gig' }));
    await user.type(screen.getByLabelText('Booking Date'), '2999-01-15');
    await user.click(screen.getByRole('button', { name: /Confirm & Pay/ }));

    expect(await screen.findByText('My bookings page')).toBeInTheDocument();
    expect(screen.getByText('Booking confirmed! Your deposit has been paid.')).toBeInTheDocument();
  });

  it('shows an error with Retry if the gig cannot be loaded', async () => {
    const user = userEvent.setup();
    gigService.getGig.mockRejectedValueOnce({ status: 500, message: 'Server down', errors: null });
    renderDetails(null);

    expect(await screen.findByText('Server down')).toBeInTheDocument();

    gigService.getGig.mockResolvedValue(gig);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Custom Website' })).toBeInTheDocument();
  });
});
