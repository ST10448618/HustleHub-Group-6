import { Routes, Route } from 'react-router-dom'

/**
 * Temporary Phase 1 placeholder.
 *
 * This file exists right now purely to prove the scaffold boots,
 * React Router is wired up, and the design tokens/global styles are
 * being applied correctly. It gets fully replaced in later phases:
 * Phase 3 adds the real AuthContext + route guards, Phase 6 replaces
 * this with the real AppRoutes.jsx covering all 33 screens from the
 * build reference. Nothing here is meant to survive past that.
 */
function ScaffoldCheck() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--color-primary)' }}>
          HUSTLEHUB<span style={{ color: 'var(--color-accent)' }}>+</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          Phase 1 scaffold is running. React Router, design tokens, and
          global styles are all wired up correctly.
        </p>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="*" element={<ScaffoldCheck />} />
    </Routes>
  )
}

export default App