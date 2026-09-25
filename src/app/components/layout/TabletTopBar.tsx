import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../hooks/useUI';

/**
 * ══════════════════════════════════════════════════════════
 *  TABLET TOP BAR — Contextual Breadcrumb + Quick Actions
 * ══════════════════════════════════════════════════════════
 *
 *  56px height, glass background
 *  Left: Breadcrumb trail (auto-generated from route)
 *  Right: Search, Notifications, Theme toggle, Profile avatar
 *
 *  Distinct from Web command bar:
 *  - Shorter height (56px vs 64px)
 *  - Simpler actions (no keyboard shortcuts hints)
 *  - Touch-optimized button sizes (44px)
 *  - Rounded pill search (vs inline search field)
 */

const SEGMENT_LABELS: Record<string, string> = {
  t: '',
  home: 'Trang chủ',
  markets: 'Thị trường',
  trade: 'Giao dịch',
  wallet: 'Ví',
  profile: 'Tài khoản',
  p2p: 'P2P',
  arena: 'Arena',
  earn: 'Kiếm thêm',
  notifications: 'Thông báo',
  support: 'Hỗ trợ',
  predictions: 'Dự đoán',
  settings: 'Cài đặt',
  security: 'Bảo mật',
  deposit: 'Nạp tiền',
  withdraw: 'Rút tiền',
  launchpad: 'Launchpad',
  referral: 'Giới thiệu',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let currentPath = '';

  for (const seg of segments) {
    currentPath += `/${seg}`;
    const label = SEGMENT_LABELS[seg];
    if (label) {
      crumbs.push({ label, path: currentPath });
    }
  }

  return crumbs;
}

export function TabletTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { notifications } = useUI();
  const crumbs = getBreadcrumbs(location.pathname);
  const unreadCount = typeof notifications === 'number' ? notifications : 0;

  return (
    <div
      className="flex items-center justify-between px-6 shrink-0"
      style={{
        height: 56,
        background: c.navBg,
        borderBottom: `1px solid ${c.divider}`,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      {/* ─── Left: Breadcrumb trail ─── */}
      <div className="flex items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <ChevronRight size={14} color={c.text3} className="shrink-0" />}
            <button
              onClick={() => (i < crumbs.length - 1 ? navigate(crumb.path) : undefined)}
              className="shrink-0"
              style={{
                color: i === crumbs.length - 1 ? c.text1 : c.text3,
                fontSize: 14,
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                cursor: i < crumbs.length - 1 ? 'pointer' : 'default',
              }}
            >
              {crumb.label}
            </button>
          </span>
        ))}
        {crumbs.length === 0 && (
          <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>VitTrade</span>
        )}
      </div>

      {/* ─── Right: Quick actions ─── */}
      <div className="flex items-center gap-2">
        {/* Search pill */}
        <button
          onClick={() => navigate('/t/search')}
          className="flex items-center gap-2 rounded-xl px-4"
          style={{
            height: 40,
            background: c.searchBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <Search size={16} color={c.text3} />
          <span style={{ color: c.text3, fontSize: 13 }}>Tìm kiếm...</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/t/notifications')}
          className="relative flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: c.searchBg,
            border: `1px solid ${c.border}`,
          }}
        >
          <Bell size={18} color={c.text2} />
          {unreadCount > 0 && (
            <div
              className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                background: '#EF4444',
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                border: `2px solid ${c.surface}`,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Profile avatar */}
        <button
          onClick={() => navigate('/t/profile')}
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>V</span>
        </button>
      </div>
    </div>
  );
}
