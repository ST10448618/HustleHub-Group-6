import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Marketplace from '../pages/public/Marketplace.jsx';
import { renderWithAuth } from '../test/renderHelpers.jsx';

vi.mock('../services/gigService.js', () => ({
  getGigs: vi.fn(),
  getGig: vi.fn(),
  getMyGigs: vi.fn(),
  createGig: vi.fn(),
  updateGig: vi.fn(),
  deleteGig: vi.fn()
}));

import * as gigService from '../services/gigService.js';

const mk = (id, title, price, extra = {}) => ({
  id,
  title,
  description: `${title} description`,
  category: 'Software',
  price,
  depositAmount: Math.round(price / 5),
  status: 'ACTIVE',
  freelancer: { id: 'f1', name: 'Alex Freelancer' },
  ...extra
});

const GIGS = [
  mk('g1', 'Logo Design', 800, { category: 'Design' }),
  mk('g2', 'Custom Website', 2500),
  mk('g3', 'SEO Audit', 1200, { category: 'Marketing', description: 'Find keyword gaps' })
];

function renderMarketplace() {
  return renderWithAuth(<Marketplace />, { route: '/marketplace' });
}

function cardTitles() {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
}

describe('Marketplace states', () => {
  it('shows loading placeholders first, then the gigs', async () => {
    let resolve;
    gigService.getGigs.mockReturnValue(new Promise((r) => (resolve = r)));
    renderMarketplace();

    expect(document.querySelectorAll('.loading-skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('Logo Design')).toBeNull();

    resolve(GIGS);
    expect(await screen.findByText('Logo Design')).toBeInTheDocument();
    expect(document.querySelectorAll('.loading-skeleton')).toHaveLength(0);
  });

  it('shows each gig with its price and deposit', async () => {
    gigService.getGigs.mockResolvedValue(GIGS);
    renderMarketplace();

    const card = (await screen.findByText('Custom Website')).closest('a');
    expect(card).toHaveAttribute('href', '/gigs/g2');
    expect(within(card).getByText('R2,500')).toBeInTheDocument();
    expect(within(card).getByText('R500 deposit')).toBeInTheDocument();
  });

  it('shows an empty state with a way to clear filters when nothing is listed', async () => {
    gigService.getGigs.mockResolvedValue([]);
    renderMarketplace();

    expect(await screen.findByText('No gigs match your filters')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('shows the error with a Retry that loads the gigs', async () => {
    const user = userEvent.setup();
    gigService.getGigs.mockRejectedValueOnce({ status: 500, message: 'Server down', errors: null });
    renderMarketplace();

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(screen.queryByText('Logo Design')).toBeNull();

    gigService.getGigs.mockResolvedValue(GIGS);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Logo Design')).toBeInTheDocument();
  });

  it('shows a friendly message (not a crash) when the network is down', async () => {
    gigService.getGigs.mockRejectedValue({
      status: null,
      message: 'Connection problem. Please check your network and try again.',
      errors: null
    });
    renderMarketplace();

    expect(
      await screen.findByText('Connection problem. Please check your network and try again.')
    ).toBeInTheDocument();
  });
});

describe('Marketplace filtering', () => {
  it('search matches title or description, client-side', async () => {
    const user = userEvent.setup();
    gigService.getGigs.mockResolvedValue(GIGS);
    renderMarketplace();
    await screen.findByText('Logo Design');

    await user.type(screen.getByLabelText('Search gigs'), 'keyword');

    expect(cardTitles()).toEqual(['SEO Audit']);
    expect(gigService.getGigs).toHaveBeenCalledTimes(1); // no extra request
  });

  it('sorts by price in both directions', async () => {
    const user = userEvent.setup();
    gigService.getGigs.mockResolvedValue(GIGS);
    renderMarketplace();
    await screen.findByText('Logo Design');

    await user.selectOptions(screen.getByDisplayValue('Default order'), 'price-asc');
    expect(cardTitles()).toEqual(['Logo Design', 'SEO Audit', 'Custom Website']);

    await user.selectOptions(screen.getByDisplayValue('Price: Low to High'), 'price-desc');
    expect(cardTitles()).toEqual(['Custom Website', 'SEO Audit', 'Logo Design']);
  });

  it('the category filter asks the server for that exact category', async () => {
    const user = userEvent.setup();
    gigService.getGigs.mockResolvedValue(GIGS);
    renderMarketplace();
    await screen.findByText('Logo Design');
    expect(gigService.getGigs).toHaveBeenLastCalledWith({});

    gigService.getGigs.mockResolvedValue([GIGS[0]]);
    await user.selectOptions(screen.getByDisplayValue('All Categories'), 'Design');

    await waitFor(() => expect(gigService.getGigs).toHaveBeenLastCalledWith({ category: 'Design' }));
    expect(await screen.findByText('Logo Design')).toBeInTheDocument();
    expect(screen.queryByText('Custom Website')).toBeNull();
  });

  it('"Clear filters" resets search, sort and category', async () => {
    const user = userEvent.setup();
    gigService.getGigs.mockResolvedValue(GIGS);
    renderMarketplace();
    await screen.findByText('Logo Design');

    await user.type(screen.getByLabelText('Search gigs'), 'zzz-no-match');
    expect(await screen.findByText('No gigs match your filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByLabelText('Search gigs')).toHaveValue('');
    expect(cardTitles()).toHaveLength(3);
  });
});
