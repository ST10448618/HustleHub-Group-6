import Modal from './Modal.jsx';
import Button from './Button.jsx';

/**
 * The one confirmation dialog used everywhere a destructive or
 * consequential action needs a confirmation step: cancelling a
 * booking (Screen 09), deleting a gig (Screens 13/15/16), deleting a
 * user (Screen 23). `variant` controls the confirm button's color -
 * 'danger' for deletes, 'primary' for a cancel-booking confirmation
 * (cancelling isn't destructive to data, just a status change).
 *
 * `confirming` disables both buttons and swaps the confirm label to a
 * "Please wait…" state while the actual API call is in flight, so a
 * slow network can't result in a double-submit from an impatient
 * second click.
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  confirming = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={confirming}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;