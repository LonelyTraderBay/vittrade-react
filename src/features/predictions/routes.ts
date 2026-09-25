import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

export interface PredictionRouteComponents {
  home: ComponentType;
  search: ComponentType;
  breaking: ComponentType;
  event: ComponentType;
  portfolio: ComponentType;
  rewards: ComponentType;
  leaderboard: ComponentType;
  activity: ComponentType;
  receipt: ComponentType;
}

/** Core prediction-market routes owned by the contract-backed feature. */
export function createPredictionRoutes(components: PredictionRouteComponents): RouteObject[] {
  return [
    { index: true, Component: components.home },
    { path: 'search', Component: components.search },
    { path: 'breaking', Component: components.breaking },
    { path: 'event/:eventId', Component: components.event },
    { path: 'portfolio', Component: components.portfolio },
    { path: 'rewards', Component: components.rewards },
    { path: 'leaderboard', Component: components.leaderboard },
    { path: 'activity', Component: components.activity },
    { path: 'receipt/:orderId', Component: components.receipt },
  ];
}
