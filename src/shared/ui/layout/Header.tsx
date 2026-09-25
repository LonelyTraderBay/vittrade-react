import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Bell, Search, MoreVertical } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import type { LucideIcon } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════
 *  HEADER — iPhone 16 Pro Max Enterprise Standard (v2)
 * ══════════════════════════════════════════════════════════
 *
 *  Height: 52pt (iOS standard 44pt + 8pt breathing room)
 *  Padding: 20px horizontal (device standard)
 *  Title: 17px weight 600 — iOS nav bar exception (not in φ scale)
 *
 *  ┌──────────────────────────────────────────────────┐
 *  │  ← P2P Trading                          [🔔]    │  ← h=52, glass bar
 *  │    Lv.3 · Giao dịch ngang hàng                  │  ← subtitle 12px
 *  └──────────────────────────────────────────────────┘
 *
 *  V2 CHANGES (Sprint 1 — Foundation):
 *  ─────────────────────────────────────────────────────────
 *  ✓  FIX 1.1: variant="page" + right="none" → NO placeholder 36px
 *  ✓  FIX 1.2: Back button → lightweight (no glass bg, just icon)
 *  ✓  FIX 1.3: Optical alignment → flex-start when subtitle present
 *  ✓  FIX 1.4: Standard variant subtitle fontSize 10 → 12
 *  ✓  FIX 1.5: Badge sizes standardized → 16×16, shared renderBadge()
 *  ✓  FIX 1.6: fontSize 17 documented as iOS nav bar exception
 *
 *  SMART DEFAULTS:
 *  - breadcrumb defaults to OFF (opt-in only via breadcrumb={true})
 *  - breadcrumbMinDepth defaults to 2
 *  - right defaults to 'none'
 *  - variant defaults to 'page' (left-aligned)
 */

interface HeaderAction {
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
}

interface HeaderProps {
  variant?: 'standard' | 'page' | 'custom';
  title?: string;
  subtitle?: string;
  back?: boolean;
  left?: React.ReactNode;
  right?: 'bell' | 'search' | 'more' | 'none' | React.ReactNode;
  action?: HeaderAction;
  badge?: number;
  transparent?: boolean;
  onSearch?: () => void;
  onBack?: () => void;
  notifications?: number;
  onNotificationsClick?: () => void;
  breadcrumb?: boolean;
  breadcrumbMinDepth?: number;
  children?: React.ReactNode;
}

