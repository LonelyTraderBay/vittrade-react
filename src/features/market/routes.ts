import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const MarketOverviewPage = lazyRoute(() =>
  import('./pages/MarketOverviewPage').then((module) => ({
    default: module.MarketOverviewPage,
  })),
);
const MarketMoversPage = lazyRoute(() =>
  import('./pages/MarketMoversPage').then((module) => ({
    default: module.MarketMoversPage,
  })),
);
const MarketNewsFeedPage = lazyRoute(() =>
  import('./pages/MarketNewsFeedPage').then((module) => ({ default: module.MarketNewsFeedPage })),
);
const MarketEventCalendarPage = lazyRoute(() =>
  import('./pages/MarketEventCalendarPage').then((module) => ({
    default: module.MarketEventCalendarPage,
  })),
);
const MarketCorrelationPairsPage = lazyRoute(() =>
  import('./pages/MarketCorrelationPairsPage').then((module) => ({
    default: module.MarketCorrelationPairsPage,
  })),
);
const TokenUnlockSchedulePage = lazyRoute(() =>
  import('./pages/TokenUnlockSchedulePage').then((module) => ({
    default: module.TokenUnlockSchedulePage,
  })),
);
const MarketDerivativesPage = lazyRoute(() =>
  import('./pages/MarketDerivativesPage').then((module) => ({
    default: module.MarketDerivativesPage,
  })),
);
const MarketSentimentPage = lazyRoute(() =>
  import('./pages/MarketSentimentPage').then((module) => ({ default: module.MarketSentimentPage })),
);
const MarketSignalsPage = lazyRoute(() =>
  import('./pages/MarketSignalsPage').then((module) => ({ default: module.MarketSignalsPage })),
);
const MarketSectorsPage = lazyRoute(() =>
  import('./pages/MarketSectorsPage').then((module) => ({
    default: module.MarketSectorsPage,
  })),
);
const WatchlistPage = lazyRoute(() =>
  import('./pages/WatchlistPage').then((module) => ({ default: module.WatchlistPage })),
);
const MarketHeatmapPage = lazyRoute(() =>
  import('./pages/MarketHeatmapPage').then((module) => ({
    default: module.MarketHeatmapPage,
  })),
);
const MarketPriceAlertsPage = lazyRoute(() =>
  import('./pages/MarketPriceAlertsPage').then((module) => ({
    default: module.MarketPriceAlertsPage,
  })),
);
const MarketScreenerPage = lazyRoute(() =>
  import('./pages/MarketScreenerPage').then((module) => ({
    default: module.MarketScreenerPage,
  })),
);
const MarketComparisonPage = lazyRoute(() =>
  import('./pages/MarketComparisonPage').then((module) => ({
    default: module.MarketComparisonPage,
  })),
);
const MarketDepthPage = lazyRoute(() =>
  import('./pages/MarketDepthPage').then((module) => ({ default: module.MarketDepthPage })),
);
const AdvancedChartsPage = lazyRoute(() =>
  import('./pages/AdvancedChartsPage').then((module) => ({
    default: module.AdvancedChartsPage,
  })),
);
const TokenInfoPage = lazyRoute(() =>
  import('./pages/TokenInfoPage').then((module) => ({ default: module.TokenInfoPage })),
);

export interface MarketRouteComponents {
  pairDetail: ComponentType;
}

/** Route market theo contract, dùng chung cho tất cả platform shell. */
export function createMarketPublicRoutes(components: MarketRouteComponents): RouteObject[] {
  return [
    { path: 'markets/overview', Component: MarketOverviewPage },
    { path: 'markets/movers', Component: MarketMoversPage },
    { path: 'markets/news', Component: MarketNewsFeedPage },
    { path: 'markets/calendar', Component: MarketEventCalendarPage },
    { path: 'markets/correlations', Component: MarketCorrelationPairsPage },
    { path: 'markets/unlocks', Component: TokenUnlockSchedulePage },
    { path: 'markets/derivatives', Component: MarketDerivativesPage },
    { path: 'markets/social-sentiment', Component: MarketSentimentPage },
    { path: 'markets/signals', Component: MarketSignalsPage },
    { path: 'markets/sectors', Component: MarketSectorsPage },
    { path: 'markets/watchlist', Component: WatchlistPage },
    { path: 'markets/heatmap', Component: MarketHeatmapPage },
    { path: 'markets/alerts', Component: MarketPriceAlertsPage },
    { path: 'markets/screener', Component: MarketScreenerPage },
    { path: 'markets/compare', Component: MarketComparisonPage },
    { path: 'markets/depth', Component: MarketDepthPage },
    { path: 'markets/advanced-charts', Component: AdvancedChartsPage },
    { path: 'pair/:pairId', Component: components.pairDetail },
    { path: 'pair/:pairId/info', Component: TokenInfoPage },
    { path: 'pair/:pairId/depth', Component: MarketDepthPage },
  ];
}

/** Market aliases rendered by the web shell; their pages remain feature-owned. */
export function createMarketWebRoutes(): RouteObject[] {
  return [
    { path: 'scanner', Component: MarketScreenerPage },
    { path: 'markets/overview', Component: MarketOverviewPage },
    { path: 'markets/movers', Component: MarketMoversPage },
    { path: 'markets/watchlist', Component: WatchlistPage },
    { path: 'markets/heatmap', Component: MarketHeatmapPage },
  ];
}

/** Biến thể route market được bảo vệ; màn hình trade dùng lại cùng page contract. */
export function createMarketProtectedRoutes(): RouteObject[] {
  return [{ path: 'trade/advanced-chart/:pairId', Component: AdvancedChartsPage }];
}
