import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GigForm from '../components/gigs/GigForm.jsx';
import CreateGig from '../pages/freelancer/CreateGig.jsx';
import { renderWithAuth, USERS } from '../test/renderHelpers.jsx';

vi.mock('../services/gigService.js', () => ({
  createGig: vi.fn(),
  getGig: vi.fn(),
  getGigs: vi.fn(),
  getMyGigs: vi.fn(),
  updateGig: vi.fn(),
  deleteGig: vi.fn()
}));

import * as gigService from '../services/gigService.js';

const EMPTY = { title: '', description: '', category: '', price: '', depositAmount: '' };

function renderForm(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  renderWithAuth(
    <GigForm initialValues={EMPTY} submitLabel="Create Gig" cancelTo="/freelancer/gigs" {...props} onSubmit={onSubmit} />,
    { user: USERS.FREELANCER }
  );
  return { onSubmit };
}

async function fillValid(user, { price = '2500', deposit = '500' } = {}) {
  await user.type(screen.getByLabelText('Title'), '  Custom Website  ');
  await user.selectOptions(screen.getByLabelText('Category'), 'Software');
  await user.type(screen.getByLabelText('Description'), 'A full business website.');
  if (price) await user.type(screen.getByLabelText('Price (R)'), price);
  if (deposit) await user.type(screen.getByLabelText('Deposit (R)'), deposit);
}

describe('Gig form validation', () => {
  it('requires every field and does not submit when empty', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
    expect(screen.getByText('Price is required')).toBeInTheDocument();
    expect(screen.getByText('Deposit amount is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a deposit greater than the price', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await fillValid(user, { price: '1000', deposit: '1500' });
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(screen.getByText('Deposit amount cannot be greater than the price')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows a deposit equal to the price', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await fillValid(user, { price: '1000', deposit: '1000' });
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('allows a deposit of zero', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await fillValid(user, { price: '1000', deposit: '0' });
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ price: 1000, depositAmount: 0 }))
    );
  });

  it('rejects decimals and non-positive prices', async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValid(user, { price: '99.5', deposit: '0' });
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));
    expect(screen.getByText('Enter a whole number (no decimals)')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Price (R)'));
    await user.type(screen.getByLabelText('Price (R)'), '0');
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));
    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument();
  });

  it('shows a live payment summary as the user types', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Price (R)'), '2500');
    await user.type(screen.getByLabelText('Deposit (R)'), '500');

    expect(screen.getByText('R2,500')).toBeInTheDocument(); // total
    expect(screen.getByText('R500')).toBeInTheDocument(); // deposit
    expect(screen.getByText('R2,000')).toBeInTheDocument(); // remaining
  });

  it('shows a dash for "remaining" while the deposit is larger than the price', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Price (R)'), '1000');
    await user.type(screen.getByLabelText('Deposit (R)'), '1500');

    expect(screen.getByText('Remaining (on completion)').nextSibling).toHaveTextContent('—');
  });

  it('submits trimmed text and real NUMBERS for price and deposit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Custom Website',
        description: 'A full business website.',
        category: 'Software',
        price: 2500,
        depositAmount: 500
      })
    );
  });

  it("puts the backend's field errors under the matching inputs", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({
      status: 400,
      message: 'Validation failed',
      errors: [{ field: 'depositAmount', message: 'Deposit amount cannot exceed the price' }]
    });
    renderForm({ onSubmit });

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(await screen.findByText('Deposit amount cannot exceed the price')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Please fix the highlighted fields.');
  });

  it('shows a non-field backend error as a banner and keeps what was typed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue({ status: 500, message: 'Server exploded', errors: null });
    renderForm({ onSubmit });

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
    expect(screen.getByLabelText('Price (R)')).toHaveValue(2500);
  });

  it('in edit mode, Save stays disabled until something changes', async () => {
    const user = userEvent.setup();
    renderForm({
      initialValues: { title: 'Old', description: 'Desc', category: 'Software', price: '1000', depositAmount: '100' },
      submitLabel: 'Save Changes',
      disableWhenUnchanged: true
    });

    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    await user.type(screen.getByLabelText('Title'), '!');
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
  });
});

describe('Create Gig page', () => {
  it('creates the gig, confirms with a toast and returns to My Gigs', async () => {
    const user = userEvent.setup();
    gigService.createGig.mockResolvedValue({ id: 'g1' });
    renderWithAuth(<CreateGig />, {
      route: '/freelancer/gigs/create',
      path: '/freelancer/gigs/create',
      user: USERS.FREELANCER,
      extraRoutes: [{ path: '/freelancer/gigs', element: <p>My gigs page</p> }]
    });

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(await screen.findByText('My gigs page')).toBeInTheDocument();
    expect(gigService.createGig).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Custom Website', price: 2500, depositAmount: 500 })
    );
    expect(screen.getByText('Gig created. It is now live on the marketplace.')).toBeInTheDocument();
  });

  it('stays on the form (nothing lost) when creation fails', async () => {
    const user = userEvent.setup();
    gigService.createGig.mockRejectedValue({ status: 403, message: 'Only freelancers can create gigs', errors: null });
    renderWithAuth(<CreateGig />, {
      route: '/freelancer/gigs/create',
      path: '/freelancer/gigs/create',
      user: USERS.FREELANCER,
      extraRoutes: [{ path: '/freelancer/gigs', element: <p>My gigs page</p> }]
    });

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create Gig' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only freelancers can create gigs');
    expect(screen.queryByText('My gigs page')).toBeNull();
    expect(screen.getByLabelText('Title')).toHaveValue('  Custom Website  ');
  });
});
