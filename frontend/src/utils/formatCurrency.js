/**
 * Formats a number as a South African Rand amount for display.
 *
 * Locked output format (agreed and tested against these exact
 * values - do not change without re-checking every screen that
 * displays money):
 *
 *   formatCurrency(2500)  -> "R2,500"
 *   formatCurrency(500)   -> "R500"
 *   formatCurrency(18500) -> "R18,500"
 *   formatCurrency(0)     -> "R0"
 *
 * Deliberately uses 'en-US' grouping (comma thousands separator, no
 * decimal places) rather than 'en-ZA' - the standard en-ZA Intl output
 * ("R 18 500,00", space-separated with comma decimals) does not match
 * the visual spec's example and would look inconsistent with it.
 *
 * All amounts in this system (price, depositAmount, remainingAmount,
 * income figures) are whole Rand values with no cents in practice, so
 * fraction digits are dropped entirely rather than shown as ".00".
 */
export function formatCurrency(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return 'R0';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(Math.round(value));

  return `R${formatted}`;
}