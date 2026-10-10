import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader.jsx';
import AdminResourceTable from '../../components/admin/AdminResourceTable.jsx';
import EditUserModal from '../../components/admin/EditUserModal.jsx';
import DeleteUserModal from '../../components/admin/DeleteUserModal.jsx';
import { useToast } from '../../components/common/useToast.js';
import { getUsers } from '../../services/adminService.js';
import { formatDate } from '../../utils/formatDate.js';
import { getRoleLabel } from '../../utils/userDisplay.js';
import './AdminUsers.css';

// Stable references, defined once, so the table's filtering doesn't
// recompute on every render of this page.
const ROLE_FILTER = [
  {
    key: 'role',
    label: 'roles',
    options: [
      { value: 'CLIENT', label: 'Client' },
      { value: 'FREELANCER', label: 'Freelancer' },
      { value: 'ADMIN', label: 'Admin' }
    ],
    getValue: (user) => user.role
  }
];
const searchText = (user) => `${user.name} ${user.email}`;

/**
 * Screen 23. Every registered user. GET /admin/users comes back in no
 * particular order, so it is sorted here (newest first). Search and
 * the role filter are client-side. ADMIN rows get View only - the
 * backend refuses to edit or delete an admin, so those buttons are
 * not even offered.
 */
function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [users]
  );

  function handleSaved(updated) {
    setUsers((current) => current.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setEditTarget(null);
    showToast('User updated.', 'success');
  }

  function handleDeleted(deleted) {
    setUsers((current) => current.filter((u) => u.id !== deleted.id));
    setDeleteTarget(null);
    showToast('User deleted.', 'success');
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <Link to={`/admin/users/${user.id}`} className="admin-user-name">
          {user.name}
        </Link>
      )
    },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (user) => getRoleLabel(user.role) },
    { key: 'createdAt', header: 'Joined', render: (user) => formatDate(user.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="admin-row-actions">
          <Link to={`/admin/users/${user.id}`} aria-label={`View ${user.name}`}>
            View
          </Link>
          {user.role !== 'ADMIN' && (
            <>
              <button
                type="button"
                className="admin-row-link"
                aria-label={`Edit ${user.name}`}
                onClick={() => setEditTarget(user)}
              >
                Edit
              </button>
              <button
                type="button"
                className="admin-row-link admin-row-danger"
                aria-label={`Delete ${user.name}`}
                onClick={() => setDeleteTarget(user)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Everyone registered on HustleHub+. Admin accounts can't be edited or deleted here."
      />

      <AdminResourceTable
        columns={columns}
        rows={sortedUsers}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        noun="users"
        searchPlaceholder="Search by name or email"
        searchText={searchText}
        filters={ROLE_FILTER}
        emptyTitle="No users yet"
        emptyDescription="Registered users will appear here."
      />

      {editTarget && (
        <EditUserModal
          key={editTarget.id}
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          key={deleteTarget.id}
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}

export default AdminUsers;