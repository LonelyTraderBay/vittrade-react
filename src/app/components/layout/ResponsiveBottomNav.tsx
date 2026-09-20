import { Home, BarChart2, ArrowLeftRight, Wallet, User } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import React from 'react';
import { useNavigate, useLocation } from 'react-router';

const TABS = [
  { path: '/r/home', icon: Home, label: 'Trang chủ' },
  { path: '/r/markets', icon: BarChart2, label: 'Thị trường' },
  { path: '/r/trade/btcusdt', icon: ArrowLeftRight, label: 'Giao dịch', isCenter: true },
  { path: '/r/wallet', icon: Wallet, label: 'Ví' },
  { path: '/r/profile', icon: User, label: 'Tôi' },
];

export function ResponsiveBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  const getIsActive = (tabPath: string) => {
    const segments = tabPath.split('/').filter(Boolean);
    const base = segments[1]; // after /r/
    return location.pathname.includes(`/r/${base}`);
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 flex justify-center"
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
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
          boxShadow: ['0 10px 22px rgba(7,9,13,0.45)', '0 -1px 28px rgba(229,138,0,0.12)'].join(
            ', ',
          ),
        }}
      >
        {TABS.map((tab) => {
          const isActive = getIsActive(tab.path);
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center justify-center"
                style={{ minHeight: 48 }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
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
                    transition:
                      'transform var(--tr-duration-fast) var(--tr-ease-standard), box-shadow var(--tr-duration-fast) ease',
                  }}
                >
                  <Icon size={22} color={c.navCenterIcon} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: c.navActive, marginTop: 2 }}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex-1 flex flex-col items-center justify-center"
              style={{ gap: 2, minHeight: 48, paddingTop: 6, paddingBottom: 2 }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  color={isActive ? c.navActive : c.navInactive}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${c.primaryAlpha40})` : 'none',
                  }}
                />
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
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? c.navActive : c.navInactive,
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
