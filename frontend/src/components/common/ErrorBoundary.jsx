import { Component } from 'react';
import ServerError from '../../pages/ServerError.jsx';

/**
 * Catches errors thrown while a child component is RENDERING and shows
 * the generic Server Error page instead of a blank white screen.
 *
 * React only supports this as a class component (there is no hook
 * equivalent), which is why this is the one class in the codebase.
 *
 * It does NOT catch failed API calls - those are handled where they
 * happen (ErrorState inside each page, the global 401 listener in
 * AuthContext). This is purely the last-resort net for bugs.
 *
 * `resetKey` is the current URL path. When it changes (the user
 * navigated somewhere else), getDerivedStateFromProps clears the error
 * so one crashed page doesn't block the rest of the app. This is
 * React's documented way to reset state when a prop changes - and,
 * unlike putting a `key` on the boundary, it does NOT remount the
 * whole app (which would reset the sidebar and refetch every page).
 */
class ErrorBoundary extends Component {
  state = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error) {
    // Logged for developers only - never shown to the user.
    console.error('Unhandled render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return <ServerError />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;