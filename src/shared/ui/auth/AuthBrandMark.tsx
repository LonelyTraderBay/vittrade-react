import { WEB_AUTH_BRAND_MARK } from '@/shared/theme/webTokens';

interface AuthBrandMarkProps {
  /** Size variants preserve the established Auth layouts. */
  size: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
  sm: {
    container: 44,
    icon: 24,
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
  },
  md: {
    container: 52,
    icon: 28,
    borderRadius: 14,
    boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
  },
  lg: {
    container: 64,
    icon: 36,
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
  },
} as const;

/** Decorative mark shared by the responsive and web Auth entry points. */
export function AuthBrandMark({ size }: AuthBrandMarkProps) {
  const dimensions = SIZE_STYLES[size];

  return (
    <div
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center"
      style={{
        width: dimensions.container,
        height: dimensions.container,
        borderRadius: dimensions.borderRadius,
        background: WEB_AUTH_BRAND_MARK.gradient,
        boxShadow: dimensions.boxShadow,
      }}
    >
      <svg width={dimensions.icon} height={dimensions.icon} viewBox="0 0 36 36" fill="none">
        <path
          d="M6 18L14 10L20 16L28 8"
          stroke={WEB_AUTH_BRAND_MARK.primaryStroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 26L14 18L20 24L30 14"
          stroke={WEB_AUTH_BRAND_MARK.secondaryStroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