/* ─── Shared Badge — standardized 16×16 across Header & Nav ─── */
function CountBadge({ count, outline }: { count: number; outline?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="min-w-[16px] h-[16px] rounded-full flex items-center justify-center"
      style={{
        background: 'var(--tr-sell)',
        fontSize: 9,
        color: '#fff',
        fontWeight: 700,
        padding: '0 4px',
        boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
        border: outline ? `1.5px solid ${outline}` : undefined,
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Header({
  variant = 'page',
  title,
  subtitle,
  back,
  left,
  right = 'none',
  action,
  badge,
  transparent,
  onSearch,
  onBack,
  notifications = 0,
  onNotificationsClick,
  breadcrumb,
  breadcrumbMinDepth = 2,
  children,
}: HeaderProps) {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();

  const showBreadcrumb = breadcrumb === true;
  const hasSubtitle = !!subtitle;

  /* ─── FIX 1.2: Action buttons keep glass; back button is lightweight ─── */
  const actionBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 'var(--tr-radius-chip)',
    background: c.searchBg,
    border: `1px solid ${c.border}`,
  };

  /* Back button — clean, no background (Coinbase/Revolut/Binance pattern) */
  const backBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 'var(--tr-radius-chip)',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  };

  /* Navigation guard — prevent double-tap from navigating twice */
  const navigatingRef = useRef(false);

  const handleBack = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    // Reset guard after animation completes (300ms safety margin)
    setTimeout(() => {
      navigatingRef.current = false;
    }, 300);

    if (onBack) onBack();
    else navigate(-1);
  }, [onBack, navigate]);

  /* ─── Right actions (shared between standard & page) ─── */
  const renderRight = (isPageVariant = false) => {
    /* Action prop takes priority — render icon button with glass */
    if (action) {
      const ActionIcon = action.icon;
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={action.onClick}
            className="flex items-center justify-center hover-ghost"
            style={actionBtnStyle}
            aria-label={action.label || 'Action'}
          >
            <ActionIcon size={18} color={c.text1} strokeWidth={1.8} />
          </button>
        </div>
      );
    }

    /* FIX 1.1: variant="page" + right="none" → no placeholder at all */
    if (right === 'none' && isPageVariant) {
      return null;
    }

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        {right === 'bell' && (
          <button
            onClick={() =>
              onNotificationsClick ? onNotificationsClick() : navigate(`${prefix}/notifications`)
            }
            className="flex items-center justify-center relative hover-ghost"
            style={actionBtnStyle}
            aria-label={`Thông báo (${notifications})`}
          >
            <Bell size={18} color={c.text1} strokeWidth={1.8} />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1">
                <CountBadge count={notifications} outline={c.bg} />
              </span>
            )}
          </button>
        )}
        {right === 'search' && (
          <button
            onClick={onSearch}
            className="flex items-center justify-center hover-ghost"
            style={actionBtnStyle}
            aria-label="Tìm kiếm"
          >
            <Search size={18} color={c.text1} strokeWidth={1.8} />
          </button>
        )}
        {right === 'more' && (
          <button
            className="flex items-center justify-center hover-ghost"
            style={actionBtnStyle}
            aria-label="Thêm"
          >
            <MoreVertical size={18} color={c.text1} strokeWidth={1.8} />
          </button>
        )}
        {React.isValidElement(right) && right}
        {/* FIX 1.1: variant="standard" keeps placeholder for centering */}
        {right === 'none' && !isPageVariant && <div style={{ width: 36 }} />}
      </div>
    );
  };

  /* ─── FIX 1.2: Back button — lightweight, no glass ─── */
  const renderBack = () =>
    back ? (
      <button
        onClick={handleBack}
        className="flex items-center justify-center hover-ghost shrink-0 active:opacity-60"
        style={backBtnStyle}
        aria-label="Quay lại"
      >
        <ChevronLeft size={22} color={c.text1} strokeWidth={2} />
      </button>
    ) : null;

  /* ─── Glass bar styles (shared) ─── */
  const barStyle: React.CSSProperties = {
    background: transparent ? 'transparent' : c.navBg,
    borderBottom: transparent && !showBreadcrumb ? 'none' : `1px solid ${c.border}`,
    backdropFilter: transparent ? 'none' : 'saturate(180%) blur(24px)',
    WebkitBackdropFilter: transparent ? 'none' : 'saturate(180%) blur(24px)',
    transition: 'background var(--tr-duration-slow) ease',
  };

  /* ═══ variant="custom" ═══ */
  if (variant === 'custom') {
    return (
      <div className="contents">
        {children}
        {showBreadcrumb && <Breadcrumb minDepth={breadcrumbMinDepth} />}
      </div>
    );
  }

  /* ═══ variant="page" — left-aligned title + subtitle ═══ */
  if (variant === 'page') {
    return (
      <div className="contents">
        <div
          className={`flex ${hasSubtitle ? 'items-start' : 'items-center'} gap-3 px-5 shrink-0`}
          style={{
            ...barStyle,
            minHeight: 52,
            paddingTop: hasSubtitle ? 8 : 0,
            paddingBottom: hasSubtitle ? 8 : 0,
          }}
        >
          {/* FIX 1.3: Back button vertically centered relative to title line */}
          {left ??
            (back && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center hover-ghost shrink-0 active:opacity-60"
                style={{ ...backBtnStyle, marginTop: hasSubtitle ? 2 : 0 }}
                aria-label="Quay lại"
              >
                <ChevronLeft size={22} color={c.text1} strokeWidth={2} />
              </button>
            ))}

          {/* Title group — left aligned, flex-1 */}
          <div className="flex-1 min-w-0">
            {title && (
              <span
                className="block truncate"
                style={{
                  color: c.text1,
                  /* FIX 1.6: 17px = iOS nav bar standard (exception from φ scale, documented) */
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </span>
            )}
            {subtitle && (
              <span
                className="block truncate"
                style={{
                  color: c.text2,
                  fontSize: 12,
                  lineHeight: 1.3,
                  marginTop: 1,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>

          {/* FIX 1.1: No placeholder when right="none" in page variant */}
          {renderRight(true)}
        </div>
        {showBreadcrumb && <Breadcrumb minDepth={breadcrumbMinDepth} />}
      </div>
    );
  }

  /* ═══ variant="standard" — centered title ═══ */
  return (
    <div className="contents">
      <div
        className={`flex ${hasSubtitle ? 'items-start' : 'items-center'} justify-between px-5 shrink-0`}
        style={{
          minHeight: 52,
          paddingTop: hasSubtitle ? 8 : 0,
          paddingBottom: hasSubtitle ? 8 : 0,
          ...barStyle,
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-2 flex-1" style={{ marginTop: hasSubtitle ? 2 : 0 }}>
          {renderBack()}
        </div>

        {/* Center */}
        <div className="flex flex-col items-center flex-2 text-center">
          {title && (
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  color: c.text1,
                  fontSize: 17 /* iOS nav bar exception */,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                }}
              >
                {title}
              </span>
              {badge != null && badge > 0 && <CountBadge count={badge} />}
            </div>
          )}
          {/* FIX 1.4: subtitle fontSize 10 → 12 (minimum readable) */}
          {subtitle && (
            <span style={{ color: c.text2, fontSize: 12, marginTop: 1 }}>{subtitle}</span>
          )}
        </div>

        {/* Right — keeps placeholder for centering in standard variant */}
        <div
          className="flex items-center gap-1.5 flex-1 justify-end"
          style={{ marginTop: hasSubtitle ? 2 : 0 }}
        >
          {renderRight(false)}
        </div>
      </div>
      {showBreadcrumb && <Breadcrumb minDepth={breadcrumbMinDepth} />}
    </div>
  );
}

/* ─── Export CountBadge for reuse in BottomNav, TabBar, etc. ─── */
export { CountBadge };
