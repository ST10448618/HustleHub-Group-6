import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { getDashboardPathForRole } from '../../routes/RoleRedirect.jsx';
import { USER_ROLES } from '../../utils/constants.js';
import Input from '../../components/common/Input.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import Button from '../../components/common/Button.jsx';
import './authForms.css';

// Mirrors the backend's exact password rule set (see
// backend/src/validation/authValidation.js) so the person gets
// immediate feedback without waiting for a round trip - the backend
// still re-validates everything regardless; this is convenience only.
const PASSWORD_RULES = [
  { test: (pw) => pw.length >= 8, label: 'At least 8 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'One number' }
];

function Register() {
  const { registerThenLogin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(USER_ROLES.CLIENT);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function validateClientSide() {
    const errors = {};

    if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Please provide a valid email';
    }
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) {
      errors.password = `Password needs: ${failedRule.label.toLowerCase()}`;
    }
    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const user = await registerThenLogin({ name, email, password, role });
      navigate(getDashboardPathForRole(user.role), { replace: true });
    } catch (error) {
      // A 400 validation failure carries error.errors (field-level
      // messages from express-validator) - map those directly onto
      // the matching inputs. Anything else (409 duplicate email, a
      // 500) has no errors array, so error.message is already the
      // exact safe string to show as a form-level banner instead.
      if (error.errors) {
        const mapped = {};
        error.errors.forEach((fieldError) => {
          mapped[fieldError.field] = fieldError.message;
        });
        setFieldErrors(mapped);
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">
          HUSTLEHUB<span className="auth-title-accent">+</span>
        </h1>
        <p className="auth-subtitle">Create your account.</p>

        {formError && (
          <div className="form-error-banner" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="register-name"
            label="Full Name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />

          <Input
            id="register-email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <div>
            <PasswordInput
              id="register-password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
            />
            <ul className="password-hints">
              {PASSWORD_RULES.map((rule) => (
                <li
                  key={rule.label}
                  className={rule.test(password) ? 'password-hint-met' : 'password-hint'}
                >
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <PasswordInput
            id="register-confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="form-field">
            <span className="form-label">I want to...</span>
            <div className="role-choice-group">
              <label className="role-choice" htmlFor="role-client">
                <input
                  id="role-client"
                  type="radio"
                  name="role"
                  value={USER_ROLES.CLIENT}
                  checked={role === USER_ROLES.CLIENT}
                  onChange={() => setRole(USER_ROLES.CLIENT)}
                />
                Hire Freelancers
              </label>
              <label className="role-choice" htmlFor="role-freelancer">
                <input
                  id="role-freelancer"
                  type="radio"
                  name="role"
                  value={USER_ROLES.FREELANCER}
                  checked={role === USER_ROLES.FREELANCER}
                  onChange={() => setRole(USER_ROLES.FREELANCER)}
                />
                Offer Freelance Services
              </label>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="auth-switch-text">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;