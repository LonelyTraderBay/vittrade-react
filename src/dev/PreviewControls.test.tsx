import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionProvider } from '@/shared/session/AuthContext';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import type { LoginResult } from '@/shared/session/session-types';
import { ApiError } from '@/shared/api/api-error';
import { queryClient } from '@/shared/api/query-client';
import { TEST_AUTH_USER } from '@/test/fixtures/auth-user';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import {
  getDevPreviewScenario,
  resetDevMockRuntime,
  setDevPreviewScenario,
} from './mocks/scenario-runtime';
import { PreviewControls } from './PreviewControls';

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderPreview(
  login: AuthAdapter['login'] = async () => ({
    status: 'authenticated',
    session: {
      ...testAuthSession,
      user: { ...TEST_AUTH_USER, id: 'dev-developer', email: 'developer@vittrade.local' },
    },
  }),
) {
  const adapter: AuthAdapter = {
    ...testAuthAdapter,
    initialSession: testAuthSession,
    login: vi.fn(login),
    logout: vi.fn(testAuthAdapter.logout),
  };
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <>
            <PreviewControls />
            <CurrentPath />
          </>
        ),
      },
    ],
    { initialEntries: ['/w/auth/login'] },
  );

  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider adapter={adapter}>
        <RouterProvider router={router} />
      </AuthSessionProvider>
    </QueryClientProvider>,
  );

  return { ...view, router, adapter };
}

async function openControls(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Mở công cụ xem trước' }));
}

