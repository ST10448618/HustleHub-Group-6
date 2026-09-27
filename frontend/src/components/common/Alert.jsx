import './Alert.css';

/**
 * A persistent in-page message banner - for things like "This gig is
 * no longer available" on Gig Details, or a form-level error that
 * should stay visible until the person acts, not disappear on its own
 * like a Toast does.
 *
 * variant is limited to 'info' | 'success' | 'danger' - matching the
 * three semantic colors the locked design tokens actually define
 * (--color-primary, --color-success, --color-danger). There's no
 * separate "warning" token in the visual spec, so no warning variant
 * is invented here.
 */
function Alert({ variant = 'info', children }) {
  return (
    <div className={`alert alert-${variant}`} role={variant === 'danger' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export default Alert;