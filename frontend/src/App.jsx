import { Routes, Route } from 'react-router-dom'
import Landing from './pages/public/Landing.jsx'
import Marketplace from './pages/public/Marketplace.jsx'
import GigDetails from './pages/public/GigDetails.jsx'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'
import SessionExpired from './pages/public/SessionExpired.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import { useAuth } from './context/useAuth.js'

/**
 * TEMPORARY Phase 3 verification page ONLY - still standing in for the
 * real dashboards, which Phase 6+ will build. See Phase 3's notes for
 * why this is deliberately mounted at the exact final dashboard paths.
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

/**
 * TEMPORARY placeholder for unmatched routes. Screen 32's real 404
 * page is built in Phase 6 alongside the rest of the error pages and
 * the authenticated shell/route wiring - this is just enough to avoid
 * a blank white screen in the meantime.
 */
function NotFoundPlaceholder() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)', textAlign: 'center' }}>
      <h2>Page not found</h2>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
        <a href="/">Return home</a>
      </p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/gigs/:id" element={<GigDetails />} />

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

      <Route path="*" element={<NotFoundPlaceholder />} />
    </Routes>
  )
}

export default App