import React, { useState, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Copy, Check, ChevronRight, Info } from 'lucide-react';
import { φ, φIcon } from '../../utils/golden';
import type { LucideIcon } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════
 *  InfoRow — Enterprise Key-Value Display Row
 * ══════════════════════════════════════════════════════════
 *
 *  Standardized for:
 *  - Fee breakdowns  (Phí GD: 0.1%)
 *  - Order summaries (Số lượng: 1.5 BTC)
 *  - Address display  (Địa chỉ: 0x1234...5678  [copy])
 *  - Status rows     (Trạng thái: [StatusPill])
 *  - Settings rows   (2FA: Đang bật)
 *  - Navigation rows (Bảo mật: → detail)
 *
 *  VARIANTS:
 *  ─────────────────────────────────────────────────────────
 *  "default"   — label left, value right (most common)
 *  "stacked"   — label on top, value below (long values like addresses)
 *  "highlight" — subtle accent background (total rows, important values)
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  <InfoRow label="Phí giao dịch" value="0.1%" />
 *  <InfoRow label="Tổng" value="$1,234.56" highlight />
 *  <InfoRow label="Địa chỉ" value="0x1234...5678" copyable />
 *  <InfoRow label="Trạng thái" trailing={<StatusPill status="success" label="Hoàn tất" />} />
 *  <InfoRow label="Bảo mật" value="2FA đang bật" onPress={() => navigate('/security')} />
 *  <InfoRow label="Mạng lưới" value="Ethereum" icon={Globe} />
 *  <InfoRow label="Ghi chú" value="Nội dung dài dòng..." stacked />
 */

type InfoRowVariant = 'default' | 'stacked' | 'highlight';

interface InfoRowProps {
  /** Left label */
  label: string;
  /** Right value text (ignored if `trailing` provided) */
  value?: string | number;
  /** Custom trailing element (StatusPill, icon, badge, etc.) */
  trailing?: React.ReactNode;
  /** Icon before label */
  icon?: LucideIcon;
  /** Display variant */
  variant?: InfoRowVariant;
  /** Shorthand for variant="highlight" */
  highlight?: boolean;
  /** Shorthand for variant="stacked" */
  stacked?: boolean;
  /** Show copy button for value */
  copyable?: boolean;
  /** Value color override (for colored values like PnL) */
  valueColor?: string;
  /** Value font weight override */
  valueBold?: boolean;
  /** Use monospace font for value (amounts, addresses) */
  mono?: boolean;
  /** Make row tappable (shows chevron) */
  onPress?: () => void;
  /** Custom border bottom (null = no border) */
  border?: boolean;
  /** Separator style — divider line or none */
  separator?: boolean;
  /** Additional helper text under the value */
  helper?: string;
  /** Sub-label under the main label */
  subLabel?: string;
  /** Label color override */
  labelColor?: string;
  /** Additional className */
  className?: string;
}

