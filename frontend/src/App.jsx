import AppRoutes from './routes/AppRoutes.jsx'

/**
 * App is now intentionally thin: the whole route table lives in
 * routes/AppRoutes.jsx (build reference section 5). Providers
 * (Router, Toast, Auth) are set up one level up, in main.jsx.
 */
function App() {
  return <AppRoutes />
}

export default App