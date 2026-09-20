import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  WEB_FONT,
  WEB_SPACING,
  WEB_ICON,
  WEB_BUTTON,
} from '../layout/webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WEB PRIMITIVES — Shared Enterprise Desktop Components
 * ══════════════════════════════════════════════════════════
 *
 *  Reusable building blocks for Web pages. All components
 *  use enterprise desktop sizing from webConstants.ts.
 *
 *  Usage:
 *    import { WebCard, WebCardHeader, WebPageHeader, ... } from '../components/web/WebPrimitives';
 */

/* ═══════════════════════════════════════════════════════════
   WebCard — Standard card container
   ═══════════════════════════════════════════════════════════ */

interface WebCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Padding variant. default=20px, compact=16px, relaxed=24px, none=0 */
  padding?: 'compact' | 'default' | 'relaxed' | 'none';
}

export function WebCard({ children, className = '', style, padding = 'none' }: WebCardProps) {
  const c = useThemeColors();
  const padMap = { compact: 16, default: 20, relaxed: 24, none: 0 };
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        padding: padMap[padding] || 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebCardHeader — Card header bar with title and optional action
   ═══════════════════════════════════════════════════════════ */

interface WebCardHeaderProps {
  title: string;
  /** Right-side action (text button, badge count, etc.) */
  action?: React.ReactNode;
  /** Badge count next to title */
  badge?: number;
  /** Compact padding (for dense layouts) */
  compact?: boolean;
}

export function WebCardHeader({ title, action, badge, compact }: WebCardHeaderProps) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: compact
          ? `${WEB_SPACING.cardCompact - 4}px ${WEB_SPACING.cardDefault}px`
          : `${WEB_SPACING.cardCompact}px ${WEB_SPACING.cardDefault}px`,
        borderBottom: `1px solid ${c.divider}`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
          {title}
        </span>
        {badge !== undefined && badge > 0 && (
          <span
            className="flex items-center justify-center rounded"
            style={{
              minWidth: 22,
              height: 20,
              padding: '0 6px',
              background: '#3B82F6',
              color: '#fff',
              fontSize: WEB_FONT.xs,
              fontWeight: 700,
              borderRadius: 5,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebLinkAction — "Xem tất cả →" link button
   ═══════════════════════════════════════════════════════════ */

interface WebLinkActionProps {
  label: string;
  onClick: () => void;
  color?: string;
}

export function WebLinkAction({ label, onClick, color = '#3B82F6' }: WebLinkActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1"
      style={{ color, fontSize: WEB_FONT.sm, fontWeight: 600 }}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebPageHeader — Page-level header: title + optional subtitle + right actions
   ═══════════════════════════════════════════════════════════ */

interface WebPageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // right-side actions
}

export function WebPageHeader({ title, subtitle, children }: WebPageHeaderProps) {
  const c = useThemeColors();
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 style={{
          color: c.text1,
          fontSize: WEB_FONT['2xl'],
          fontWeight: 700,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            color: c.text3,
            fontSize: WEB_FONT.base,
            marginTop: 2,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebActionButton — Secondary action button (outline style)
   ═══════════════════════════════════════════════════════════ */

interface WebActionButtonProps {
  icon?: React.ComponentType<{ size: number }>;
  label: string;
  onClick: () => void;
  /** Primary filled style instead of outline */
  primary?: boolean;
  /** Badge count */
  badge?: number;
}

export function WebActionButton({ icon: Icon, label, onClick, primary, badge }: WebActionButtonProps) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="web-cmd-btn flex items-center gap-2 rounded-xl transition-colors"
      style={{
        height: WEB_BUTTON.md,
        padding: '0 16px',
        border: primary ? 'none' : `1px solid ${c.border}`,
        background: primary ? '#3B82F6' : 'transparent',
        color: primary ? '#fff' : c.text2,
        fontSize: WEB_FONT.base,
        fontWeight: 600,
      }}
    >
      {Icon && <Icon size={WEB_ICON.sm} />}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="rounded-full flex items-center justify-center"
          style={{
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            background: primary ? 'rgba(255,255,255,0.25)' : '#F59E0B',
            color: primary ? '#fff' : '#fff',
            fontSize: 9,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebStatWidget — Stat card with icon, value, label, sub
   ═══════════════════════════════════════════════════════════ */

interface WebStatWidgetProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}

export function WebStatWidget({ icon: Icon, color, label, value, sub, onClick }: WebStatWidgetProps) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="web-cmd-btn flex items-center gap-4 rounded-2xl text-left transition-colors"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        padding: WEB_SPACING.cardDefault,
      }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: color + '10',
          border: `1px solid ${color}20`,
        }}
      >
        <Icon size={WEB_ICON.lg} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{
          color: c.text3,
          fontSize: WEB_FONT.xs,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          marginBottom: 2,
        }}>
          {label}
        </p>
        <p style={{
          color: c.text1,
          fontSize: WEB_FONT.xl,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </p>
        {sub && (
          <p style={{
            color: c.text3,
            fontSize: WEB_FONT.sm,
            fontVariantNumeric: 'tabular-nums',
            marginTop: 1,
          }}>
            {sub}
          </p>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebEmptyState — Empty state placeholder
   ═══════════════════════════════════════════════════════════ */

interface WebEmptyStateProps {
  icon: React.ComponentType<{ size: number; color: string; style?: React.CSSProperties }>;
  message: string;
}

export function WebEmptyState({ icon: Icon, message }: WebEmptyStateProps) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center py-12 gap-3">
      <Icon size={WEB_ICON.xl + 8} color={c.text3} style={{ opacity: 0.4 }} />
      <p style={{ color: c.text3, fontSize: WEB_FONT.base }}>{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebBadge — Status / type badge
   ═══════════════════════════════════════════════════════════ */

interface WebBadgeProps {
  label: string;
  color: string;
  bg?: string;
  /** Size: sm=compact, md=default */
  size?: 'sm' | 'md';
}

export function WebBadge({ label, color, bg, size = 'md' }: WebBadgeProps) {
  const autoColor = color + (bg ? '' : '');
  const autoBg = bg || color.replace(')', ',0.1)').replace('rgb(', 'rgba(');
  return (
    <span
      className="inline-flex items-center rounded"
      style={{
        background: autoBg,
        color,
        fontSize: size === 'sm' ? WEB_FONT.xs - 1 : WEB_FONT.xs,
        fontWeight: 600,
        padding: size === 'sm' ? '2px 6px' : '3px 8px',
        borderRadius: 5,
      }}
    >
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebInfoBanner — Inline info/warning banner
   ═══════════════════════════════════════════════════════════ */

interface WebInfoBannerProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  message: string;
  color?: string;
}

export function WebInfoBanner({ icon: Icon, message, color = '#10B981' }: WebInfoBannerProps) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl"
      style={{
        background: color + '08',
        border: `1px solid ${color}20`,
        padding: `12px ${WEB_SPACING.cardDefault}px`,
      }}
    >
      <Icon size={WEB_ICON.sm} color={color} />
      <span style={{ color, fontSize: WEB_FONT.base }}>
        {message}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebChipGroup — Filter chip row
   ═══════════════════════════════════════════════════════════ */

interface WebChipGroupProps<T extends string> {
  items: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

export function WebChipGroup<T extends string>({ items, active, onChange }: WebChipGroupProps<T>) {
  const c = useThemeColors();
  return (
    <div className="flex gap-1.5">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="transition-colors"
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: WEB_FONT.sm,
            fontWeight: active === item.id ? 600 : 500,
            background: active === item.id ? c.chipActiveBg : 'transparent',
            color: active === item.id ? c.chipActiveText : c.text3,
            border: active === item.id ? `1px solid ${c.chipActiveBorder}` : '1px solid transparent',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebSearchBar — Inline search field
   ═══════════════════════════════════════════════════════════ */

interface WebSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Width constraint */
  width?: number | string;
  /** Search icon component */
  icon?: React.ComponentType<{ size: number; color: string }>;
  /** Clear icon component */
  clearIcon?: React.ComponentType<{ size: number; color: string }>;
}

export function WebSearchBar({
  value, onChange, placeholder = 'Tìm kiếm...',
  width, icon: SearchIcon, clearIcon: ClearIcon,
}: WebSearchBarProps) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-4"
      style={{
        height: 42,
        background: c.searchBg,
        border: `1px solid ${c.searchBorder}`,
        width,
      }}
    >
      {SearchIcon && <SearchIcon size={WEB_ICON.sm} color={c.text3} />}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none"
        style={{ color: c.text1, fontSize: WEB_FONT.md }}
      />
      {value && ClearIcon && (
        <button onClick={() => onChange('')}>
          <ClearIcon size={WEB_ICON.xs} color={c.text3} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WebPageContent — Legacy export for backwards compatibility
   ═══════════════════════════════════════════════════════════
   
   DEPRECATED: This component is no longer used in web pages.
   Web pages now use simple div wrappers like:
   - <div style={{ padding: '24px 0 40px' }}> for standard pages
   - <div style={{ padding: '24px 0 0', flex: 1 }}> for flush variant pages
   
   This export exists only for backwards compatibility with any
   cached/compiled modules that may still reference it.
*/

interface WebPageContentProps {
  children: React.ReactNode;
  grow?: boolean;
}

export function WebPageContent({ children, grow }: WebPageContentProps) {
  return (
    <div style={{ 
      padding: grow ? '24px 0 0' : '24px 0 40px',
      flex: grow ? 1 : undefined 
    }}>
      {children}
    </div>
  );
}