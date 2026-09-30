const DEFAULT_SEED = 0x51f15e;
export const DEV_PREVIEW_SCENARIO_STORAGE_KEY = 'vittrade.dev-preview.scenario';

export const DEV_PREVIEW_DOMAINS = [
  'admin',
  'arena',
  'auth',
  'dca',
  'discovery',
  'earn',
  'launchpad',
  'market',
  'p2p',
  'predictions',
  'profile',
  'referral',
  'support',
  'trading',
  'wallet',
] as const;

export type DevPreviewDomain = (typeof DEV_PREVIEW_DOMAINS)[number];
export type DevPreviewScenarioState =
  | 'success'
  | 'empty'
  | 'loading'
  | 'error'
  | 'unauthorized'
  | 'forbidden'
  | 'pending'
  | 'unknown'
  | 'duplicate';

export interface DevPreviewScenario {
  domain: DevPreviewDomain;
  state: DevPreviewScenarioState;
}

function isDevPreviewScenario(value: unknown): value is DevPreviewScenario {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    DEV_PREVIEW_DOMAINS.includes(candidate.domain as DevPreviewDomain) &&
    [
      'success',
      'empty',
      'loading',
      'error',
      'unauthorized',
      'forbidden',
      'pending',
      'unknown',
      'duplicate',
    ].includes(String(candidate.state))
  );
}

function readStoredPreviewScenario(): DevPreviewScenario | null {
  try {
    const stored = globalThis.localStorage?.getItem(DEV_PREVIEW_SCENARIO_STORAGE_KEY);
    if (!stored) return null;
    const scenario: unknown = JSON.parse(stored);
    return isDevPreviewScenario(scenario) ? scenario : null;
  } catch {
    return null;
  }
}

let randomState = DEFAULT_SEED;
let fixedNow: number | null = null;
const idSequences = new Map<string, number>();
let activePreviewScenario = readStoredPreviewScenario();

export interface DevMockScenarioOptions {
  seed?: number;
  now?: number | Date | null;
}

export function configureDevMockScenario(options: DevMockScenarioOptions): void {
  if (options.seed !== undefined) {
    if (!Number.isSafeInteger(options.seed)) {
      throw new RangeError('Mock scenario seed must be a safe integer.');
    }
    randomState = options.seed >>> 0;
  }

  if (options.now !== undefined) {
    if (options.now === null) {
      fixedNow = null;
    } else {
      const timestamp = options.now instanceof Date ? options.now.getTime() : options.now;
      if (!Number.isFinite(timestamp)) {
        throw new RangeError('Mock scenario clock must be a valid timestamp.');
      }
      fixedNow = timestamp;
    }
  }
}

export function resetDevMockRuntime(): void {
  randomState = DEFAULT_SEED;
  fixedNow = null;
  idSequences.clear();
  setDevPreviewScenario(null);
}

export function getDevPreviewScenario(): DevPreviewScenario | null {
  return activePreviewScenario;
}

export function setDevPreviewScenario(scenario: DevPreviewScenario | null): void {
  activePreviewScenario = scenario;
  try {
    if (scenario) {
      globalThis.localStorage?.setItem(DEV_PREVIEW_SCENARIO_STORAGE_KEY, JSON.stringify(scenario));
    } else {
      globalThis.localStorage?.removeItem(DEV_PREVIEW_SCENARIO_STORAGE_KEY);
    }
  } catch {
    // Scenario injection remains usable in memory when browser storage is unavailable.
  }
}

export function resetDevMockIds(...prefixes: string[]): void {
  if (prefixes.length === 0) {
    idSequences.clear();
    return;
  }
  prefixes.forEach((prefix) => idSequences.delete(prefix));
}

export function nextDevMockId(prefix: string): string {
  const normalizedPrefix = prefix.trim();
  if (!normalizedPrefix) throw new TypeError('Mock ID prefix cannot be empty.');

  const sequence = (idSequences.get(normalizedPrefix) ?? 0) + 1;
  idSequences.set(normalizedPrefix, sequence);
  return `${normalizedPrefix}-${String(sequence).padStart(4, '0')}`;
}

export function nextDevMockRandom(): number {
  let value = (randomState += 0x6d2b79f5);
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
}

export function devMockNowMs(): number {
  return fixedNow ?? Date.now();
}

export function devMockNowIso(): string {
  return new Date(devMockNowMs()).toISOString();
}
