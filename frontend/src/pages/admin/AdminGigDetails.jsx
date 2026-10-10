import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import AdminResourceDetail from '../../components/admin/AdminResourceDetail.jsx';
import CategoryIcon from '../../components/gigs/CategoryIcon.jsx';
import GigForm from '../../components/gigs/GigForm.jsx';
import DeleteGigModal from '../../components/gigs/DeleteGigModal.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getGig, updateGig } from '../../services/gigService.js';
import { getMyBookings } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
// Reuses the layout classes of the freelancer's gig page so the two match.
import '../freelancer/FreelancerGigDetails.css';

function toFormValues(gig) {
  return {
    title: gig.title,
    description: gig.description,
    category: gig.category,
    price: String(gig.price),
    depositAmount: String(gig.depositAmount)
  };
}

/**
 * Screen 26. One gig, for an admin. Editing and deleting use the
 * regular PUT / DELETE /gigs/:id endpoints, which allow an ADMIN (there
 * is no separate admin gig endpoint). There is also no separate edit
 * route: "Edit Gig" adds ?edit=1 to this page's address, which swaps
 * the details for the same form freelancers use. Cancel (or the
 * browser's Back button) returns to the details.
 */
function AdminGigDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const editing = searchParams.get('edit') === '1';

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadGig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGig(await getGig(id));
    } catch (err) {
      setError({ message: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError('');
    try {
      setBookings(await getMyBookings());
    } catch (err) {
      setBookingsError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGig();
    loadBookings();
  }, [loadGig, loadBookings]);

  // With an ADMIN token GET /bookings returns every booking, so narrow
  // it to this gig here.
  const gigBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.gigId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bookings, id]
  );

  async function handleSubmit(data) {
    const updated = await updateGig(id, data);
    setGig((current) => ({ ...current, ...updated }));
    showToast('Gig updated.', 'success');
    navigate(`/admin/gigs/${id}`);
  }

  function handleDeleted(updated) {
    setGig((current) => ({ ...current, ...updated }));
    setDeleteOpen(false);
    showToast('Gig deleted. It is no longer listed on the marketplace.', 'success');
  }

  const isActive = gig?.status === 'ACTIVE';

  const bookingColumns = [
    { key: 'client', header: 'Client', render: (booking) => booking.client?.name ?? '—' },
    {
      key: 'bookingDate',
      header: 'Service Date',
      render: (booking) => formatDate(booking.bookingDate)
    },
    { key: 'amount', header: 'Total', render: (booking) => formatCurrency(booking.amount) },
    { key: 'status', header: 'Status', render: (booking) => <StatusBadge status={booking.status} /> },
    {
      key: 'view',
      header: '',
      render: (booking) => (
        <Link
          to={`/admin/bookings/${booking.id}`}
          aria-label={`View booking from ${booking.client?.name ?? 'client'}`}
        >
          View
        </Link>
      )
    }
  ];

  return (
    <>
      <AdminResourceDetail
        entityName="Gig"
        backTo="/admin/gigs"
        backLabel="Back to Gigs"
        breadcrumbs={[{ label: 'Gigs', to: '/admin/gigs' }, { label: gig?.title ?? 'Gig' }]}
        loading={loading}
        error={error}
        onRetry={loadGig}
        title={editing ? 'Edit Gig' : gig?.title}
        subtitle={
          gig && (
            <>
              <StatusBadge status={gig.status} />
              <span>Created {formatDate(gig.createdAt)}</span>
            </>
          )
        }
        actions={
          gig &&
          !editing && (
            <>
              <Button variant="secondary" to={`/gigs/${gig.id}`}>
                View Public Page
              </Button>
              <Button variant="secondary" to={`/admin/gigs/${gig.id}?edit=1`}>
                Edit Gig
              </Button>
              {isActive && (
                <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                  Delete Gig
                </Button>
              )}
            </>
          )
        }
      >
        {gig && editing && (
          <GigForm
            initialValues={toFormValues(gig)}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            cancelTo={`/admin/gigs/${gig.id}`}
            disableWhenUnchanged
            footerNote="Changes to price or deposit apply to future bookings only. Existing bookings keep the amounts they were made with."
          />
        )}

        {gig && !editing && (
          <>
            {!isActive && (
              <Alert variant="info">
                This gig is inactive: it is no longer listed on the marketplace and can&apos;t be
                booked.
              </Alert>
            )}

            <div className="freelancer-gig-grid">
              <section className="card freelancer-gig-main">
                <CategoryIcon category={gig.category} size={40} />
                <p className="freelancer-gig-category">{gig.category}</p>
                <p className="freelancer-gig-description">{gig.description}</p>
                <p>
                  Freelancer:{' '}
                  {gig.freelancer ? (
                    <Link to={`/admin/users/${gig.freelancerId}`}>{gig.freelancer.name}</Link>
                  ) : (
                    '—'
                  )}
                </p>
              </section>

              <aside className="card">
                <h2 className="section-title">Payment Breakdown</h2>
                <dl className="freelancer-gig-payment">
                  <div>
                    <dt>Total</dt>
                    <dd className="freelancer-gig-total">{formatCurrency(gig.price)}</dd>
                  </div>
                  <div>
                    <dt>Deposit (paid when booked)</dt>
                    <dd>{formatCurrency(gig.depositAmount)}</dd>
                  </div>
                  <div>
                    <dt>Remaining (on completion)</dt>
                    <dd>{formatCurrency(gig.price - gig.depositAmount)}</dd>
                  </div>
                </dl>
              </aside>
            </div>

            <section className="card">
              <h2 className="section-title">
                Bookings for this gig
                {!bookingsLoading && !bookingsError ? ` (${gigBookings.length})` : ''}
              </h2>

              {bookingsLoading && <LoadingSkeleton count={2} height={48} />}

              {!bookingsLoading && bookingsError && (
                <ErrorState message={bookingsError} onRetry={loadBookings} />
              )}

              {!bookingsLoading && !bookingsError && gigBookings.length === 0 && (
                <EmptyState
                  icon={CalendarX}
                  title="No bookings yet"
                  description="When a client books this gig, it will appear here."
                />
              )}

              {!bookingsLoading && !bookingsError && gigBookings.length > 0 && (
                <DataTable columns={bookingColumns} rows={gigBookings} />
              )}
            </section>
          </>
        )}
      </AdminResourceDetail>

      <DeleteGigModal
        gig={gig}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

export default AdminGigDetails;