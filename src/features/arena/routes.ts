import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';

export interface ArenaRouteComponents {
  mode: ComponentType;
  challenge: ComponentType;
  join: ComponentType;
}

/** Các route Arena lõi theo contract do feature Arena sở hữu. */
export function createArenaRoutes(components: ArenaRouteComponents): RouteObject[] {
  return [
    { path: 'arena/mode/:modeId', Component: components.mode },
    { path: 'arena/challenge/:challengeId', Component: components.challenge },
    { path: 'arena/join/:challengeId', Component: components.join },
  ];
}
