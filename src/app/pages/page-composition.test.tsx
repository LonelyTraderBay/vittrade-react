import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/shared/config/env';
import { AssetDetailPage } from './wallet/AssetDetailPage';
import { DCAPage } from './dca/DCAPage';
import { P2PHomePage } from './p2p/P2PHomePage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { WebRegisterPage } from '@/features/auth/pages/WebRegisterPage';
import { TradePage } from '@/features/trading/pages/TradePage';

const mocks = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  trackDeepLink: vi.fn(),
  trackPlanCreation: vi.fn(),
  trackPlanStatusChange: vi.fn(),
  trackPlanDeletion: vi.fn(),
  trackAssetDetailButton: vi.fn(),
  trackWalletPageView: vi.fn(),
  trackWalletCreateSheetOpened: vi.fn(),
  trackAssetCreateSheetOpened: vi.fn(),
  trackPreselectedCoinUsed: vi.fn(),
  trackButtonImpression: vi.fn(),
  trackButtonClick: vi.fn(),
  quickActionsOpened: vi.fn(),
  contextMenuOpened: vi.fn(),
  pageViewTracked: vi.fn(),
  dcaMainPage: vi.fn((_props: unknown) => null),
  p2pMarketplacePage: vi.fn((_props: unknown) => null),
  walletAssetDetailPage: vi.fn((_props: unknown) => undefined),
  tradeTerminal: vi.fn(() => null),
  useDCAEnabled: vi.fn(() => true),
  useDCAAssetDetailButton: vi.fn(() => true),
}));

vi.mock('@/features/dca', () => ({
  useDCAAnalytics: () => ({
    trackEvent: mocks.trackEvent,
    trackDeepLink: mocks.trackDeepLink,
    trackPlanCreation: mocks.trackPlanCreation,
    trackPlanStatusChange: mocks.trackPlanStatusChange,
    trackPlanDeletion: mocks.trackPlanDeletion,
    trackAssetDetailButton: mocks.trackAssetDetailButton,
  }),
  useWalletToCreationFunnel: () => ({
    trackDCAPageView: mocks.trackWalletPageView,
    trackCreateSheetOpened: mocks.trackWalletCreateSheetOpened,
    trackButtonImpression: mocks.trackButtonImpression,
    trackButtonClick: mocks.trackButtonClick,
  }),
  useAssetToCreationFunnel: () => ({
    trackCreateSheetOpened: mocks.trackAssetCreateSheetOpened,
    trackPreselectedCoinUsed: mocks.trackPreselectedCoinUsed,
    trackButtonImpression: mocks.trackButtonImpression,
    trackButtonClick: mocks.trackButtonClick,
  }),
  usePageViewTracking: mocks.pageViewTracked,
}));

vi.mock('@/features/dca/pages/DCAMainPage', () => ({ DCAMainPage: mocks.dcaMainPage }));
vi.mock('@/app/hooks/useFeatureFlag', () => ({
  useDCAEnabled: mocks.useDCAEnabled,
  useDCAAssetDetailButton: mocks.useDCAAssetDetailButton,
}));
vi.mock('@/app/hooks/useSheetAnalytics', () => ({
  useSheetAnalytics: (name: string) => ({
    onAfterOpen:
      name === 'p2p-home-quick-actions' ? mocks.quickActionsOpened : mocks.contextMenuOpened,
  }),
}));
vi.mock('@/features/p2p/pages/P2PMarketplacePage', () => ({
  P2PMarketplacePage: mocks.p2pMarketplacePage,
}));
vi.mock('@/features/wallet/pages/AssetDetailPage', () => ({
  WalletAssetDetailPage: (props: Record<string, unknown>) => {
    mocks.walletAssetDetailPage(props);
    return null;
  },
}));
vi.mock('@/features/auth/components/RegistrationForm', () => ({
  RegistrationForm: () => <div data-testid="registration-form" />,
}));
vi.mock('@/features/trading/components/TradeTerminal', () => ({
  TradeTerminal: mocks.tradeTerminal,
}));

function CurrentPath() {
  return <output aria-label="current path">{useLocation().pathname}</output>;
}

function renderAt(path: string, page: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              {page}
              <CurrentPath />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('app page composition', () => {
  it('passes DCA feature state, analytics, and funnel contracts to the feature page', () => {
    renderAt('/t/dca', <DCAPage />);

    expect(mocks.pageViewTracked).toHaveBeenCalledWith('dca_page');
    expect(mocks.dcaMainPage.mock.calls[0]?.[0]).toEqual({
      isEnabled: true,
      isDevelopment: env.isDev,
      analytics: {
        trackEvent: mocks.trackEvent,
        trackDeepLink: mocks.trackDeepLink,
        trackPlanCreation: mocks.trackPlanCreation,
        trackPlanStatusChange: mocks.trackPlanStatusChange,
        trackPlanDeletion: mocks.trackPlanDeletion,
      },
      funnels: {
        trackWalletPageView: mocks.trackWalletPageView,
        trackWalletCreateSheetOpened: mocks.trackWalletCreateSheetOpened,
        trackAssetCreateSheetOpened: mocks.trackAssetCreateSheetOpened,
        trackPreselectedCoinUsed: mocks.trackPreselectedCoinUsed,
      },
    });
  });

  it('connects P2P sheet-open analytics to the matching marketplace callbacks', () => {
    renderAt('/p2p', <P2PHomePage />);

    expect(mocks.p2pMarketplacePage.mock.calls[0]?.[0]).toEqual({
      onQuickActionsOpen: mocks.quickActionsOpened,
      onContextMenuOpen: mocks.contextMenuOpened,
    });
  });

  it('records wallet asset DCA impressions and clicks through their feature callbacks', () => {
    renderAt('/wallet/asset/BTC', <AssetDetailPage />);

    const props = mocks.walletAssetDetailPage.mock.calls[0][0] as {
      showDCAButton: boolean;
      onDCAImpression: (symbol: string) => void;
      onDCAButtonClick: (symbol: string) => void;
    };
    expect(props.showDCAButton).toBe(true);
    props.onDCAImpression('BTC');
    props.onDCAButtonClick('ETH');

    expect(mocks.trackButtonImpression).toHaveBeenCalledOnce();
    expect(mocks.trackButtonClick).toHaveBeenCalledOnce();
    expect(mocks.trackAssetDetailButton).toHaveBeenNthCalledWith(1, 'impression', 'BTC');
    expect(mocks.trackAssetDetailButton).toHaveBeenNthCalledWith(2, 'click', 'ETH');
  });

  it('routes phone and web registration links to their shell-specific login paths', () => {
    const phone = renderAt('/t/auth/register', <RegisterPage />);
    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByLabelText('current path')).toHaveTextContent('/t/auth/login');
    phone.unmount();

    renderAt('/w/auth/register', <WebRegisterPage />);
    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByLabelText('current path')).toHaveTextContent('/w/auth/login');
  });

  it('keeps the trade route as a thin terminal boundary', () => {
    renderAt('/trade', <TradePage />);

    expect(mocks.tradeTerminal).toHaveBeenCalledOnce();
  });
});
