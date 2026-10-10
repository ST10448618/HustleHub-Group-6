import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Alert from '../common/Alert.jsx';
import Button from '../common/Button.jsx';
import { deleteUser } from '../../services/adminService.js';

/**
 * Permanently deletes a user - but the backend refuses if that user has
 * ANY gigs or bookings (to protect that history), or is an admin. When
 * it refuses, its explanation is shown right here inside the dialog,
 * word for word, and the dialog stays open so it can be read (a toast
 * would vanish). Mounted by the parent only while deleting, with a
 * `key` of the user's id.
 */
function DeleteUserModal({ user, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await deleteUser(user.id);
      onDeleted(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    if (!deleting) {
      onClose();
    }
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={`Delete ${user.name}?`}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Please wait…' : 'Delete User'}
          </Button>
        </>
      }
    >
      {error && <Alert variant="danger">{error}</Alert>}
      <p>
        This permanently deletes the account for <strong>{user.email}</strong>. This cannot be
        undone.
      </p>
    </Modal>
  );
}

export default DeleteUserModal;