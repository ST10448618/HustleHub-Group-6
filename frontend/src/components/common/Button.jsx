import { Link } from 'react-router-dom';
import './Button.css';

/**
 * The one button used everywhere in the app.
 *
 * variant: 'primary' (navy, filled - Book This Gig, Save Changes,
 *   Mark as Complete), 'secondary' (outlined - View Details, Cancel,
 *   Back), 'danger' (red, filled - Delete Gig, Cancel Booking, Delete
 *   User; always used behind a confirmation elsewhere, never here).
 *
 * Pass `to` (a route path) instead of an onClick when the button is
 * really navigation, not an action - e.g. "Browse Gigs" on the
 * Landing page. It then renders as a react-router <Link> styled
 * identically to a real button, rather than every public page having
 * to duplicate 'btn btn-primary' as a raw className string on a
 * plain <Link>. Everything else (onClick, type, disabled, ...) passes
 * straight through to whichever element renders.
 */
function Button({ variant = 'primary', fullWidth = false, className = '', children, to, ...rest }) {
  const classes = ['btn', `btn-${variant}`, fullWidth ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;