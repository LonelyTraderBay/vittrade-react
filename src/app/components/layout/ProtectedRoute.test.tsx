import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { AuthAdapter } from '../../contexts/AuthContext';
import type { AuthSession } from '../../api/auth-api';
import { AuthSessionProvider } from '../../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

const session: AuthSession = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    fullName: 'Production User',
    roles: ['trader'],
    permissions: ['trade:read'],
    kycStatus: 'verified',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'memory-only-token',
};

function createAdapter(initialSession: AuthSession | null): AuthAdapter {
  return {
    initialSession,
    async login() {
      return { status: 'authenticated', session };
    },
    async getSession() {
      return initialSession;
    },
    async logout() {},
    async refresh() {
      return initialSession;
    },
  };
}

function LoginProbe() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '';
  return <div data-testid="login">login:{from}</div>;
}

function renderRoute(
  initialSession: AuthSession | null,
  initialEntry: string,
  requiredRoles: string[] = [],
  requiredPermissions: string[] = [],
) {
  return render(
    <AuthSessionProvider adapter={createAdapter(initialSession)}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute
                requiredRoles={requiredRoles}
                requiredPermissions={requiredPermissions}
              />
            }
          >
            <Route path="/trade" element={<div>protected</div>} />
          </Route>
          <Route path="/auth/login" element={<LoginProbe />} />
          <Route path="/r/auth/login" element={<LoginProbe />} />
        </Routes>
      </MemoryRouter>
    </AuthSessionProvider>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users and preserves query/hash state', () => {
    renderRoute(null, '/trade?symbol=BTC%2FUSDT#order-book');

    expect(screen.getByTestId('login')).toHaveTextContent(
      'login:/trade?symbol=BTC%2FUSDT#order-book',
    );
  });

  it('renders the protected route for an active authorized session', () => {
    renderRoute(session, '/trade');

    expect(screen.getByText('protected')).toBeInTheDocument();
  });

  it('blocks locked accounts before rendering protected content', () => {
    renderRoute(
      {
        ...session,
        user: { ...session.user, accountStatus: 'locked' },
      },
      '/trade',
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Tài khoản hiện không thể truy cập');
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('blocks sessions without the required permission', () => {
    renderRoute(session, '/trade', [], ['trade:write']);

    expect(screen.getByRole('alert')).toHaveTextContent('Bạn không có quyền truy cập');
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });
});
