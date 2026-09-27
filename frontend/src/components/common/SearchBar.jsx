import { Search } from 'lucide-react';
import './SearchBar.css';

/**
 * A search input with a leading icon. This never talks to the
 * backend directly - every screen that uses it (Marketplace, Admin
 * Users) filters an already-fetched list client-side, since no search
 * endpoint exists anywhere in this API.
 */
function SearchBar({ value, onChange, placeholder = 'Search…', ariaLabel = 'Search' }) {
  return (
    <div className="search-bar">
      <Search size={18} className="search-bar-icon" aria-hidden="true" />
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}

export default SearchBar;