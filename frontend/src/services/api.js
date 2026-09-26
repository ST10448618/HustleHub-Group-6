import axios from 'axios';

/**
 * The single localStorage key used for the JWT, everywhere. Exported
 * so authService and AuthContext (Phase 3) read/write the exact same
 * key rather than each hardcoding their own string.
 */
export const TOKEN_STORAGE_KEY = 'hustlehub_token';

/**
 * Dispatched on window whenever a request comes back 401 (missing,
 * invalid, or expired token - or a user deleted after their token was
 * issued). AuthContext listens for this in Phase 3 to clear its state
 * and redirect to the session-expired screen.
 *
 * This is a small Observer-pattern hookup using the browser's native
 * CustomEvent, rather than importing AuthContext directly into this
 * file. Doing it that way would create a circular dependency (this
 * file is used by every service, which AuthContext itself calls into)
 * and would also mean this transport-layer file needs to know about
 * React state, which it shouldn't. A plain browser event keeps this
 * file a pure, framework-agnostic HTTP client.
 */
export const SESSION_EXPIRED_EVENT = 'hustlehub:session-expired';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Request interceptor: attach the bearer token to every request, when
// one is present. No component or service ever sets this header
// itself.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor.
 *
 * On success: unwraps the backend's envelope so every service
 * function receives { success, message, data } directly, instead of
 * having to reach into response.data itself every time.
 *
 * On error: builds one consistent error shape - { status, message,
 * errors } - regardless of whether it was a validation 400 (which
 * has an errors[] array), a business-rule 400/403/404/409 (message
 * only), a 429 (message only, already user-safe as-is), a 500
 * (generic safe message), or a genuine network failure (no response
 * at all). Every catch block anywhere in the app can rely on this
 * exact shape rather than each one re-deriving it from a raw axios
 * error.
 *
 * On 401 specifically: clears the stored token and fires
 * SESSION_EXPIRED_EVENT globally. This is the ONLY place 401 is
 * handled in the whole app - no component or page should ever check
 * for a 401 itself.
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status ?? null;
    const envelope = error.response?.data;

    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    const message =
      envelope?.message ||
      (status
        ? 'Something went wrong. Please try again.'
        : 'Connection problem. Please check your network and try again.');

    return Promise.reject({
      status,
      message,
      errors: envelope?.errors || null
    });
  }
);

export default api;