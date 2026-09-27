import './FormField.css';

/**
 * A labeled <input type="date">. Pass `min` (typically
 * getTodayDateInputValue() from utils/formatDate.js) to enforce the
 * backend's "bookingDate cannot be in the past" rule at the picker
 * level too, not just on submit.
 */
function DateInput({ label, id, error, className = '', ...rest }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type="date"
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...rest}
      />
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}

export default DateInput;