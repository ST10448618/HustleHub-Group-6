import { Routes, Route } from 'react-router-dom'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'
import SessionExpired from './pages/public/SessionExpired.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { useAuth } from './context/useAuth.js'

/**
 * TEMPORARY Phase 3 verification page ONLY.
 *
 * Exists purely to prove the whole auth loop end-to-end - register,
 * auto-login, session persists across a refresh, logout - before any
 * real dashboard exists. It is rendered at the exact final dashboard
 * paths from the locked routes table (/client/dashboard etc.), each
 * correctly role-gated by ProtectedRoute, so Phase 6 only has to swap
 * this one placeholder component out per route for the real dashboard
 * - the routing structure itself does not need to change.
 */
function AuthCheckPage() {
  const { currentUser, logout } = useAuth()
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h2>You are logged in</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
          Name: {currentUser?.name}
          <br />
          Email: {currentUser?.email}
          <br />
          Role: {currentUser?.role}
        </p>
        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: 'var(--space-5)',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-3) var(--space-5)',
            cursor: 'pointer'
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function ScaffoldCheck() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)' }}>
          HUSTLEHUB<span style={{ color: 'var(--color-accent)' }}>+</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          Phase 3 auth foundation is wired up. Try{' '}
          <a href="/register">/register</a> or <a href="/login">/login</a>.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/session-expired" element={<SessionExpired />} />

      <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
        <Route path="/client/dashboard" element={<AuthCheckPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['FREELANCER']} />}>
        <Route path="/freelancer/dashboard" element={<AuthCheckPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AuthCheckPage />} />
      </Route>

      <Route path="*" element={<ScaffoldCheck />} />
    </Routes>
  )
}

export default App