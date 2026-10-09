import { z } from 'zod';
import { assertReleaseEnvironment } from './runtime-env-validation';

export type AppMode = 'development' | 'test' | 'staging' | 'production';
export type AppDataSource = 'mock' | 'api';

export interface AppEnv {
  readonly mode: AppMode;
  readonly dataSource: AppDataSource;
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
  VITE_DATA_SOURCE: z.enum(['mock', 'api']).optional(),
  VITE_API_BASE_URL: z.string().optional(),
  VITE_WS_URL: z.string().optional(),
  VITE_APP_NAME: z.string().optional(),
  VITE_RELEASE_VERSION: z.string().optional(),
  VITE_ENABLE_ANALYTICS: z.string().optional(),
  VITE_ENABLE_DEVTOOLS: z.string().optional(),
});

const parsedRaw = rawEnvSchema.safeParse(import.meta.env);
const invalidVariableNames = parsedRaw.success
  ? []
  : [
      ...new Set(
        parsedRaw.error.issues.flatMap((issue) =>
          issue.path.filter((part): part is string => typeof part === 'string'),
        ),
      ),
    ].sort();
const raw = parsedRaw.success
  ? parsedRaw.data
  : {
      MODE: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      VITE_DATA_SOURCE: undefined,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_WS_URL: import.meta.env.VITE_WS_URL,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_RELEASE_VERSION: import.meta.env.VITE_RELEASE_VERSION,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS,
    };

// Vite can statically eliminate development-only imports only when the build
// flag remains a compile-time value. Keep this access inside the env boundary.
export const isDevelopmentBuild = import.meta.env.DEV;
export const isProductionBuild = import.meta.env.PROD;

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
const dataSource = raw.VITE_DATA_SOURCE ?? (raw.DEV ? 'mock' : 'api');

export const env: AppEnv = {
  mode,
  dataSource,
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

/** Fail fast at application startup instead of silently calling a placeholder backend. */
export function assertRuntimeEnv(): void {
  if (invalidVariableNames.length > 0) {
    throw new Error(`Runtime environment is invalid: ${invalidVariableNames.join(', ')}`);
  }

  assertReleaseEnvironment({
    mode: env.mode,
    isProduction: env.isProd,
    dataSource: env.dataSource,
    apiBaseUrl: env.apiBaseUrl,
    wsUrl: env.wsUrl,
  });
}
