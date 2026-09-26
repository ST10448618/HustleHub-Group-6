import api from './api';

/**
 * GET /income/me - FREELANCER only (a CLIENT token gets a 403).
 *
 * Returns a FLAT object directly under data - not nested under any
 * further key, unlike most other endpoints in this API:
 *   { totalIncome, depositIncome, remainingIncome, pendingIncome }
 *
 * Display label mapping (per the visual spec - apply these labels in
 * the UI, never the raw field names):
 *   depositIncome   -> "Deposit Income"
 *   remainingIncome -> "Released Income"
 *   totalIncome     -> the real, banked headline number
 *   pendingIncome   -> "Pending / Upcoming" - money scheduled but not
 *                      yet released, never merged into totalIncome
 *
 * There is no tax field anywhere in this response, and none should
 * ever be rendered for it in Part 2.
 */
export async function getMyIncome() {
  const envelope = await api.get('/income/me');
  return envelope.data;
}