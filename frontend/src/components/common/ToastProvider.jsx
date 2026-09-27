import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { ToastContext } from './ToastContext.js';
import Toast from './Toast.jsx';
import './Toast.css';

const AUTO_DISMISS_MS = 5000;
let nextToastId = 0;

/**
 * ToastProvider - wraps the whole app (see main.jsx) so any component,
 * anywhere, can call useToast().showToast(...) without prop-drilling.
 * Renders its container through a Portal so toasts always sit above
 * everything else, the same reasoning as Modal.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = nextToastId++;
      setToasts((current) => [...current, { id, message, type }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast]
  );

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((toast) => (
            <Toast key={toast.id} type={toast.type} onDismiss={() => dismissToast(toast.id)}>
              {toast.message}
            </Toast>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}