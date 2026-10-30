const { calculateIncomeTax, getTaxYearBounds } = require('../src/utils/taxCalculator');
const { TAX_TABLE } = require('../src/config/taxConfig');

describe('calculateIncomeTax', () => {
  it.each([0, 50000, 99000])('charges no tax on R%i (inside the tax-free threshold)', (income) => {
    const result = calculateIncomeTax(income);
    expect(result.estimatedTax).toBe(0);
    expect(result.afterTaxIncome).toBe(income);
    expect(result.marginalRate).toBe(0);
  });

  it.each([
    [100000, 180],
    [245100, 26298],
    [300000, 40572],
    [1000000, 288293],
    [2000000, 703149]
  ])('calculates R%i of income as R%i of tax', (income, expectedTax) => {
    expect(calculateIncomeTax(income).estimatedTax).toBe(expectedTax);
  });

  it('reproduces the SARS published base amount at every bracket boundary', () => {
    for (const band of TAX_TABLE.brackets) {
      expect(calculateIncomeTax(band.min).grossTax).toBe(band.base);
    }
  });

  it('exposes the tax-free threshold derived from the rebate', () => {
    expect(calculateIncomeTax(1).taxFreeThreshold).toBe(99000);
  });

  it('reports effective and marginal rates', () => {
    const result = calculateIncomeTax(300000);
    expect(result.marginalRate).toBe(0.26);
    expect(result.effectiveRate).toBeCloseTo(0.1352, 4);
    expect(result.afterTaxIncome).toBe(259428);
  });

  it('breaks income down per bracket and the slices add back up', () => {
    const result = calculateIncomeTax(300000);
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0]).toMatchObject({ from: 0, to: 245100, rate: 0.18, amountInBracket: 245100 });

    const incomeSum = result.breakdown.reduce((sum, band) => sum + band.amountInBracket, 0);
    const taxSum = result.breakdown.reduce((sum, band) => sum + band.taxInBracket, 0);
    expect(incomeSum).toBe(300000);
    expect(taxSum).toBeCloseTo(result.grossTax, 2);
  });

  it('marks the top bracket as open-ended', () => {
    const result = calculateIncomeTax(2000000);
    expect(result.breakdown).toHaveLength(7);
    expect(result.breakdown[6].to).toBeNull();
  });

  it.each([-100, NaN, undefined, 'abc', null])('treats invalid input %p as zero income', (input) => {
    const result = calculateIncomeTax(input);
    expect(result.estimatedTax).toBe(0);
    expect(result.taxableIncome).toBe(0);
    expect(result.breakdown).toEqual([]);
  });
});

describe('getTaxYearBounds', () => {
  it('puts October 2026 in the 2026/27 tax year', () => {
    const { label, start, end } = getTaxYearBounds(new Date('2026-10-30T10:00:00Z'));
    expect(label).toBe('2026/27');
    expect(start.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2027-03-01T00:00:00.000Z');
  });

  it('keeps the last day of February in the previous tax year', () => {
    expect(getTaxYearBounds(new Date('2027-02-28T23:59:59Z')).label).toBe('2026/27');
  });

  it('starts a new tax year on 1 March', () => {
    expect(getTaxYearBounds(new Date('2027-03-01T00:00:00Z')).label).toBe('2027/28');
  });
});