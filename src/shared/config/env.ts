import { z } from 'zod';

export type AppMode = 'development' | 'test' | 'staging' | 'production';

export interface AppEnv {
  readonly mode: AppMode;
  readonly isDev: boolean;
  readonly isTest: boolean;
  readonly isStaging: boolean;
  readonly isProd: boolean;
  readonly appName: string;
  readonly releaseVersion: string;
  readonly apiBaseUrl: string;
  readonly wsUrl: string;
  readonly enableAnalytics: boolean;
  readonly enableDevtools: boolean;
}

const rawEnvSchema = z.object({
  MODE: z.string().default('development'),
  DEV: z.boolean().default(false),
  PROD: z.boolean().default(false),
  VITE_API_BASE_URL: z.string().optional(),
  VITE_WS_URL: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_RELEASE_VERSION: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().optional(),
  VITE_ENABLE_DEVTOOLS: z.string().optional(),
});

const raw = rawEnvSchema.parse(import.meta.env);

// Vite can statically eliminate development-only imports only when the build
// flag remains a compile-time value. Keep this access inside the env boundary.
export const isDevelopmentBuild = import.meta.env.DEV;

function parseMode(value: string): AppMode {
  if (value === 'test' || value === 'staging' || value === 'production') return value;
  return 'development';
}

function parseFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

const mode = parseMode(raw.MODE);
const isProd = raw.PROD || mode === 'production';

export const env: AppEnv = {
  mode,
  isDev: raw.DEV,
  isTest: mode === 'test',
  isStaging: mode === 'staging',
  isProd,
  appName: raw.VITE_APP_NAME?.trim() || 'VitTrade',
  releaseVersion: raw.VITE_RELEASE_VERSION?.trim() || 'local',
  apiBaseUrl: raw.VITE_API_BASE_URL?.trim() || '',
  wsUrl: raw.VITE_WS_URL?.trim() || '',
  enableAnalytics: parseFlag(raw.VITE_ENABLE_ANALYTICS, false),
  enableDevtools: parseFlag(raw.VITE_ENABLE_DEVTOOLS, !isProd),
};

function isAbsoluteUrl(value: string, protocols: string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Fail fast at application startup instead of silently calling a placeholder backend. */
export function assertProductionEnv(): void {
  if (!env.isProd) return;

  const missing: string[] = [];
  if (!isAbsoluteUrl(env.apiBaseUrl, ['https:'])) missing.push('VITE_API_BASE_URL');
  if (!isAbsoluteUrl(env.wsUrl, ['wss:'])) missing.push('VITE_WS_URL');

  if (missing.length > 0) {
    throw new Error(`Production environment is incomplete: ${missing.join(', ')}`);
  }
}
