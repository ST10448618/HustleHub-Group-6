import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Finances from '../pages/freelancer/Finances.jsx';
import { renderWithAuth, USERS } from '../test/renderHelpers.jsx';

vi.mock('../services/incomeService.js', () => ({
  getMyIncome: vi.fn(),
  getMyTax: vi.fn()
}));
vi.mock('../services/transactionService.js', () => ({
  getTransactions: vi.fn(),
  getTransaction: vi.fn()
}));

import * as incomeService from '../services/incomeService.js';
import * as transactionService from '../services/transactionService.js';

const income = {
  totalIncome: 300000,
  depositIncome: 100000,
  remainingIncome: 200000,
  pendingIncome: 5000
};

const tax = {
  taxYear: '2026/27',
  taxTable: '2026/27',
  periodStart: '2026-03-01T00:00:00.000Z',
  periodEnd: '2027-02-28T00:00:00.000Z',
  taxableIncome: 300000,
  grossTax: 58392,
  rebate: 17820,
  estimatedTax: 40572,
  afterTaxIncome: 259428,
  effectiveRate: 0.1352,
  marginalRate: 0.26,
  taxFreeThreshold: 99000,
  breakdown: [
    { from: 0, to: 245100, rate: 0.18, amountInBracket: 245100, taxInBracket: 44118 },
    { from: 245100, to: 383100, rate: 0.26, amountInBracket: 54900, taxInBracket: 14274 }
  ],
  disclaimer: 'This is an estimate only.'
};

const zeroTax = {
  ...tax,
  taxableIncome: 0,
  grossTax: 0,
  estimatedTax: 0,
  afterTaxIncome: 0,
  effectiveRate: 0,
  marginalRate: 0,
  breakdown: []
};

function renderPage() {
  return renderWithAuth(<Finances />, { user: USERS.FREELANCER });
}

function mockHappyPath(taxData = tax) {
  incomeService.getMyIncome.mockResolvedValue(income);
  incomeService.getMyTax.mockResolvedValue(taxData);
  transactionService.getTransactions.mockResolvedValue([]);
}

describe('Finances page - tax estimate', () => {
  it('shows the estimated tax figures from the API', async () => {
    mockHappyPath();
    renderPage();

    expect(await screen.findByText('Estimated Tax')).toBeInTheDocument();
    expect(screen.getAllByText('R40,572').length).toBeGreaterThan(0);
    expect(screen.getByText('R259,428')).toBeInTheDocument();
    expect(screen.getByText('13.5%')).toBeInTheDocument();
    expect(screen.getByText('Marginal rate 26.0%')).toBeInTheDocument();
    expect(screen.getByText('This is an estimate only.')).toBeInTheDocument();
    expect(screen.getByText('How is this calculated?')).toBeInTheDocument();
  });

  it('shows R0 tax and the threshold message for low income', async () => {
    mockHappyPath(zeroTax);
    renderPage();

    expect(await screen.findByText('Below the tax-free threshold')).toBeInTheDocument();
    expect(screen.getByText('No taxable income yet this tax year.')).toBeInTheDocument();
  });

  it('keeps the income figures visible when only the tax request fails', async () => {
    mockHappyPath();
    incomeService.getMyTax.mockRejectedValue({ message: 'Tax service unavailable' });
    renderPage();

    expect(await screen.findByText('Tax service unavailable')).toBeInTheDocument();
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.queryByText('How is this calculated?')).not.toBeInTheDocument();
  });

  it('retries and recovers after a tax failure', async () => {
    const user = userEvent.setup();
    mockHappyPath();
    incomeService.getMyTax
      .mockRejectedValueOnce({ message: 'Tax service unavailable' })
      .mockResolvedValueOnce(tax);
    renderPage();

    await screen.findByText('Tax service unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Estimated Tax')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Tax service unavailable')).not.toBeInTheDocument();
    });
    expect(incomeService.getMyTax).toHaveBeenCalledTimes(2);
  });
});