import './FormField.css';

/**
 * A labeled <textarea>. Pass maxLength + showCount together (as the
 * gig description field will, capped at 2000 to match the backend's
 * own limit) to render a live "x/2000" counter beneath it.
 */
function Textarea({ label, id, error, maxLength, value = '', showCount = false, rows = 5, className = '', ...rest }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`form-textarea ${error ? 'form-textarea-error' : ''} ${className}`.trim()}
        maxLength={maxLength}
        value={value}
        rows={rows}
        {...rest}
      />
      {showCount && maxLength && (
        <p className="form-hint">
          {value.length}/{maxLength}
        </p>
      )}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}

export default Textarea;