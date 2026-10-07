import './PagePlaceholder.css';

/**
 * TEMPORARY stand-in for authenticated screens that a later phase
 * builds. Mounted at each screen's final, locked route so every
 * sidebar link already resolves inside the real shell. When a phase
 * builds a screen, AppRoutes.jsx swaps this element for the real page
 * - nothing else changes.
 */
function PagePlaceholder({ title, phase }) {
  return (
    <div className="card page-placeholder">
      <h2>{title}</h2>
      <p className="page-placeholder-text">This screen is built in Phase {phase}.</p>
    </div>
  );
}

export default PagePlaceholder;