import { Home, BarChart2, ArrowLeftRight, Wallet, User, Settings, Bell, HelpCircle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import React from 'react';
import { useNavigate, useLocation } from 'react-router';

const NAV_ITEMS = [
  { path: '/r/home', icon: Home, label: 'Trang chủ' },
  { path: '/r/markets', icon: BarChart2, label: 'Thị trường' },
  { path: '/r/trade/btcusdt', icon: ArrowLeftRight, label: 'Giao dịch', isCenter: true },
  { path: '/r/wallet', icon: Wallet, label: 'Ví' },
  { path: '/r/profile', icon: User, label: 'Tôi' },
];

const BOTTOM_ITEMS = [
  { path: '/r/notifications', icon: Bell, label: 'Thông báo' },
  { path: '/r/support', icon: HelpCircle, label: 'Hỗ trợ' },
  { path: '/r/profile/settings', icon: Settings, label: 'Cài đặt' },
];

export function LeftRail() {
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
      className="flex flex-col items-center shrink-0 py-6"
      style={{
        width: 72,
        background: c.navBg,
        borderRight: `1px solid ${c.navBorder}`,
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-8"
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 10L8 5L12 9L17 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Main nav */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const isActive = getIsActive(item.path);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 py-2 my-2"
                aria-label={item.label}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                  }}
                >
                  <Icon size={20} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 9, color: isActive ? '#3B82F6' : c.text3 }}>{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl w-14 transition-colors"
              style={{
                background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
              }}
              aria-label={item.label}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                color={isActive ? '#3B82F6' : c.navInactive}
              />
              <span style={{
                fontSize: 9,
                color: isActive ? '#3B82F6' : c.navInactive,
                fontWeight: isActive ? 600 : 400,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom items */}
      <div className="flex flex-col items-center gap-1 mt-auto pt-4" style={{ borderTop: `1px solid ${c.navBorder}` }}>
        {BOTTOM_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl w-14"
              aria-label={item.label}
            >
              <Icon size={18} strokeWidth={1.8} color={c.navInactive} />
              <span style={{ fontSize: 9, color: c.navInactive }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}