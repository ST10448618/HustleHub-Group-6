import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicShell from '../../components/layout/PublicShell.jsx';
import CategoryIcon from '../../components/gigs/CategoryIcon.jsx';
import BookGigModal from '../../components/bookings/BookGigModal.jsx';
import Button from '../../components/common/Button.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Alert from '../../components/common/Alert.jsx';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../components/common/useToast.js';
import { getGig } from '../../services/gigService.js';
import { formatCurrency } from '../../utils/formatCurrency.js';
import { USER_ROLES } from '../../utils/constants.js';
import './GigDetails.css';

function GigDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticated, role, currentUser } = useAuth();
  const { showToast } = useToast();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const loadGig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getGig(id);
      setGig(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGig();
  }, [loadGig]);

  function handleBookingSuccess() {
    setBookingModalOpen(false);
    showToast('Booking confirmed! Your deposit has been paid.', 'success');
    navigate('/client/bookings');
  }

  if (loading) {
    return (
      <PublicShell>
        <div className="container gig-details-page">
          <LoadingSkeleton count={1} height={400} />
        </div>
      </PublicShell>
    );
  }

  if (error || !gig) {
    return (
      <PublicShell>
        <div className="container gig-details-page">
          <ErrorState message={error || 'Gig not found.'} onRetry={loadGig} />
        </div>
      </PublicShell>
    );
  }

  const isOwningFreelancer =
    authenticated && role === USER_ROLES.FREELANCER && gig.freelancerId === currentUser.id;
  // Not explicitly named in the Screen 03 spec, but ADMIN can manage
  // any gig via the same ownership-or-admin check the backend applies
  // everywhere else (PUT/DELETE /gigs/:id) - leaving an admin viewer
  // with no action at all here would look like an oversight rather
  // than the intentional "freelancers who don't own this gig get no
  // button" case the spec does call out.
  const isAdmin = authenticated && role === USER_ROLES.ADMIN;
  const remaining = gig.price - gig.depositAmount;

  return (
    <PublicShell>
      <div className="container gig-details-page">
        <div className="gig-details-grid">
          <div className="gig-details-main card">
            <CategoryIcon category={gig.category} size={48} />
            <h1 className="gig-details-title">{gig.title}</h1>
            <p className="gig-details-freelancer">by {gig.freelancer?.name}</p>
            <p className="gig-details-category">{gig.category}</p>
            <p className="gig-details-description">{gig.description}</p>

            {gig.status === 'INACTIVE' && (
              <Alert variant="danger">This gig is no longer available.</Alert>
            )}
          </div>

          <div className="gig-details-sidebar card">
            <h3>Payment Breakdown</h3>

            <div className="gig-details-price-row">
              <span>Total</span>
              <span className="gig-details-price-value">{formatCurrency(gig.price)}</span>
            </div>
            <div className="gig-details-price-row">
              <span>Deposit (paid now)</span>
              <span>{formatCurrency(gig.depositAmount)}</span>
            </div>
            <div className="gig-details-price-row">
              <span>Remaining (on completion)</span>
              <span>{formatCurrency(remaining)}</span>
            </div>

            <p className="gig-details-payment-note">
              Bookings simulate a real payment flow: the deposit is recorded as paid the moment you
              book, and the remaining amount is released once the freelancer marks the work
              complete. No real payment gateway is involved.
            </p>

            {!authenticated && (
              <Button fullWidth to="/login">
                Login to Book
              </Button>
            )}

            {authenticated && role === USER_ROLES.CLIENT && gig.status === 'ACTIVE' && (
              <Button fullWidth onClick={() => setBookingModalOpen(true)}>
                Book This Gig
              </Button>
            )}

            {authenticated && role === USER_ROLES.CLIENT && gig.status === 'INACTIVE' && (
              <Button fullWidth disabled>
                This gig is no longer available
              </Button>
            )}

            {authenticated && isOwningFreelancer && (
              <Button fullWidth variant="secondary" to={`/freelancer/gigs/${gig.id}`}>
                Manage Gig
              </Button>
            )}

            {authenticated && isAdmin && (
              <Button fullWidth variant="secondary" to={`/admin/gigs/${gig.id}`}>
                Manage Gig
              </Button>
            )}

            {/* A FREELANCER who is neither the owner nor an admin gets
                no booking action at all - freelancers can't book gigs
                (the backend blocks it with a 403 regardless), so no
                disabled "Book" button is shown here either. */}
          </div>
        </div>
      </div>

      {gig.status === 'ACTIVE' && (
        <BookGigModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          gig={gig}
          onSuccess={handleBookingSuccess}
        />
      )}
    </PublicShell>
  );
}

export default GigDetails;