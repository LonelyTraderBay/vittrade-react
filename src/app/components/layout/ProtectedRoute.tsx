import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/shared/session/useAuth';

/**
 * ProtectedRoute — Gate for authenticated-only routes
 * Redirects to /auth/login if not authenticated.
 * Preserves the intended destination in location state for redirect-after-login.
 */
interface ProtectedRouteProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export function ProtectedRoute({
  requiredRoles = [],
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div role="status" aria-label="Đang kiểm tra phiên đăng nhập">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!isAuthenticated) {
    // Determine if we're in responsive shell
    const isResponsive = location.pathname.startsWith('/r/');
    const loginPath = isResponsive ? '/r/auth/login' : '/auth/login';
    const returnTo = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to={loginPath} state={{ from: returnTo }} replace />;
  }

  if (user?.accountStatus && user.accountStatus !== 'active') {
    return (
      <div role="alert">
        Tài khoản hiện không thể truy cập khu vực này. Vui lòng liên hệ bộ phận hỗ trợ.
      </div>
    );
  }

  const hasRequiredRoles = requiredRoles.every((role) => hasRole(role));
  const hasRequiredPermissions = requiredPermissions.every((permission) =>
    hasPermission(permission),
  );
  if (!hasRequiredRoles || !hasRequiredPermissions) {
    return <div role="alert">Bạn không có quyền truy cập chức năng này.</div>;
  }

  return <Outlet />;
}
