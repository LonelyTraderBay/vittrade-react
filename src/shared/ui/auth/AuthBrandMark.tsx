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
        background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
        boxShadow: dimensions.boxShadow,
      }}
    >
      <svg width={dimensions.icon} height={dimensions.icon} viewBox="0 0 36 36" fill="none">
        <path
          d="M6 18L14 10L20 16L28 8"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 26L14 18L20 24L30 14"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
