import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import AdminResourceTable from '../../components/admin/AdminResourceTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { getAllGigs } from '../../services/adminService.js';
import { GIG_CATEGORIES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';

// Stable references, defined once, so the table's filtering doesn't
// recompute on every render of this page.
const FILTERS = [
  {
    key: 'status',
    label: 'statuses',
    options: [
      { value: 'ACTIVE', label: 'Active' },
      { value: 'INACTIVE', label: 'Inactive' }
    ],
    getValue: (gig) => gig.status
  },
  {
    key: 'category',
    label: 'categories',
    options: GIG_CATEGORIES.map((category) => ({ value: category, label: category })),
    getValue: (gig) => gig.category
  }
];

const searchText = (gig) => `${gig.title} ${gig.freelancer?.name ?? ''} ${gig.category}`;

const COLUMNS = [
  {
    key: 'title',
    header: 'Title',
    render: (gig) => <Link to={`/admin/gigs/${gig.id}`}>{gig.title}</Link>
  },
  { key: 'freelancer', header: 'Freelancer', render: (gig) => gig.freelancer?.name ?? '—' },
  { key: 'category', header: 'Category' },
  { key: 'price', header: 'Price', render: (gig) => formatCurrency(gig.price) },
  { key: 'deposit', header: 'Deposit', render: (gig) => formatCurrency(gig.depositAmount) },
  { key: 'status', header: 'Status', render: (gig) => <StatusBadge status={gig.status} /> },
  { key: 'createdAt', header: 'Created', render: (gig) => formatDate(gig.createdAt) },
  {
    key: 'view',
    header: '',
    render: (gig) => (
      <Link to={`/admin/gigs/${gig.id}`} aria-label={`View ${gig.title}`}>
        View
      </Link>
    )
  }
];

/**
 * Screen 25. Every gig on the platform, active AND inactive - this is
 * the only place deleted (inactive) gigs are visible system-wide. The
 * backend already returns them newest first. Search and filters are
 * client-side.
 */
function AdminGigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadGigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGigs(await getAllGigs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  return (
    <>
      <PageHeader title="Gigs" subtitle="Every gig on the platform, including inactive ones." />

      <AdminResourceTable
        columns={COLUMNS}
        rows={gigs}
        loading={loading}
        error={error}
        onRetry={loadGigs}
        noun="gigs"
        searchPlaceholder="Search by title, freelancer or category"
        searchText={searchText}
        filters={FILTERS}
        emptyTitle="No gigs yet"
        emptyDescription="Gigs appear here once freelancers create them."
      />
    </>
  );
}

export default AdminGigs;