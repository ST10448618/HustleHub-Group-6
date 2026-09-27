import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './FormField.css';
import './PasswordInput.css';

/**
 * Same shape as Input, but always type="password" (toggleable to
 * "text" via the eye icon) - kept as its own component rather than an
 * Input prop, since it needs its own local visibility state and a
 * positioned icon button that plain Input has no reason to carry.
 */
function PasswordInput({ label, id, error, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-field">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="password-input-wrapper">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`form-input ${error ? 'form-input-error' : ''}`}
          {...rest}
        />
        <button
          type="button"
          className="password-toggle-btn"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}

export default PasswordInput;