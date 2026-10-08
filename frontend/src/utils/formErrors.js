/**
 * Turns a rejected API call into a simple { fieldName: message } map
 * a form can show under the matching inputs.
 *
 * The backend reports field-level problems in TWO different shapes,
 * both of which reach the browser as error.errors (see services/api.js):
 *
 *   1. express-validator (the usual 400): an ARRAY of
 *        [{ field: 'price', message: 'Price must be greater than 0' }]
 *   2. a Mongoose schema rule (e.g. "deposit cannot exceed price" on a
 *      gig update): an OBJECT keyed by field name, each value holding
 *        { message: '...', path: 'depositAmount', ... }
 *
 * Returns {} when the error carries no field-level detail at all
 * (a 403, a 404, a network failure, a 500) - the caller then falls
 * back to showing error.message as a form-level banner.
 */
export function getFieldErrors(error) {
  const source = error?.errors;
  const result = {};

  if (Array.isArray(source)) {
    for (const item of source) {
      if (item?.field && item?.message && !result[item.field]) {
        result[item.field] = item.message;
      }
    }
  } else if (source && typeof source === 'object') {
    for (const [field, value] of Object.entries(source)) {
      const message = typeof value === 'string' ? value : value?.message;
      if (message) {
        result[field] = message;
      }
    }
  }

  return result;
}