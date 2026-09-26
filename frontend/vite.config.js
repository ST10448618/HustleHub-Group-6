import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed explicitly (rather than relying on Vite's default) because
    // the backend's CORS config (CLIENT_ORIGIN in backend/.env) must
    // match this exact origin, or every API request will be blocked
    // by the browser.
    port: 5173
  }
})