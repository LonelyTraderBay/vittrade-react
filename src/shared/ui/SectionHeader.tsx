import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { type VitDensity } from '@/shared/theme/density';
import { textRoleSize } from '@/shared/theme/typography';
import type { LucideIcon } from 'lucide-react';

/**
 * SectionHeader — Enterprise Section Heading Component
 *
 * Variants:
 *   - plain:       title only (default)
 *   - accentBar:   colored vertical bar on the left (VitTrade standard)
 *   - markerTitle: smaller marker bar, title uses baseMedium size
 *
 * Design tokens:
 *   Accent bar: 4px wide, 16px tall, borderRadius 2px
 *   Default accent color: primary amber (#E58A00)
 */

export type SectionHeaderVariant = 'plain' | 'accentBar' | 'markerTitle';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Right-side action element (legacy; prefer actionLabel + onAction) */
  right?: React.ReactNode;
  /** Visual variant */
  variant?: SectionHeaderVariant;
  /** Legacy shorthand for variant="accentBar" */
  accent?: boolean;
  /** Accent bar/marker color (default: primary amber) */
  accentColor?: string;
  /** Leading icon rendered before the title */
  icon?: LucideIcon;
  /** Icon color (default: accentColor) */
  iconColor?: string;
  /** Density drives title size */
  density?: VitDensity;
  /** Title font size override (wins over density mapping) */
  titleSize?: number;
  /** Action label text (e.g. "Xem tất cả") */
  actionLabel?: string;
  /** Action click handler */
  onAction?: () => void;
  /** Show chevron icon next to action label (default: true) */
  actionShowChevron?: boolean;
  /** Container className */
  className?: string;
  /** Bottom margin in px (default: 12) */
  mb?: number;
}

export function SectionHeader({
  title,
  subtitle,
  right,
  variant: variantProp,
  accent = false,
  accentColor = '#E58A00',
  icon: Icon,
  iconColor,
  density = 'standard',
  titleSize,
  actionLabel,
  onAction,
  actionShowChevron = true,
  className = '',
  mb = 12,
}: SectionHeaderProps) {
  const c = useThemeColors();
  const variant = variantProp ?? (accent ? 'accentBar' : 'plain');
  const showAccent = variant === 'accentBar' || variant === 'markerTitle';
  const isMarker = variant === 'markerTitle';

  const resolvedTitleSize =
    titleSize ??
    (isMarker
      ? textRoleSize('sectionTitle')
      : density === 'compact'
        ? textRoleSize('label')
        : textRoleSize('sectionLabel'));
  const resolvedTitleWeight = isMarker ? 600 : 700;

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ marginBottom: mb }}>
      {showAccent && (
        <div
          className="shrink-0"
          style={{
            width: 4,
            height: 16,
            borderRadius: 2,
            background: accentColor,
          }}
        />
      )}
      {Icon && (
        <Icon
          size={isMarker ? 18 : 21}
          color={iconColor ?? accentColor}
          strokeWidth={1.8}
          className="shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3
          className="text-truncate"
          style={{
            color: c.text1,
            fontSize: resolvedTitleSize,
            fontWeight: resolvedTitleWeight,
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              color: c.text3,
              fontSize: textRoleSize('caption'),
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 flex items-center gap-0.5"
          style={{
            color: accentColor,
            fontSize: textRoleSize('label'),
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
          aria-label={`${actionLabel} ${title}`}
        >
          {actionLabel}
          {actionShowChevron && <ChevronRight size={16} color={accentColor} strokeWidth={2} />}
        </button>
      )}
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
