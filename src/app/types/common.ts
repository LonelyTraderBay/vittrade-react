/**
 * ══════════════════════════════════════════════════════════
 *  COMMON TYPES — Shared across all modules
 * ══════════════════════════════════════════════════════════
 *
 *  Centralized type definitions used throughout the app.
 *  Follows Guidelines.md module boundaries — these are
 *  GENERIC types, not domain-specific.
 */

/* ─── Base Entity Types ─── */

export interface User {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  kycLevel: 'none' | 'basic' | 'advanced';
  createdAt: Date;
}

export interface Asset {
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
}

export interface Network {
  id: string;
  name: string;
  chainId?: number;
  iconUrl?: string;
  isTestnet?: boolean;
}

/* ─── UI Component Prop Types ─── */

export interface BaseCardProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface BaseButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
}

export interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

/* ─── State Types ─── */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/* ─── Filter & Sort Types ─── */

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = string> {
  field: T;
  direction: SortDirection;
}

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
}

/* ─── Time & Date Types ─── */

export type TimeRange = '1h' | '4h' | '1d' | '1w' | '1m' | '3m' | '1y' | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

/* ─── Chart & Data Visualization ─── */

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface OHLCVDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ─── Notification Types ─── */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

/* ─── API Response Types ─── */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/* ─── Form Types ─── */

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

/* ─── Modal & Sheet Types ─── */

export interface SheetConfig {
  title?: string;
  showCloseButton?: boolean;
  showHandle?: boolean;
  preventClose?: boolean;
  maxHeight?: string;
}

/* ─── Color & Theme Types ─── */

export type ColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  // Background
  bg: string;
  surface1: string;
  surface2: string;
  surface3: string;
  
  // Text
  text1: string;
  text2: string;
  text3: string;
  
  // Semantic
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  
  // Trading
  buy: string;
  sell: string;
  
  // Borders
  border: string;
  borderSolid: string;
  
  // Interactive
  hover: string;
  active: string;
  disabled: string;
  
  // Focus
  ring: string;
}

/* ─── Utility Types ─── */

/**
 * Make specific keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract value types from const object
 */
export type ValueOf<T> = T[keyof T];

/**
 * Readonly deep
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Non-nullable deep
 */
export type DeepNonNullable<T> = {
  [P in keyof T]: NonNullable<T[P]> extends object 
    ? DeepNonNullable<NonNullable<T[P]>> 
    : NonNullable<T[P]>;
};
