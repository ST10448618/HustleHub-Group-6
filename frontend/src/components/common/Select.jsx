import './FormField.css';

/**
 * A labeled <select>. `options` is an array of { value, label } -
 * used for the gig category dropdown (GIG_CATEGORIES from
 * utils/constants.js) and the admin role-edit dropdown (CLIENT/
 * FREELANCER only - never ADMIN, per the backend contract).
 */
function Select({ label, id, error, options, placeholder, className = '', ...rest }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`form-select ${error ? 'form-select-error' : ''} ${className}`.trim()}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}

export default Select;