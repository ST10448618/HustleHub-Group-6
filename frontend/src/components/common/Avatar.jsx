import './Avatar.css';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0].toUpperCase());
  return initials.join('') || '?';
}

/**
 * A circular initials avatar. No photo/avatar field exists anywhere
 * on the User model in this backend (see the data model reference),
 * so this is always derived from `name` - never wired up to expect an
 * image URL.
 */
function Avatar({ name, size = 36 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;