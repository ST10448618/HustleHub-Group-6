import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PackageX } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import GigForm from '../../components/gigs/GigForm.jsx';
import DeleteGigModal from '../../components/gigs/DeleteGigModal.jsx';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../components/common/useToast.js';
import { getGig, updateGig } from '../../services/gigService.js';

const EDIT_NOTE =
  'Changes to price or deposit apply to future bookings only. Existing bookings keep the amounts they were made with.';

function toFormValues(gig) {
  return {
    title: gig.title,
    description: gig.description,
    category: gig.category,
    price: String(gig.price),
    depositAmount: String(gig.depositAmount)
  };
}

function EditGig() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    loadGig();
  }, [loadGig]);

  async function handleSubmit(data) {
    await updateGig(id, data);
    showToast('Gig updated.', 'success');
    navigate(`/freelancer/gigs/${id}`);
  }

  function handleDeleted() {
    setDeleteOpen(false);
    showToast('Gig deleted. It is no longer listed on the marketplace.', 'success');
    navigate('/freelancer/gigs');
  }

  if (loading) {
    return <LoadingSkeleton count={2} height={200} />;
  }

  // A malformed id is a 400 and a missing gig a 404 - both just mean
  // "no such gig" to the person looking at the page.
  if (error && (error.status === 404 || error.status === 400)) {
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

  if (error || !gig) {
    return <ErrorState message={error?.message} onRetry={loadGig} />;
  }

  // GET /gigs/:id is public, so it happily returns someone else's
  // gig. The backend would refuse their edit anyway (403) - but there
  // is no reason to show another freelancer's gig in an edit form.
  if (gig.freelancerId !== currentUser.id) {
    return (
      <div className="card">
        <EmptyState
          icon={PackageX}
          title="You can't edit this gig"
          description="Only the freelancer who created a gig can edit it."
          action={<Button to="/freelancer/gigs">Back to My Gigs</Button>}
        />
      </div>
    );
  }

  const isActive = gig.status === 'ACTIVE';

  return (
    <>
      <div className="page-breadcrumbs">
        <Breadcrumbs
          items={[
            { label: 'My Gigs', to: '/freelancer/gigs' },
            { label: gig.title, to: `/freelancer/gigs/${gig.id}` },
            { label: 'Edit' }
          ]}
        />
      </div>

      <PageHeader
        title="Edit Gig"
        subtitle={<StatusBadge status={gig.status} />}
        actions={
          isActive && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete Gig
            </Button>
          )
        }
      />

      {!isActive && (
        <div className="page-alert">
          <Alert variant="info">
            This gig is inactive: it is no longer listed on the marketplace and can't be booked.
            You can still edit its details, but an inactive gig can't be reactivated.
          </Alert>
        </div>
      )}

      <GigForm
        key={gig.id}
        initialValues={toFormValues(gig)}
        submitLabel="Save Changes"
        cancelTo={`/freelancer/gigs/${gig.id}`}
        onSubmit={handleSubmit}
        disableWhenUnchanged
        footerNote={EDIT_NOTE}
      />

      <DeleteGigModal
        gig={gig}
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
    </>
  );
}

export default EditGig;