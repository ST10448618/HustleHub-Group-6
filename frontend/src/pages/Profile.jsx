import PageHeader from '../components/layout/PageHeader.jsx';
import Avatar from '../components/common/Avatar.jsx';
import Alert from '../components/common/Alert.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/useAuth.js';
import { formatDate } from '../utils/formatDate.js';
import { getRoleLabel } from '../utils/userDisplay.js';
import './Profile.css';

/**
 * Screen 10. A read-only view of the signed-in user's account. There is
 * deliberately no edit form: the backend has no endpoint for a user to
 * change their own name, email or password. The details come from
 * AuthContext's currentUser, which IS the GET /auth/me result (loaded
 * at sign-in and whenever a session is restored), so there is no second
 * request or loading state to manage.
 */
function Profile() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  const dashboardPath = `/${currentUser.role.toLowerCase()}/dashboard`;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />

      <div className="profile">
        <section className="card">
          <div className="profile-identity">
            <Avatar name={currentUser.name} size={72} />
            <div>
              <h2 className="profile-name">{currentUser.name}</h2>
              <p className="profile-role">{getRoleLabel(currentUser.role)}</p>
            </div>
          </div>

          <dl className="profile-list">
            <div>
              <dt>Name</dt>
              <dd>{currentUser.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{currentUser.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{getRoleLabel(currentUser.role)}</dd>
            </div>
            <div>
              <dt>Member Since</dt>
              <dd>{formatDate(currentUser.createdAt)}</dd>
            </div>
          </dl>
        </section>

        <Alert variant="info">
          Account details can&apos;t be edited from here. To change your name or email, contact an
          administrator.
        </Alert>

        <div>
          <Button variant="secondary" to={dashboardPath}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </>
  );
}

export default Profile;