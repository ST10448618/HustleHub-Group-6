import { useState } from 'react';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Textarea from '../common/Textarea.jsx';
import Button from '../common/Button.jsx';
import { GIG_CATEGORIES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { getFieldErrors } from '../../utils/formErrors.js';
import './GigForm.css';

const FIELD_NAMES = ['title', 'description', 'category', 'price', 'depositAmount'];
const CATEGORY_OPTIONS = GIG_CATEGORIES.map((category) => ({ value: category, label: category }));
const WHOLE_NUMBER = /^\d+$/;

/**
 * Mirrors the backend's gig rules (backend/src/validation/gigValidation.js
 * and models/Gig.js) so mistakes show up instantly, with the backend's
 * own wording. The backend still re-validates everything and has the
 * final word - this is convenience, not security.
 *
 * One deliberate difference: amounts must be WHOLE Rand. The backend
 * would accept 99.5, but every screen displays money as whole Rand
 * ("R2,500", never cents), so a decimal price would be shown rounded
 * and look wrong.
 */
function validate(values) {
  const errors = {};

  const title = values.title.trim();
  if (!title) {
    errors.title = 'Title is required';
  } else if (title.length > 150) {
    errors.title = 'Title must be 150 characters or fewer';
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = 'Description is required';
  } else if (description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer';
  }

  if (!values.category) {
    errors.category = 'Category is required';
  } else if (!GIG_CATEGORIES.includes(values.category)) {
    errors.category = `Category must be one of: ${GIG_CATEGORIES.join(', ')}`;
  }

  const price = values.price.trim();
  if (!price) {
    errors.price = 'Price is required';
  } else if (price.startsWith('-')) {
    errors.price = 'Price must be greater than 0';
  } else if (!WHOLE_NUMBER.test(price)) {
    errors.price = 'Enter a whole number (no decimals)';
  } else if (Number(price) <= 0) {
    errors.price = 'Price must be greater than 0';
  }

  const deposit = values.depositAmount.trim();
  if (!deposit) {
    errors.depositAmount = 'Deposit amount is required';
  } else if (deposit.startsWith('-')) {
    errors.depositAmount = 'Deposit amount cannot be negative';
  } else if (!WHOLE_NUMBER.test(deposit)) {
    errors.depositAmount = 'Enter a whole number (no decimals)';
  } else if (!errors.price && Number(deposit) > Number(price)) {
    errors.depositAmount = 'Deposit amount cannot be greater than the price';
  }

  return errors;
}

/**
 * The live "what the client will pay" preview, computed from whatever
 * has been typed so far. Any figure that can't be computed yet (empty,
 * invalid, or deposit above price) shows a dash rather than a wrong
 * number.
 */
function buildSummary(values) {
  const price = values.price.trim();
  const deposit = values.depositAmount.trim();
  const priceOk = WHOLE_NUMBER.test(price) && Number(price) > 0;
  const depositOk = WHOLE_NUMBER.test(deposit);

  return {
    price: priceOk ? formatCurrency(Number(price)) : '—',
    deposit: depositOk ? formatCurrency(Number(deposit)) : '—',
    remaining:
      priceOk && depositOk && Number(deposit) <= Number(price)
        ? formatCurrency(Number(price) - Number(deposit))
        : '—'
  };
}

/**
 * The one gig form, shared by Create Gig and Edit Gig.
 *
 *   initialValues         { title, description, category, price,
 *                           depositAmount } - all STRINGS (they are
 *                           typed into inputs); empty strings to create
 *   onSubmit(data)        async. Receives the clean payload, with
 *                           price/depositAmount as real numbers. Should
 *                           THROW (reject) on failure - the form maps
 *                           that onto its fields / banner. The page
 *                           handles what happens on success.
 *   submitLabel           button text
 *   cancelTo              where Cancel goes
 *   disableWhenUnchanged  Edit only: keeps Save disabled until
 *                           something actually changed
 *   footerNote            optional text shown under the summary
 *
 * Failure handling: field-level problems from the backend (either
 * shape - see utils/formErrors.js) appear under the matching inputs.
 * Anything else (403, 404, 500, network) appears as a banner.
 */
function GigForm({
  initialValues,
  onSubmit,
  submitLabel,
  cancelTo,
  disableWhenUnchanged = false,
  footerNote
}) {
  const [initial] = useState(initialValues);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    // Editing a field clears its own error straight away.
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  const isDirty = FIELD_NAMES.some((name) => values[name].trim() !== initial[name].trim());
  const summary = buildSummary(values);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        price: Number(values.price.trim()),
        depositAmount: Number(values.depositAmount.trim())
      });
    } catch (error) {
      const serverErrors = getFieldErrors(error);
      const shown = {};
      for (const name of FIELD_NAMES) {
        if (serverErrors[name]) {
          shown[name] = serverErrors[name];
        }
      }

      if (Object.keys(shown).length > 0) {
        setFieldErrors(shown);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="gig-form" onSubmit={handleSubmit} noValidate>
      <div className="gig-form-grid">
        <div className="card gig-form-fields">
          {formError && (
            <div className="gig-form-banner" role="alert">
              {formError}
            </div>
          )}

          <Input
            id="gig-title"
            label="Title"
            value={values.title}
            onChange={(event) => setField('title', event.target.value)}
            error={fieldErrors.title}
            maxLength={150}
            placeholder="e.g. Custom Business Website"
          />

          <Select
            id="gig-category"
            label="Category"
            value={values.category}
            onChange={(event) => setField('category', event.target.value)}
            options={CATEGORY_OPTIONS}
            placeholder="Select a category"
            error={fieldErrors.category}
          />

          <Textarea
            id="gig-description"
            label="Description"
            value={values.description}
            onChange={(event) => setField('description', event.target.value)}
            error={fieldErrors.description}
            maxLength={2000}
            showCount
            rows={7}
            placeholder="Describe what the client gets, how you work, and what you need from them."
          />

          <div className="gig-form-money">
            <Input
              id="gig-price"
              label="Price (R)"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={values.price}
              onChange={(event) => setField('price', event.target.value)}
              error={fieldErrors.price}
            />
            <Input
              id="gig-deposit"
              label="Deposit (R)"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={values.depositAmount}
              onChange={(event) => setField('depositAmount', event.target.value)}
              error={fieldErrors.depositAmount}
            />
          </div>
        </div>

        <aside className="card gig-form-summary">
          <h2 className="section-title">Payment Summary</h2>
          <dl className="gig-form-summary-list">
            <div>
              <dt>Total price</dt>
              <dd className="gig-form-summary-total">{summary.price}</dd>
            </div>
            <div>
              <dt>Deposit (paid when booked)</dt>
              <dd>{summary.deposit}</dd>
            </div>
            <div>
              <dt>Remaining (on completion)</dt>
              <dd>{summary.remaining}</dd>
            </div>
          </dl>
          {footerNote && <p className="gig-form-note">{footerNote}</p>}
        </aside>
      </div>

      <div className="gig-form-actions">
        <Button variant="secondary" to={cancelTo}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || (disableWhenUnchanged && !isDirty)}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default GigForm;