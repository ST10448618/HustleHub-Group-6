import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminResourceDetail from '../../components/admin/AdminResourceDetail.jsx';
import EditUserModal from '../../components/admin/EditUserModal.jsx';
import DeleteUserModal from '../../components/admin/DeleteUserModal.jsx';
import Alert from '../../components/common/Alert.jsx';
import Button from '../../components/common/Button.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getUser } from '../../services/adminService.js';
import { formatDateTime } from '../../utils/formatDate.js';
import { getRoleLabel } from '../../utils/userDisplay.js';

/**
 * Screen 24. One user, plus three counts (gigs, bookings,
 * transactions) - the backend returns only counts here, never the
 * lists themselves. Edit / Delete are offered for CLIENT and
 * FREELANCER accounts only; an ADMIN account is view-only.
 */
function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUser(await getUser(id));
    } catch (err) {
      setError({ message: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  function handleSaved(updated) {
    // The update response has no counts, so merge to keep them.
    setUser((current) => ({ ...current, ...updated }));
    setEditing(false);
    showToast('User updated.', 'success');
  }

  function handleDeleted() {
    showToast('User deleted.', 'success');
    navigate('/admin/users');
  }

  const isAdminAccount = user?.role === 'ADMIN';

  return (
    <>
      <AdminResourceDetail
        entityName="User"
        backTo="/admin/users"
        backLabel="Back to Users"
        breadcrumbs={[{ label: 'Users', to: '/admin/users' }, { label: user?.name ?? 'User' }]}
        loading={loading}
        error={error}
        onRetry={loadUser}
        title={user?.name}
        subtitle={user ? `${getRoleLabel(user.role)} · ${user.email}` : undefined}
        actions={
          user &&
          !isAdminAccount && (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit User
              </Button>
              <Button variant="danger" onClick={() => setDeleting(true)}>
                Delete User
              </Button>
            </>
          )
        }
        tiles={
          user
            ? [
                { label: 'Gigs', value: user.gigsCount },
                { label: 'Bookings', value: user.bookingsCount },
                { label: 'Transactions', value: user.transactionsCount }
              ]
            : []
        }
        fields={
          user
            ? [
                { label: 'Name', value: user.name },
                { label: 'Email', value: user.email },
                { label: 'Role', value: getRoleLabel(user.role) },
                { label: 'Joined', value: formatDateTime(user.createdAt) },
                { label: 'Last updated', value: formatDateTime(user.updatedAt) }
              ]
            : []
        }
      >
        {isAdminAccount && (
          <Alert variant="info">Admin accounts can&apos;t be edited or deleted here.</Alert>
        )}
      </AdminResourceDetail>

      {editing && user && (
        <EditUserModal
          key={user.id}
          user={user}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}

      {deleting && user && (
        <DeleteUserModal
          key={user.id}
          user={user}
          onClose={() => setDeleting(false)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}

export default AdminUserDetails;