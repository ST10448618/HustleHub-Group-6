const { TAX_TABLE } = require('../config/taxConfig');

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

function calculateIncomeTax(taxableIncome, table = TAX_TABLE) {
  const income = Number.isFinite(taxableIncome) && taxableIncome > 0 ? taxableIncome : 0;

  const breakdown = [];
  let grossTax = 0;
  let topRate = 0;

  for (const band of table.brackets) {
    if (income <= band.min) {
      break;
    }
    const amountInBand = Math.min(income, band.max) - band.min;
    const taxInBand = amountInBand * band.rate;

    grossTax += taxInBand;
    topRate = band.rate;
    breakdown.push({
      from: band.min,
      to: Number.isFinite(band.max) ? band.max : null,
      rate: band.rate,
      amountInBracket: roundMoney(amountInBand),
      taxInBracket: roundMoney(taxInBand)
    });
  }

  const rebate = table.primaryRebate;
  const estimatedTax = roundMoney(Math.max(0, grossTax - rebate));

  return {
    taxableIncome: roundMoney(income),
    grossTax: roundMoney(grossTax),
    rebate,
    estimatedTax,
    afterTaxIncome: roundMoney(income - estimatedTax),
    effectiveRate: income > 0 ? Math.round((estimatedTax / income) * 10000) / 10000 : 0,
    // The rate on the NEXT rand earned. Zero while the rebate still
    // wipes out all the tax.
    marginalRate: estimatedTax > 0 ? topRate : 0,
    taxFreeThreshold: Math.round(rebate / table.brackets[0].rate),
    breakdown
  };
}

function getTaxYearBounds(date = new Date()) {
  const startYear = date.getUTCMonth() >= 2 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;

  return {
    label: `${startYear}/${String(startYear + 1).slice(-2)}`,
    start: new Date(Date.UTC(startYear, 2, 1)),
    end: new Date(Date.UTC(startYear + 1, 2, 1))
  };
}

module.exports = { calculateIncomeTax, getTaxYearBounds };