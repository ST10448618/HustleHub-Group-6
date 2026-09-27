import './FormField.css';

/**
 * A labeled input with an optional error message underneath.
 * `type` defaults to 'text' but any native input type works
 * (email, number, etc.) except 'password' - use PasswordInput for
 * that, since it needs the show/hide toggle.
 */
function Input({ label, id, error, type = 'text', className = '', ...rest }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...rest}
      />
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}

export default Input;