const TAX_TABLE = Object.freeze({
  yearLabel: '2026/27',
  primaryRebate: 17820,
  brackets: Object.freeze([
    { min: 0, max: 245100, rate: 0.18, base: 0 },
    { min: 245100, max: 383100, rate: 0.26, base: 44118 },
    { min: 383100, max: 530200, rate: 0.31, base: 79998 },
    { min: 530200, max: 695800, rate: 0.36, base: 125599 },
    { min: 695800, max: 887000, rate: 0.39, base: 185215 },
    { min: 887000, max: 1878600, rate: 0.41, base: 259783 },
    { min: 1878600, max: Infinity, rate: 0.45, base: 666339 }
  ])
});

module.exports = { TAX_TABLE };