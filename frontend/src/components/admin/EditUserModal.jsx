import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import Input from '../common/Input.jsx';
import Select from '../common/Select.jsx';
import Button from '../common/Button.jsx';
import { updateUser } from '../../services/adminService.js';
import { getFieldErrors } from '../../utils/formErrors.js';
import './adminModals.css';

// Only these two roles can ever be assigned - the backend rejects
// ADMIN with a 400, so it is never offered.
const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Client' },
  { value: 'FREELANCER', label: 'Freelancer' }
];

/**
 * Edit a user's name and role (the only two things the backend lets an
 * admin change). Parents mount this only while editing, with a `key`
 * of the user's id, so every open starts fresh from that user's
 * current values - no stale form state to reset.
 *
 * Only fields that actually changed are sent. Field-level problems
 * from the backend appear under the matching input; anything else
 * (e.g. the user was changed in another tab) shows as a banner and
 * the dialog stays open so nothing typed is lost.
 */
function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const changes = {};
  if (name.trim() !== user.name) {
    changes.name = name.trim();
  }
  if (role !== user.role) {
    changes.role = role;
  }
  const isDirty = Object.keys(changes).length > 0;

  async function handleSave() {
    if (saving || !isDirty) {
      return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
      setFieldErrors({ name: 'Name cannot be empty' });
      return;
    }
    if (trimmed.length > 100) {
      setFieldErrors({ name: 'Name must be 100 characters or fewer' });
      return;
    }

    setFieldErrors({});
    setFormError('');
    setSaving(true);

    try {
      const updated = await updateUser(user.id, changes);
      onSaved(updated);
    } catch (err) {
      const serverErrors = getFieldErrors(err);
      const shown = {};
      for (const field of ['name', 'role']) {
        if (serverErrors[field]) {
          shown[field] = serverErrors[field];
        }
      }

      if (Object.keys(shown).length > 0) {
        setFieldErrors(shown);
        setFormError('Please fix the highlighted fields.');
      } else {
        setFormError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title="Edit user"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form
        className="admin-edit-user"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        {formError && (
          <div className="admin-modal-banner" role="alert">
            {formError}
          </div>
        )}
        <p className="admin-edit-user-email">{user.email}</p>
        <Input
          id="edit-user-name"
          label="Name"
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />
        <Select
          id="edit-user-role"
          label="Role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          options={ROLE_OPTIONS}
          error={fieldErrors.role}
        />
      </form>
    </Modal>
  );
}

export default EditUserModal;