describe('development mock preview controls', () => {
  beforeEach(() => {
    queryClient.clear();
    resetDevMockRuntime();
  });
  afterEach(() => {
    queryClient.clear();
    resetDevMockRuntime();
    vi.unstubAllGlobals();
  });

  it('shows the mock warning and switches persona through the auth adapter after clearing account data', async () => {
    const user = userEvent.setup();
    const { router, adapter } = renderPreview();
    queryClient.setQueryData(['wallet', 'assets'], { owner: 'previous-account' });

    expect(screen.getByRole('status', { name: 'Mock data warning' })).toHaveTextContent(
      'DỮ LIỆU MÔ PHỎNG',
    );
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Tài khoản xem trước'), 'developer');
    await user.click(screen.getByRole('button', { name: 'Áp dụng tài khoản' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/home'));
    expect(adapter.logout).toHaveBeenCalledOnce();
    expect(adapter.login).toHaveBeenCalledWith({
      email: 'developer@vittrade.local',
      password: 'Preview-123!',
    });
    expect(queryClient.getQueryData(['wallet', 'assets'])).toBeUndefined();
  });

  it('switches to the dedicated Support mock persona', async () => {
    const user = userEvent.setup();
    const { router, adapter } = renderPreview();
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Tài khoản xem trước'), 'support');
    await user.click(screen.getByRole('button', { name: 'Áp dụng tài khoản' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/home'));
    expect(adapter.login).toHaveBeenCalledWith({
      email: 'support@vittrade.local',
      password: 'Preview-123!',
    });
  });

  it('routes MFA and locked personas to their actual authentication states', async () => {
    const mfaUser = userEvent.setup();
    const mfa = renderPreview(
      async () =>
        ({
          status: 'mfa_required',
          challenge: {
            id: 'preview-mfa-1',
            method: 'email',
            maskedDestination: 'm***@vittrade.local',
            expiresAt: '2099-01-01T00:00:00.000Z',
          },
        }) satisfies LoginResult,
    );
    await openControls(mfaUser);
    await mfaUser.selectOptions(screen.getByLabelText('Tài khoản xem trước'), 'mfa');
    await mfaUser.click(screen.getByRole('button', { name: 'Áp dụng tài khoản' }));

    await waitFor(() => expect(mfa.router.state.location.pathname).toBe('/w/auth/otp'));
    expect(mfa.router.state.location.state).toMatchObject({
      challengeId: 'preview-mfa-1',
      method: 'email',
    });

    mfa.unmount();
    mfa.router.dispose();
    const lockedUser = userEvent.setup();
    const locked = renderPreview(async () => {
      throw new ApiError('Account locked', { status: 423 });
    });
    await openControls(lockedUser);
    await lockedUser.selectOptions(screen.getByLabelText('Tài khoản xem trước'), 'locked');
    await lockedUser.click(screen.getByRole('button', { name: 'Áp dụng tài khoản' }));

    await waitFor(() =>
      expect(locked.router.state.location.pathname).toBe('/w/auth/account-locked'),
    );
    expect(screen.getByRole('status', { name: 'Mock data warning' })).toBeVisible();
    locked.router.dispose();
  });

  it('opens a selected screen shortcut and clearly labels it as a route preview', async () => {
    const user = userEvent.setup();
    const { router } = renderPreview();
    await openControls(user);
    const scenarioControl = screen.getByLabelText('Kịch bản màn hình');
    expect(screen.getByTestId('preview-scenario-note')).toHaveTextContent(/chỉ chuyển trang/i);
    await user.selectOptions(scenarioControl, 'markets');
    await user.click(screen.getByRole('button', { name: 'Mở màn hình' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/markets'));
    router.dispose();
  });

  it('opens the Earn savings portfolio from the screen preview selector', async () => {
    const user = userEvent.setup();
    const { router } = renderPreview();
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Kịch bản màn hình'), 'earn');
    await user.click(screen.getByRole('button', { name: 'Mở màn hình' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/earn/savings/portfolio'));
    router.dispose();
  });

  it('opens the Earn savings history from the screen preview selector', async () => {
    const user = userEvent.setup();
    const { router } = renderPreview();
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Kịch bản màn hình'), 'earnHistory');
    await user.click(screen.getByRole('button', { name: 'Mở màn hình' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/earn/savings/history'));
    router.dispose();
  });

  it('opens Discovery search from the screen preview selector', async () => {
    const user = userEvent.setup();
    const { router } = renderPreview();
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Kịch bản màn hình'), 'discovery');
    await user.click(screen.getByRole('button', { name: 'Mở màn hình' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/search'));
    router.dispose();
  });

  it('selects a scenario and refreshes only the selected domain queries', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    await user.selectOptions(screen.getByLabelText('Miền API'), 'wallet');
    await user.selectOptions(screen.getByLabelText('Trạng thái phản hồi'), 'forbidden');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'wallet', state: 'forbidden' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallet'] });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'vittrade.dev-preview.scenario',
      JSON.stringify({ domain: 'wallet', state: 'forbidden' }),
    );
  });

  it('offers empty data only for domains with contract-shaped read scenarios', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    const domain = screen.getByLabelText('Miền API');
    const state = screen.getByLabelText('Trạng thái phản hồi');
    const emptyOption = screen.getByRole('option', { name: /dữ liệu rỗng/i });

    await user.selectOptions(domain, 'auth');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'auth', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['auth'] });

    await user.selectOptions(domain, 'arena');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'arena', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['arena'] });

    await user.selectOptions(domain, 'admin');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'admin', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin'] });

    await user.selectOptions(domain, 'dca');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'dca', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dca'] });

    await user.selectOptions(domain, 'market');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'market', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['market'] });

    await user.selectOptions(domain, 'trading');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'trading', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['trading'] });

    await user.selectOptions(domain, 'earn');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'earn', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['earn'] });

    await user.selectOptions(domain, 'discovery');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'discovery', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['discovery'] });

    await user.selectOptions(domain, 'referral');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'referral', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['referral'] });

    await user.selectOptions(domain, 'p2p');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'p2p', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['p2p'] });

    await user.selectOptions(domain, 'predictions');
    expect(emptyOption).toBeEnabled();
    await user.selectOptions(state, 'empty');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'predictions', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['predictions'] });

    await user.selectOptions(domain, 'wallet');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'wallet', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['wallet'] });

    await user.selectOptions(domain, 'profile');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'profile', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] });

    await user.selectOptions(domain, 'support');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'support', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['support'] });

    await user.selectOptions(domain, 'launchpad');
    expect(emptyOption).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'launchpad', state: 'empty' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['launchpad'] });
  });

  it('allows Profile loading scenarios for its permission-gated read surfaces', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    await user.selectOptions(screen.getByLabelText('Miền API'), 'profile');
    const loadingOption = screen.getByRole('option', { name: /đang tải/i });
    expect(loadingOption).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Trạng thái phản hồi'), 'loading');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'profile', state: 'loading' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] });
  });

  it('allows the local Profile error scenario and refreshes Profile queries', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    await user.selectOptions(screen.getByLabelText('Miền API'), 'profile');
    const errorOption = screen.getByRole('option', {
      name: /lỗi dịch vụ.*http\/transport mô phỏng/i,
    });
    expect(errorOption).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Trạng thái phản hồi'), 'error');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'profile', state: 'error' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] });
  });

  it('allows Arena transport errors without labeling them as an HTTP status', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    await user.selectOptions(screen.getByLabelText('Miền API'), 'arena');
    const errorOption = screen.getByRole('option', {
      name: /lỗi dịch vụ.*http\/transport mô phỏng/i,
    });
    expect(errorOption).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Trạng thái phản hồi'), 'error');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'arena', state: 'error' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['arena'] });
  });

  it('allows the Profile unauthorized session scenario and refreshes Profile queries', async () => {
    const user = userEvent.setup();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    renderPreview();
    await openControls(user);

    await user.selectOptions(screen.getByLabelText('Miền API'), 'profile');
    const unauthorizedOption = screen.getByRole('option', { name: /chưa xác thực.*http 401/i });
    expect(unauthorizedOption).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Trạng thái phản hồi'), 'unauthorized');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'profile', state: 'unauthorized' });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['profile'] });
  });

  it('offers pending scenarios for Earn, P2P, Predictions, Trading and Wallet where supported', async () => {
    const user = userEvent.setup();
    renderPreview();
    await openControls(user);

    const domain = screen.getByLabelText('Miền API');
    const state = screen.getByLabelText('Trạng thái phản hồi');
    const pendingOption = screen.getByRole('option', {
      name: /đang xử lý.*receipt hoặc request-in-flight theo hợp đồng/i,
    });
    expect(pendingOption).toBeEnabled();

    await user.selectOptions(domain, 'earn');
    expect(pendingOption).toBeEnabled();
    await user.selectOptions(state, 'pending');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'earn', state: 'pending' });

    await user.selectOptions(domain, 'p2p');
    expect(pendingOption).toBeEnabled();
    await user.selectOptions(state, 'pending');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'p2p', state: 'pending' });

    await user.selectOptions(domain, 'predictions');
    expect(pendingOption).toBeEnabled();
    await user.selectOptions(state, 'pending');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'predictions', state: 'pending' });

    await user.selectOptions(domain, 'trading');
    expect(pendingOption).toBeEnabled();
    await user.selectOptions(state, 'pending');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'trading', state: 'pending' });

    await user.selectOptions(domain, 'wallet');
    expect(pendingOption).toBeEnabled();
    await user.selectOptions(state, 'pending');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));
    expect(getDevPreviewScenario()).toEqual({ domain: 'wallet', state: 'pending' });
  });

  it('offers contract-declared duplicate/conflict responses for P2P and Predictions', async () => {
    const user = userEvent.setup();
    renderPreview();
    await openControls(user);

    const domain = screen.getByLabelText('Miền API');
    const state = screen.getByLabelText('Trạng thái phản hồi');
    const duplicateOption = screen.getByRole('option', {
      name: /xung đột đơn.*HTTP 409 theo contract/i,
    });

    expect(duplicateOption).toBeDisabled();
    await user.selectOptions(domain, 'p2p');
    expect(duplicateOption).toBeEnabled();
    await user.selectOptions(state, 'duplicate');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'p2p', state: 'duplicate' });

    await user.selectOptions(domain, 'predictions');
    expect(duplicateOption).toBeEnabled();
    await user.selectOptions(state, 'duplicate');
    await user.click(screen.getByRole('button', { name: 'Áp dụng trạng thái API' }));

    expect(getDevPreviewScenario()).toEqual({ domain: 'predictions', state: 'duplicate' });
  });

  it('restores the selected domain and state from the active scenario after reload', async () => {
    const user = userEvent.setup();
    setDevPreviewScenario({ domain: 'market', state: 'loading' });
    renderPreview();
    await openControls(user);

    expect(screen.getByLabelText('Miền API')).toHaveValue('market');
    expect(screen.getByLabelText('Trạng thái phản hồi')).toHaveValue('loading');
    expect(screen.getByTestId('active-preview-scenario')).toHaveTextContent('market.loading');
  });

  it('resets mock state by signing out, clearing query data, and reloading the page', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    const { adapter } = renderPreview();
    queryClient.setQueryData(['wallet', 'assets'], { owner: 'previous-account' });
    await openControls(user);
    await user.click(screen.getByRole('button', { name: 'Đặt lại dữ liệu mock' }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(adapter.logout).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(['wallet', 'assets'])).toBeUndefined();
    vi.unstubAllGlobals();
  });

  it('returns to the shell login route when guest is selected', async () => {
    const user = userEvent.setup();
    const { router } = renderPreview();
    await openControls(user);
    await user.selectOptions(screen.getByLabelText('Tài khoản xem trước'), 'guest');
    await user.click(screen.getByRole('button', { name: 'Áp dụng tài khoản' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/auth/login'));
    router.dispose();
  });
});
