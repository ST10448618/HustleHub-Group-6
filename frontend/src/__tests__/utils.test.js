import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCurrency } from '../utils/formatCurrency.js';
import {
  formatDate,
  getTodayDateInputValue,
  hasBookingDatePassed,
  toDateInputValue
} from '../utils/formatDate.js';
import { getFieldErrors } from '../utils/formErrors.js';
import { getDashboardPathForRole } from '../routes/RoleRedirect.jsx';

describe('formatCurrency', () => {
  // These four values are locked in the build reference (section 4).
  it.each([
    [2500, 'R2,500'],
    [500, 'R500'],
    [18500, 'R18,500'],
    [0, 'R0']
  ])('formats %s as %s', (amount, expected) => {
    expect(formatCurrency(amount)).toBe(expected);
  });

  it('never shows decimals or NaN', () => {
    expect(formatCurrency(1999.6)).toBe('R2,000');
    expect(formatCurrency(undefined)).toBe('R0');
    expect(formatCurrency('abc')).toBe('R0');
  });
});

describe('date helpers', () => {
  afterEach(() => vi.useRealTimers());

  it('formatDate shows a dash for an invalid date instead of "Invalid Date"', () => {
    expect(formatDate('not a date')).toBe('—');
  });

  it('toDateInputValue gives a local YYYY-MM-DD string for <input type="date">', () => {
    expect(toDateInputValue(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(toDateInputValue('garbage')).toBe('');
  });

  it("getTodayDateInputValue is today's local date", () => {
    expect(getTodayDateInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getTodayDateInputValue()).toBe(toDateInputValue(new Date()));
  });

  it('hasBookingDatePassed: false before the date, true on and after it', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T12:00:00.000Z'));

    expect(hasBookingDatePassed('2026-10-11T00:00:00.000Z')).toBe(false); // tomorrow
    expect(hasBookingDatePassed('2026-10-10T00:00:00.000Z')).toBe(true); // today
    expect(hasBookingDatePassed('2026-10-09T00:00:00.000Z')).toBe(true); // yesterday
  });
});

describe('getFieldErrors', () => {
  it('reads the backend array shape [{ field, message }]', () => {
    const error = {
      errors: [
        { field: 'email', message: 'Please provide a valid email' },
        { field: 'email', message: 'second message is ignored' },
        { field: 'name', message: 'Name is too short' }
      ]
    };
    expect(getFieldErrors(error)).toEqual({
      email: 'Please provide a valid email',
      name: 'Name is too short'
    });
  });

  it('copes with no errors at all', () => {
    expect(getFieldErrors({ errors: null })).toEqual({});
    expect(getFieldErrors(undefined)).toEqual({});
  });
});

describe('getDashboardPathForRole', () => {
  it('sends each role to its own dashboard, and anything else home', () => {
    expect(getDashboardPathForRole('CLIENT')).toBe('/client/dashboard');
    expect(getDashboardPathForRole('FREELANCER')).toBe('/freelancer/dashboard');
    expect(getDashboardPathForRole('ADMIN')).toBe('/admin/dashboard');
    expect(getDashboardPathForRole(null)).toBe('/');
  });
});
