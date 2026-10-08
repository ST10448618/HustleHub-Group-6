import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import { useToast } from '../common/useToast.js';
import { deleteGig } from '../../services/gigService.js';

/**
 * The delete-gig confirmation AND the API call behind it, shared by
 * My Gigs, Edit Gig and the freelancer Gig Details page so all three
 * behave and read identically.
 *
 * "Delete" is a SOFT delete on the backend: the gig is marked
 * INACTIVE (taken off the marketplace, no longer bookable) and the
 * updated gig is returned. Nothing is removed from the database, and
 * existing bookings are untouched. There is no way to reactivate an
 * INACTIVE gig, which is why the confirmation says it can't be undone.
 *
 * On success it hands the updated gig to `onDeleted`. On failure it
 * shows the backend's own message as a toast and closes.
 */
const DELETE_MESSAGE =
  'This gig will be taken off the marketplace and can no longer be booked. Existing bookings are not affected. This cannot be undone.';

function DeleteGigModal({ gig, isOpen, onClose, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const { showToast } = useToast();

  async function handleConfirm() {
    if (!gig) {
      return;
    }

    setConfirming(true);
    try {
      const updated = await deleteGig(gig.id);
      onDeleted(updated);
    } catch (err) {
      showToast(err.message, 'error');
      onClose();
    } finally {
      setConfirming(false);
    }
  }

  function handleClose() {
    // Don't let Escape / the overlay dismiss the dialog while the
    // request is already in flight.
    if (!confirming) {
      onClose();
    }
  }

  return (
    <ConfirmDialog
      isOpen={isOpen && Boolean(gig)}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={gig ? `Delete "${gig.title}"?` : 'Delete gig?'}
      message={DELETE_MESSAGE}
      confirmLabel="Delete Gig"
      cancelLabel="Keep Gig"
      variant="danger"
      confirming={confirming}
    />
  );
}

export default DeleteGigModal;