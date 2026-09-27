import { useCallback, useEffect, useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import PublicShell from '../../components/layout/PublicShell.jsx';
import GigCard from '../../components/gigs/GigCard.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import Select from '../../components/common/Select.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getGigs } from '../../services/gigService.js';
import { GIG_CATEGORIES } from '../../utils/constants.js';
import './Marketplace.css';

const CATEGORY_OPTIONS = GIG_CATEGORIES.map((category) => ({ value: category, label: category }));

const SORT_OPTIONS = [
  { value: 'default', label: 'Default order' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' }
];

function Marketplace() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  // Only `category` is a real server-side filter (?category=X, an
  // exact value from the fixed enum). Search and sort below are
  // entirely client-side over whatever this fetch returns - no search
  // or sort endpoint exists anywhere in this API.
  const loadGigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getGigs(category ? { category } : {});
      setGigs(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  const visibleGigs = useMemo(() => {
    let result = gigs;

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (gig) =>
          gig.title.toLowerCase().includes(term) || gig.description.toLowerCase().includes(term)
      );
    }

    if (sortOrder === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [gigs, searchTerm, sortOrder]);

  function handleClearFilters() {
    setCategory('');
    setSearchTerm('');
    setSortOrder('default');
  }

  return (
    <PublicShell>
      <div className="container marketplace-page">
        <div className="marketplace-header">
          <h1>Marketplace</h1>
          <p>Browse services from freelancers ready to help.</p>
        </div>

        <div className="marketplace-filters">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search gigs…"
            ariaLabel="Search gigs"
          />
          <Select
            id="marketplace-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            options={CATEGORY_OPTIONS}
            placeholder="All Categories"
          />
          <Select
            id="marketplace-sort"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            options={SORT_OPTIONS}
          />
        </div>

        {loading && <LoadingSkeleton count={6} height={220} />}

        {!loading && error && <ErrorState message={error} onRetry={loadGigs} />}

        {!loading && !error && visibleGigs.length === 0 && (
          <EmptyState
            icon={PackageSearch}
            title="No gigs match your filters"
            description="Try a different search term or category."
            action={
              <Button variant="secondary" onClick={handleClearFilters}>
                Clear filters
              </Button>
            }
          />
        )}

        {!loading && !error && visibleGigs.length > 0 && (
          <div className="marketplace-grid">
            {visibleGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

export default Marketplace;