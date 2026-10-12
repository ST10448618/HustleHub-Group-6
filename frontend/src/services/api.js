import axios from 'axios';

export const TOKEN_STORAGE_KEY = 'hustlehub_token';

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


api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status ?? null;
    const envelope = error.response?.data;

    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
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