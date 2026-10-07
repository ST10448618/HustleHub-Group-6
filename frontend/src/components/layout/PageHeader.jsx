import './PageHeader.css';

/**
 * The title block at the top of every authenticated page: a heading,
 * an optional line under it (text, or a status badge plus text), and
 * an optional slot on the right for the page's main action buttons.
 *
 * Built once so every screen's header looks and wraps identically.
 */
function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <div className="page-header-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export default PageHeader;