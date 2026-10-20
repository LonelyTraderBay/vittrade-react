import { act, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { LoginPage } from './LoginPage';
import { WebLoginPage } from './WebLoginPage';
import { OTPPage } from './OTPPage';
import { WebOTPPage } from './WebOTPPage';

function RouteProbe() {
  const location = useLocation();
  return (
    <>
      <output data-testid="return-location">
        {location.pathname + location.search + location.hash}
      </output>
      <output data-testid="return-state">{JSON.stringify(location.state)}</output>
    </>
  );
}

function renderFlow(prefix: string, state: unknown, adapter: Partial<AuthAdapter>) {
  return renderWithProviders(
    <>
      <Routes>
        {['', '/t', '/r'].flatMap((shell) => [
          <Route key={`${shell}-login`} path={`${shell}/auth/login`} element={<LoginPage />} />,
          <Route key={`${shell}-otp`} path={`${shell}/auth/otp`} element={<OTPPage />} />,
        ])}
        <Route path="/w/auth/login" element={<WebLoginPage />} />
        <Route path="/w/auth/otp" element={<WebOTPPage />} />
        <Route path="*" element={<p>Destination</p>} />
      </Routes>
      <RouteProbe />
    </>,
    {
      routerProps: { initialEntries: [{ pathname: `${prefix}/auth/login`, state }] },
      authAdapter: { ...testAuthAdapter, initialSession: null, ...adapter },
    },
  );
}

afterEach(() => vi.useRealTimers());

describe('Auth preserves its local destination contract', () => {
  it.each(['', '/t', '/r', '/w'])(
    'password login returns to the intended URL in %s',
    async (prefix) => {
      const destination = `${prefix}/wallet/transfer?origin=c06&asset=BTC%2FUSDT#amount`;
      const login = vi.fn(async () => ({
        status: 'authenticated' as const,
        session: testAuthSession,
      }));
      renderFlow(prefix, { from: destination }, { login });
      await userEvent.type(screen.getByTestId('auth-email'), 'member@vittrade.local');
      await userEvent.type(screen.getByTestId('auth-password'), 'Preview-123!');
      await userEvent.click(screen.getByTestId('auth-submit'));
      await waitFor(() =>
        expect(screen.getByTestId('return-location')).toHaveTextContent(destination),
      );
      expect(login).toHaveBeenCalledExactlyOnceWith({
        email: 'member@vittrade.local',
        password: 'Preview-123!',
      });
    },
  );

  it.each(['', '/t', '/r', '/w'])(
    'MFA retains the same URL and verification payload in %s',
    async (prefix) => {
      vi.useFakeTimers();
      const destination = `${prefix}/wallet/transfer?origin=c06#amount`;
      const login = vi.fn(async () => ({
        status: 'mfa_required' as const,
        challenge: {
          id: 'return-challenge',
          method: 'email' as const,
          maskedDestination: 'm***@vittrade.local',
          expiresAt: '9999-01-01T00:05:00.000Z',
        },
      }));
      const verifyLoginMfa = vi.fn(async () => testAuthSession);
      const verifyMfa = vi.fn(testAuthAdapter.verifyMfa);
      renderFlow(prefix, { from: destination }, { login, verifyLoginMfa, verifyMfa });
      fireEvent.change(screen.getByTestId('auth-email'), {
        target: { value: 'mfa@vittrade.local' },
      });
      fireEvent.change(screen.getByTestId('auth-password'), {
        target: { value: 'Preview-123!' },
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('auth-submit'));
      });
      expect(screen.getByTestId('return-location')).toHaveTextContent(`${prefix}/auth/otp`);
      expect(JSON.parse(screen.getByTestId('return-state').textContent!)).toMatchObject({
        from: destination,
      });
      const inputs = screen
        .getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })
        .querySelectorAll('input');
      fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000); // Existing Web success-animation deadline is 1800ms.
      });
      expect(screen.getByTestId('return-location')).toHaveTextContent(destination);
      expect(verifyLoginMfa).toHaveBeenCalledExactlyOnceWith({
        challengeId: 'return-challenge',
        code: '123456',
      });
      expect(verifyMfa).not.toHaveBeenCalled();
    },
  );

  it('uses the existing Web session-expired returnTo state', async () => {
    const destination = '/w/wallet/history?type=withdraw#recent';
    renderFlow(
      '/w',
      { returnTo: destination },
      {
        login: async () => ({ status: 'authenticated', session: testAuthSession }),
      },
    );
    await userEvent.type(screen.getByTestId('auth-email'), 'member@vittrade.local');
    await userEvent.type(screen.getByTestId('auth-password'), 'Preview-123!');
    await userEvent.click(screen.getByTestId('auth-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('return-location')).toHaveTextContent(destination),
    );
  });
});
