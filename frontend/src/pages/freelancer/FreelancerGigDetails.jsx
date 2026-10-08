import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarX, PackageX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import CategoryIcon from '../../components/gigs/CategoryIcon.jsx';
import DeleteGigModal from '../../components/gigs/DeleteGigModal.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../components/common/useToast.js';
import { getGig } from '../../services/gigService.js';
import { getMyBookings } from '../../services/bookingService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { formatDate } from '../../utils/formatDate.js';
import './FreelancerGigDetails.css';

function FreelancerGigDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [gig, setGig] = useState(null);
  const [gigLoading, setGigLoading] = useState(true);
  const [gigError, setGigError] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadGig = useCallback(async () => {
    setGigLoading(true);
    setGigError(null);
    try {
      setGig(await getGig(id));
    } catch (err) {
      setGigError({ message: err.message, status: err.status });
    } finally {
      setGigLoading(false);
    }
  }, [id]);

  // Loaded separately from the gig on purpose: if the bookings
  // request fails, the gig itself should still show, with a Retry
  // just for the bookings section.
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

  // There is no "bookings for gig X" endpoint. GET /bookings already
  // returns every booking on this freelancer's gigs, so narrow it
  // down here, newest first.
  const gigBookings = useMemo(
    () =>
      bookings
        .filter((booking) => booking.gigId === id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [bookings, id]
  );

  function handleDeleted(updated) {
    setGig((current) => ({ ...current, ...updated }));
    setDeleteOpen(false);
    showToast('Gig deleted. It is no longer listed on the marketplace.', 'success');
  }

  if (gigLoading) {
    return <LoadingSkeleton count={2} height={200} />;
  }

  if (gigError && (gigError.status === 404 || gigError.status === 400)) {
    return (
      <div className="card">
        <EmptyState
          icon={PackageX}
          title="Gig not found"
          description="This gig doesn't exist."
          action={<Button to="/freelancer/gigs">Back to My Gigs</Button>}
        />
      </div>
    );
  }

  if (gigError || !gig) {
    return <ErrorState message={gigError?.message} onRetry={loadGig} />;
  }

  // GET /gigs/:id is public, so another freelancer's gig comes back
  // fine. This page manages gigs, so it only opens your own.
  if (gig.freelancerId !== currentUser.id) {
    return (
      <div className="card">
        <EmptyState
          icon={PackageX}
          title="This isn't your gig"
          description="You can only manage gigs you created."
          action={<Button to="/freelancer/gigs">Back to My Gigs</Button>}
        />
      </div>
    );
  }

  const isActive = gig.status === 'ACTIVE';
  const remaining = gig.price - gig.depositAmount;

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
          to={`/freelancer/bookings/${booking.id}`}
          aria-label={`View booking from ${booking.client?.name ?? 'client'}`}
        >
          View
        </Link>
      )
    }
  ];

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs
          items={[{ label: 'My Gigs', to: '/freelancer/gigs' }, { label: gig.title }]}
        />
      </div>

      <PageHeader
        title={gig.title}
        subtitle={
          <>
            <StatusBadge status={gig.status} />
            <span>Created {formatDate(gig.createdAt)}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" to={`/gigs/${gig.id}`}>
              View Public Page
            </Button>
            <Button variant="secondary" to={`/freelancer/gigs/${gig.id}/edit`}>
              Edit Gig
            </Button>
            {isActive && (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete Gig
              </Button>
            )}
          </>
        }
      />

      {!isActive && (
        <div className="page-alert">
          <Alert variant="info">
            This gig is inactive: it is no longer listed on the marketplace and can't be booked.
          </Alert>
        </div>
      )}

      <div className="freelancer-gig-grid">
        <section className="card freelancer-gig-main">
          <CategoryIcon category={gig.category} size={40} />
          <p className="freelancer-gig-category">{gig.category}</p>
          <p className="freelancer-gig-description">{gig.description}</p>
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
              <dd>{formatCurrency(remaining)}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="card freelancer-gig-bookings">
        <h2 className="section-title">
          Bookings for this gig{!bookingsLoading && !bookingsError ? ` (${gigBookings.length})` : ''}
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

      <DeleteGigModal
        gig={gig}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

export default FreelancerGigDetails;