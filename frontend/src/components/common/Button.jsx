import './Button.css';

/**
 * The one button used everywhere in the app.
 *
 * variant: 'primary' (navy, filled - Book This Gig, Save Changes,
 *   Mark as Complete), 'secondary' (outlined - View Details, Cancel,
 *   Back), 'danger' (red, filled - Delete Gig, Cancel Booking, Delete
 *   User; always used behind a confirmation elsewhere, never here).
 *
 * Everything else (onClick, type, disabled, ...) passes straight
 * through to the underlying <button>, so this behaves exactly like a
 * native button with consistent styling on top.
 */
function Button({ variant = 'primary', fullWidth = false, className = '', children, ...rest }) {
  const classes = ['btn', `btn-${variant}`, fullWidth ? 'btn-full' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;