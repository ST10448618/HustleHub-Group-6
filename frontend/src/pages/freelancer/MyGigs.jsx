import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DeleteGigModal from '../../components/gigs/DeleteGigModal.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getMyGigs } from '../../services/gigService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import './MyGigs.css';

function MyGigs() {
  const { showToast } = useToast();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadGigs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGigs(await getMyGigs());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGigs();
  }, [loadGigs]);

  function handleDeleted(updated) {
    // The backend soft-deletes: the gig is NOT gone, it comes back
    // with status INACTIVE. So the row stays and just flips status,
    // exactly as a refetch would show it.
    setGigs((current) => current.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
    setDeleteTarget(null);
    showToast('Gig deleted. It is no longer listed on the marketplace.', 'success');
  }

  const columns = [
    {
      key: 'title',
      header: 'Gig',
      render: (gig) => (
        <Link to={`/freelancer/gigs/${gig.id}`} className="my-gigs-title">
          {gig.title}
        </Link>
      )
    },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price', render: (gig) => formatCurrency(gig.price) },
    { key: 'depositAmount', header: 'Deposit', render: (gig) => formatCurrency(gig.depositAmount) },
    { key: 'status', header: 'Status', render: (gig) => <StatusBadge status={gig.status} /> },
    { key: 'createdAt', header: 'Created', render: (gig) => formatDate(gig.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (gig) => (
        <div className="gig-row-actions">
          <Link to={`/freelancer/gigs/${gig.id}`} aria-label={`View ${gig.title}`}>
            View
          </Link>
          <Link to={`/freelancer/gigs/${gig.id}/edit`} aria-label={`Edit ${gig.title}`}>
            Edit
          </Link>
          {gig.status === 'ACTIVE' && (
            <button
              type="button"
              className="gig-row-delete"
              aria-label={`Delete ${gig.title}`}
              onClick={() => setDeleteTarget(gig)}
            >
              Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="My Gigs"
        subtitle="The services you offer. Inactive gigs are no longer listed on the marketplace."
        actions={<Button to="/freelancer/gigs/create">Create Gig</Button>}
      />

      {loading && <LoadingSkeleton count={4} height={56} />}

      {!loading && error && <ErrorState message={error} onRetry={loadGigs} />}

      {!loading && !error && gigs.length === 0 && (
        <div className="card">
          <EmptyState
            icon={PackagePlus}
            title="You haven't created any gigs yet"
            description="Create your first gig to start appearing on the marketplace."
            action={<Button to="/freelancer/gigs/create">Create Gig</Button>}
          />
        </div>
      )}

      {!loading && !error && gigs.length > 0 && <DataTable columns={columns} rows={gigs} />}

      <DeleteGigModal
        gig={deleteTarget}
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

export default MyGigs;