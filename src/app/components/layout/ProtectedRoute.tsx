import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute — Gate for authenticated-only routes
 * Redirects to /auth/login if not authenticated.
 * Preserves the intended destination in location state for redirect-after-login.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Determine if we're in responsive shell
    const isResponsive = location.pathname.startsWith('/r/');
    const loginPath = isResponsive ? '/r/auth/login' : '/auth/login';

    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
