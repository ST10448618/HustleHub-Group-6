import { useContext } from 'react';
import { ToastContext } from './ToastContext.js';

/**
 * useToast().showToast(message, type) - type is 'success' | 'error' |
 * 'info' (default). Throws if used outside a ToastProvider, same
 * defensive pattern as useAuth.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}