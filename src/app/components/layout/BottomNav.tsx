import React, { useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Home, BarChart2, ArrowLeftRight, Wallet, User } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';
import { DEVICE } from './MobileFrame';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { UIContext } from '../../contexts/UIContext';
import { CountBadge } from './Header';

/**
 * ══════════════════════════════════════════════════════════
 *  BOTTOM NAV — VitTrade Capsule Style (Phase 1)
 * ══════════════════════════════════════════════════════════
 *
 *  Floating capsule nav with raised center Trade CTA.
 *  Matches VitTrade Flutter visual contract:
 *  - Capsule: gradient surface2→bg, pill radius, subtle border + shadow
 *  - Center CTA: 52×52 raised amber gradient button with glow
 *  - Active item: amber icon + dot indicator + glow
 *  - Inactive item: text3 icon/label
 *
 *  Accessibility:
 *  - Keyboard navigation: Arrow Left/Right to navigate tabs
 *  - Enter/Space to activate tab
 *  - ARIA labels and current page indicator
 */

const TABS = [
  { key: 'home', icon: Home, label: 'Trang chủ' },
  { key: 'markets', icon: BarChart2, label: 'Thị trường' },
  { key: 'trade/btcusdt', icon: ArrowLeftRight, label: 'Giao dịch', isCenter: true },
  { key: 'wallet', icon: Wallet, label: 'Ví' },
  { key: 'profile', icon: User, label: 'Tôi' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hapticSelection } = useHaptic();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const uiCtx = useContext(UIContext);
  const pendingRewards = uiCtx?.pendingRewards ?? 0;

  const getIsActive = (tabKey: string) => {
    const base = tabKey.split('/')[0];
    const currentPath = location.pathname.replace(/^\/r/, '');
    return currentPath.startsWith(`/${base}`);
  };

  // Keyboard navigation: Arrow keys to move between tabs
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentTabKey: string) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = TABS.findIndex(t => t.key === currentTabKey);
      const nextIndex = e.key === 'ArrowRight'
        ? (currentIndex + 1) % TABS.length
        : (currentIndex - 1 + TABS.length) % TABS.length;
      const nextTab = TABS[nextIndex];
      hapticSelection();
      navigate(`${prefix}/${nextTab.key}`);
    }
  }, [navigate, prefix, hapticSelection]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 flex justify-center"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: DEVICE.HOME_INDICATOR }}
    >
      {/* Floating capsule */}
      <div
        className="relative flex items-center"
        style={{
          width: 'calc(100% - 40px)',
          maxWidth: 400,
          height: 56,
          borderRadius: 999,
          background: 'linear-gradient(180deg, rgba(23,28,36,0.98) 0%, rgba(7,9,13,0.96) 100%)',
          border: '1px solid rgba(45,52,64,0.46)',
          boxShadow: [
            '0 10px 22px rgba(7,9,13,0.45)',
            '0 -1px 28px rgba(229,138,0,0.12)',
          ].join(', '),
        }}
      >
        {TABS.map((tab) => {
          const isActive = getIsActive(tab.key);
          const tabPath = `${prefix}/${tab.key}`;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.key}
                onClick={() => {
                  hapticSelection();
                  navigate(tabPath);
                }}
                onKeyDown={(e) => handleKeyDown(e, tab.key)}
                className="flex-1 flex flex-col items-center justify-center"
                style={{ minHeight: 48 }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Raised CTA button */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    marginTop: -22,
                    background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryDark} 100%)`,
                    boxShadow: [
                      `0 4px 16px ${c.primaryAlpha40}`,
                      `0 8px 32px ${c.primaryAlpha20}`,
                      'inset 0 1px 0 rgba(255,255,255,0.2)',
                      'inset 0 -1px 0 rgba(0,0,0,0.1)',
                    ].join(', '),
                    transition: 'transform var(--tr-duration-fast) var(--tr-ease-standard), box-shadow var(--tr-duration-fast) ease',
                  }}
                >
                  <Icon size={22} color={c.navCenterIcon} strokeWidth={2.2} />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: c.navActive,
                    letterSpacing: 0.1,
                    marginTop: 2,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => {
                hapticSelection();
                navigate(tabPath);
              }}
              className="flex-1 flex flex-col items-center justify-center"
              style={{
                gap: 2,
                minHeight: 48,
                paddingTop: 6,
                paddingBottom: 2,
                transition: 'all var(--tr-duration-normal) ease',
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              onKeyDown={(e) => handleKeyDown(e, tab.key)}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  color={isActive ? c.navActive : c.navInactive}
                  style={{
                    transition: 'color var(--tr-duration-normal) ease, filter var(--tr-duration-normal) ease',
                    filter: isActive ? `drop-shadow(0 0 6px ${c.primaryAlpha40})` : 'none',
                  }}
                />
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      background: c.navActive,
                      boxShadow: `0 0 8px ${c.primaryAlpha60}`,
                    }}
                  />
                )}
                {/* Pending rewards badge on Home tab */}
                {tab.key === 'home' && pendingRewards > 0 && (
                  <span className="absolute -top-1 -right-2.5">
                    <CountBadge count={pendingRewards} />
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? c.navActive : c.navInactive,
                  letterSpacing: 0.1,
                  transition: 'color var(--tr-duration-normal) ease',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
