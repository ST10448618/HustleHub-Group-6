import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Breadcrumbs.css';

/**
 * items: [{ label, to? }] - the last item should omit `to` since it's
 * the current page, rendered as plain text rather than a link.
 */
function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label} className="breadcrumbs-item">
          {item.to ? (
            <Link to={item.to} className="breadcrumbs-link">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumbs-current">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight size={14} className="breadcrumbs-separator" aria-hidden="true" />
          )}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;