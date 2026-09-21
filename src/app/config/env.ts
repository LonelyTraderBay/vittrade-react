/**
 * ══════════════════════════════════════════════════════════
 *  Environment Configuration — single source of truth
 * ══════════════════════════════════════════════════════════
 *
 *  All runtime configuration flows through this module.
 *  Never read `import.meta.env` directly in feature code —
 *  import `env` from here instead.
 *
 *  Values come from Vite env files (.env, .env.local, …).
 *  See .env.example for the full list of variables.
 */

export type AppMode = 'development' | 'test' | 'production';

export interface AppEnv {
  readonly mode: AppMode;
  readonly isDev: boolean;
  readonly isTest: boolean;
  readonly isProd: boolean;
  readonly appName: string;
  readonly apiBaseUrl: string;
  readonly wsUrl: string;
  readonly enableAnalytics: boolean;
  readonly enableDevtools: boolean;
}

const raw = import.meta.env;

function parseFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

const mode = (raw.MODE as AppMode) ?? 'development';

export const env: AppEnv = {
  mode,
  isDev: raw.DEV === true,
  isTest: mode === 'test',
  isProd: raw.PROD === true,
  appName: raw.VITE_APP_NAME ?? 'VitTrade',
  apiBaseUrl: raw.VITE_API_BASE_URL ?? 'https://api.vittrade.example.com',
  wsUrl: raw.VITE_WS_URL ?? 'wss://ws.vittrade.example.com',
  enableAnalytics: parseFlag(raw.VITE_ENABLE_ANALYTICS, false),
  enableDevtools: parseFlag(raw.VITE_ENABLE_DEVTOOLS, true),
};

if (env.isDev && raw.VITE_API_BASE_URL === undefined) {
  console.warn(
    '[env] VITE_API_BASE_URL is not set — using placeholder. ' +
      'Copy .env.example to .env.local and configure it.',
  );
}