export function InfoRow({
  label,
  value,
  trailing,
  icon: Icon,
  variant: variantProp,
  highlight = false,
  stacked = false,
  copyable = false,
  valueColor,
  valueBold = false,
  mono = false,
  onPress,
  border,
  separator = true,
  helper,
  subLabel,
  labelColor,
  className = '',
}: InfoRowProps) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);

  const variant: InfoRowVariant = variantProp ?? (highlight ? 'highlight' : stacked ? 'stacked' : 'default');
  const isClickable = !!onPress;

  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(String(value)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const Tag = isClickable ? 'button' : 'div';

  /* ─── Container styles by variant ─── */
  const containerStyle: React.CSSProperties = {
    ...(variant === 'highlight' ? {
      background: c.primaryAlpha08,
      borderRadius: 12,
      padding: '12px 14px',
      marginTop: 2,
      marginBottom: 2,
    } : {}),
    ...(separator && variant !== 'highlight' ? {
      borderBottom: `1px solid ${c.divider}`,
    } : {}),
    ...(border === false ? { borderBottom: 'none' } : {}),
  };

  /* ─── Stacked layout ─── */
  if (variant === 'stacked') {
    return (
      <Tag
        onClick={onPress}
        className={`flex flex-col gap-1 w-full text-left ${className}`}
        style={{
          padding: '12px 0',
          ...containerStyle,
          ...(variant === 'stacked' && { padding: '12px 0' }),
        }}
      >
        {/* Label row */}
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={φIcon.sm} color={labelColor ?? c.text3} className="shrink-0" />}
          <span style={{ color: labelColor ?? c.text3, fontSize: φ.xs, fontWeight: 600 }}>
            {label}
          </span>
        </div>

        {/* Value + actions */}
        <div className="flex items-center gap-2">
          <span
            className="flex-1 break-all"
            style={{
              color: valueColor ?? c.text1,
              fontSize: φ.sm,
              fontWeight: valueBold ? 700 : 500,
              fontFamily: mono ? '-apple-system, BlinkMacSystemFont, "SF Mono", monospace' : 'inherit',
              lineHeight: 1.4,
            }}
          >
            {trailing ?? value}
          </span>
          {copyable && value && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="shrink-0 p-1 rounded-lg active:opacity-60"
              aria-label="Sao chép"
            >
              {copied
                ? <Check size={14} color={c.buy} />
                : <Copy size={14} color={c.text3} />
              }
            </button>
          )}
          {isClickable && (
            <ChevronRight size={φIcon.sm} color={c.text3} className="shrink-0" />
          )}
        </div>

        {helper && (
          <span style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.3 }}>{helper}</span>
        )}
      </Tag>
    );
  }

  /* ─── Default / Highlight layout (horizontal) ─── */
  return (
    <Tag
      onClick={onPress}
      className={`flex items-center gap-3 w-full ${isClickable ? 'text-left' : ''} ${className}`}
      style={{
        padding: variant === 'highlight' ? '12px 14px' : '12px 0',
        minHeight: 44,
        ...containerStyle,
      }}
    >
      {/* Left: icon + label */}
      <div className="flex items-center gap-2 shrink-0" style={{ minWidth: 0 }}>
        {Icon && <Icon size={φIcon.sm} color={labelColor ?? c.text3} className="shrink-0" />}
        <div className="flex flex-col">
          <span
            style={{
              color: labelColor ?? c.text2,
              fontSize: φ.sm,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {subLabel && (
            <span style={{ color: c.text3, fontSize: φ.xs, marginTop: 1 }}>{subLabel}</span>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: value + actions */}
      <div className="flex items-center gap-1.5 shrink-0 max-w-[60%]">
        {trailing ?? (
          <span
            className="text-right truncate"
            style={{
              color: valueColor ?? c.text1,
              fontSize: φ.sm,
              fontWeight: valueBold ? 700 : 600,
              fontFamily: mono ? '-apple-system, BlinkMacSystemFont, "SF Mono", monospace' : 'inherit',
            }}
          >
            {value}
          </span>
        )}

        {copyable && value && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="shrink-0 p-1 rounded-lg active:opacity-60"
            aria-label="Sao chép"
          >
            {copied
              ? <Check size={14} color={c.buy} />
              : <Copy size={14} color={c.text3} />
            }
          </button>
        )}

        {isClickable && (
          <ChevronRight size={φIcon.sm} color={c.text3} className="shrink-0" />
        )}
      </div>
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════════════
   InfoRowGroup — Wraps multiple InfoRows in a card
   ═══════════════════════════════════════════════════════════ */

interface InfoRowGroupProps {
  /** Section title above the group */
  title?: string;
  /** Children should be InfoRow components */
  children: React.ReactNode;
  /** Additional className for the card */
  className?: string;
}

export function InfoRowGroup({ title, children, className = '' }: InfoRowGroupProps) {
  const c = useThemeColors();

  return (
    <div className={className}>
      {title && (
        <p
          style={{
            color: c.sectionLabelColor,
            fontSize: φ.xs,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          {title}
        </p>
      )}
      <div
        className="rounded-2xl overflow-hidden px-4"
        style={{
          background: c.surface,
          border: `1px solid ${c.cardBorder}`,
          boxShadow: c.cardShadow,
        }}
      >
        {/* Remove last-child border */}
        {React.Children.map(children, (child, i) => {
          if (!React.isValidElement(child)) return child;
          const isLast = i === React.Children.count(children) - 1;
          return React.cloneElement(child as React.ReactElement<InfoRowProps>, {
            separator: isLast ? false : (child.props as InfoRowProps).separator ?? true,
          });
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FeeBreakdown — Specialized InfoRow group for fees
   ═══════════════════════════════════════════════════════════ */

interface FeeItem {
  label: string;
  value: string;
  highlight?: boolean;
  helper?: string;
  icon?: LucideIcon;
}

interface FeeBreakdownProps {
  items: FeeItem[];
  /** Title above the fee group (default: "Chi phí") */
  title?: string;
  className?: string;
}

export function FeeBreakdown({ items, title, className = '' }: FeeBreakdownProps) {
  return (
    <InfoRowGroup title={title} className={className}>
      {items.map((item, i) => (
        <InfoRow
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          highlight={item.highlight}
          helper={item.helper}
          mono
          valueBold={item.highlight}
        />
      ))}
    </InfoRowGroup>
  );
}
