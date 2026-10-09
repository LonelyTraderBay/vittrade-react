export interface ReleaseEnvironmentInput {
  readonly mode: string;
  readonly isProduction: boolean;
  readonly dataSource: string;
  readonly apiBaseUrl: string;
  readonly wsUrl: string;
}

function isSecureNonPlaceholderUrl(value: string, protocol: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');

    return url.protocol === protocol && hostname !== 'invalid' && !hostname.endsWith('.invalid');
  } catch {
    return false;
  }
}

/** Shared build-time and runtime guard for staging and production endpoints. */
export function assertReleaseEnvironment(input: ReleaseEnvironmentInput): void {
  const isStaging = input.mode === 'staging';
  const isRelease = isStaging || input.mode === 'production' || input.isProduction;
  if (!isRelease) return;

  const environment = isStaging ? 'staging' : 'production';
  if (input.dataSource === 'mock') {
    throw new Error('Mock data source is not allowed in staging or production');
  }
  if (input.dataSource !== 'api') {
    throw new Error(`${environment} environment requires VITE_DATA_SOURCE=api`);
  }

  const invalid: string[] = [];
  if (!isSecureNonPlaceholderUrl(input.apiBaseUrl, 'https:')) {
    invalid.push('VITE_API_BASE_URL');
  }
  if (!isSecureNonPlaceholderUrl(input.wsUrl, 'wss:')) {
    invalid.push('VITE_WS_URL');
  }

  if (invalid.length > 0) {
    const label = isStaging ? 'Staging' : 'Production';
    throw new Error(`${label} environment is incomplete: ${invalid.join(', ')}`);
  }
}
