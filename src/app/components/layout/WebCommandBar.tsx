import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useUI } from '../../hooks/useUI';
import { WEB_COMMAND_BAR_HEIGHT } from './webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WEB COMMAND BAR — Desktop-Grade Top Navigation
 * ══════════════════════════════════════════════════════════
 *
 *  64px height. Multi-section layout:
 *
 *  ┌──────────────────────────────────────────────────────┐
 *  │  Breadcrumbs  │   [⌘K Search field]   │ 🔔 🌙 👤   │
 *  └──────────────────────────────────────────────────────┘
 *
 *  Enterprise desktop sizing:
 *  - Breadcrumb text: 13px
 *  - Search input: 14px, 42px height
 *  - Action buttons: 36×36px min target
 *  - User avatar: 32×32px
 *  - Clock: 13px tabular-nums
 *  - VIP badge: 11px
 */

const SEGMENT_LABELS: Record<string, string> = {
  w: '',
  home: 'Trang chủ',
  markets: 'Thị trường',
  trade: 'Giao dịch',
  wallet: 'Ví',
  profile: 'Tài khoản',
  p2p: 'P2P',
  arena: 'Arena',
  earn: 'Earn',
  notifications: 'Thông báo',
  support: 'Hỗ trợ',
  predictions: 'Dự đoán',
  settings: 'Cài đặt',
  security: 'Bảo mật',
  deposit: 'Nạp tiền',
  withdraw: 'Rút tiền',
  overview: 'Tổng quan',
  movers: 'Biến động',
  watchlist: 'Theo dõi',
  heatmap: 'Heatmap',
  orders: 'Lệnh',
  bots: 'Bots',
  copy: 'Copy Trading',
  savings: 'Tiết kiệm',
  launchpad: 'Launchpad',
  referral: 'Giới thiệu',
  analytics: 'Phân tích',
  scanner: 'Scanner',
  provider: 'Nhà cung cấp',
  assessment: 'Đánh giá',
  configuration: 'Cấu hình',
  confirmation: 'Xác nhận',
  active: 'Đang hoạt động',
  performance: 'Hiệu suất',
  education: 'Học',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let currentPath = '';
  for (const seg of segments) {
    currentPath += `/${seg}`;
    const label = SEGMENT_LABELS[seg];
    if (label) crumbs.push({ label, path: currentPath });
  }
  return crumbs;
}

export function WebCommandBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const c = useThemeColors();
  const { notifications } = useUI();
  const crumbs = getBreadcrumbs(location.pathname);
  const unreadCount = typeof notifications === 'number' ? notifications : 0;
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(true);
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setSearchQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Get current time for clock display
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isDark = document.documentElement.classList.contains('dark');
  const toggleTheme = useCallback(() => {
    document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light');
  }, []);

  return (
    <div
      className="flex items-center justify-between px-6 shrink-0 gap-4"
      style={{
        height: WEB_COMMAND_BAR_HEIGHT,
        background: c.navBg,
        borderBottom: `1px solid ${c.divider}`,
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      }}
    >
      {/* ─── Left: Breadcrumbs ─── */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-2 shrink-0">
            {i > 0 && <ChevronRight size={13} color={c.text3} className="shrink-0" />}
            <button
              onClick={() => (i < crumbs.length - 1 ? navigate(crumb.path) : undefined)}
              style={{
                color: i === crumbs.length - 1 ? c.text1 : c.text3,
                fontSize: 14,
                fontWeight: i === crumbs.length - 1 ? 600 : 400,
                cursor: i < crumbs.length - 1 ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {crumb.label}
            </button>
          </span>
        ))}
        {crumbs.length === 0 && (
          <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Dashboard</span>
        )}
      </div>

      {/* ─── Center: Search Field ─── */}
      <div className="flex-1 flex justify-center" style={{ maxWidth: 520 }}>
        <div
          className="flex items-center gap-2.5 w-full rounded-xl px-4"
          style={{
            height: 42,
            background: searchFocused ? c.surface2 : c.searchBg,
            border: `1px solid ${searchFocused ? c.primary : c.border}`,
            transition: 'all 0.15s ease',
            boxShadow: searchFocused ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
          }}
        >
          <Search size={16} color={c.text3} className="shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm thị trường, tài sản, tính năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              setSearchFocused(false);
            }}
            className="flex-1 bg-transparent outline-none"
            style={{
              color: c.text1,
              fontSize: 14,
              fontWeight: 400,
            }}
            ref={searchRef}
          />
          {!searchFocused && (
            <div className="flex items-center gap-1 shrink-0">
              <kbd
                className="flex items-center justify-center rounded"
                style={{
                  height: 24,
                  minWidth: 24,
                  padding: '0 5px',
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.text3,
                  fontFamily: 'system-ui',
                }}
              >
                ⌘
              </kbd>
              <kbd
                className="flex items-center justify-center rounded"
                style={{
                  height: 24,
                  minWidth: 24,
                  padding: '0 5px',
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.text3,
                }}
              >
                K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Actions ─── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Clock */}
        <span
          style={{
            color: c.text3,
            fontSize: 13,
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            marginRight: 8,
          }}
        >
          {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="web-cmd-btn flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 36, height: 36 }}
          title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {isDark ? <Sun size={17} color={c.text2} /> : <Moon size={17} color={c.text2} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/w/notifications')}
          className="web-cmd-btn relative flex items-center justify-center rounded-lg transition-colors"
          style={{ width: 36, height: 36 }}
          title="Thông báo"
        >
          <Bell size={17} color={c.text2} />
          {unreadCount > 0 && (
            <div
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                background: '#EF4444',
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                border: `2px solid ${c.navBg}`,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: c.divider, margin: '0 6px' }} />

        {/* User */}
        <button
          onClick={() => navigate('/w/profile')}
          className="web-cmd-btn flex items-center gap-3 rounded-lg px-3 transition-colors"
          style={{ height: 42 }}
        >
          <div
            className="flex items-center justify-center shrink-0 rounded-lg"
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>V</span>
          </div>
          <div className="flex flex-col text-left">
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>VitTrader</span>
            <span style={{ color: c.text3, fontSize: 11 }}>VIP 3</span>
          </div>
        </button>
      </div>
    </div>
  );
}
