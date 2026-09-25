/** Shared contracts for feature flag definitions and evaluation. */

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userSegments?: string[];
  variants?: FeatureFlagVariant[];
  defaultVariant?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagVariant {
  key: string;
  name: string;
  weight: number;
  value: unknown;
}

export interface UserContext {
  userId?: string;
  segment?: string;
  attributes?: Record<string, unknown>;
}

export interface IFeatureFlagService {
  subscribe(listener: () => void): () => void;
  getVersion(): number;
  isEnabled(flagKey: string, userContext?: UserContext): boolean;
  getValue<T>(flagKey: string, defaultValue: T, userContext?: UserContext): T;
  getVariant(flagKey: string, userContext?: UserContext): string;
  getAllFlags(): Record<string, FeatureFlag>;
  override(flagKey: string, value: unknown): void;
  clearOverrides(): void;
  refresh(): Promise<void>;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  debug: boolean;
  remoteConfigUrl?: string;
  refreshInterval: number;
  cache: boolean;
  cacheTTL: number;
}
