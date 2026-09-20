import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Home,
  BarChart2,
  ArrowLeftRight,
  Wallet,
  User,
  Bell,
  HelpCircle,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Layers,
  Zap,
  Globe,
  TrendingUp,
  Target,
  Star,
  PieChart,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

/**
 * ══════════════════════════════════════════════════════════
 *  TABLET SIDEBAR — Collapsible Floating Navigation
 * ══════════════════════════════════════════════════════════
 *
 *  Design philosophy:
 *  - Collapsed: 80px icon-only rail (always visible)
 *  - Expanded: 260px with labels, sections, user info
 *  - Glass morphism background
 *  - Grouped navigation with section dividers
 *  - Active state: left accent bar + highlight bg
 *  - Bottom: user avatar + settings quick access
 *
 *  Distinct from Web sidebar:
 *  - Rounded corners (tablet = softer, more touch-friendly)
 *  - Larger icons (24px vs 20px)
 *  - Grouped by function, not flat list
 *  - Floating over content, not push-aside
 */

const PREFIX = '/t';

interface NavItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Chính',
    items: [
      { path: `${PREFIX}/home`, icon: Home, label: 'Trang chủ' },
      { path: `${PREFIX}/markets`, icon: BarChart2, label: 'Thị trường' },
      { path: `${PREFIX}/trade/btcusdt`, icon: ArrowLeftRight, label: 'Giao dịch' },
    ],
  },
  {
    title: 'Tài sản',
    items: [
      { path: `${PREFIX}/wallet`, icon: Wallet, label: 'Ví' },
      { path: `${PREFIX}/p2p`, icon: Globe, label: 'P2P' },
      { path: `${PREFIX}/earn/savings`, icon: PieChart, label: 'Tiết kiệm' },
    ],
  },
  {
    title: 'Khám phá',
    items: [
      { path: `${PREFIX}/markets/predictions`, icon: Target, label: 'Dự đoán' },
      { path: `${PREFIX}/arena`, icon: Zap, label: 'Arena' },
      { path: `${PREFIX}/launchpad`, icon: Layers, label: 'Launchpad' },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { path: `${PREFIX}/notifications`, icon: Bell, label: 'Thông báo', badge: 3 },
  { path: `${PREFIX}/support`, icon: HelpCircle, label: 'Hỗ trợ' },
  { path: `${PREFIX}/profile/settings`, icon: Settings, label: 'Cài đặt' },
];

export function TabletSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const isActive = (path: string) => {
    const segments = path.replace(PREFIX, '').split('/').filter(Boolean);
    const base = segments[0];
    const currentBase = location.pathname.replace(PREFIX, '').split('/').filter(Boolean)[0];
    return base === currentBase;
  };

  const sidebarWidth = expanded ? 260 : 80;

  return (
    <div
      className="flex flex-col shrink-0 relative z-30"
      style={{
        width: sidebarWidth,
        height: '100%',
        background: c.surface,
        borderRight: `1px solid ${c.divider}`,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* ─── Logo + Collapse toggle ─── */}
      <div
        className="flex items-center shrink-0 px-4"
        style={{
          height: 64,
          borderBottom: `1px solid ${c.divider}`,
          gap: expanded ? 12 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
          }}
        >
          <TrendingUp size={22} color="#fff" strokeWidth={2.5} />
        </div>
        {expanded && (
          <div className="flex flex-col min-w-0">
            <span style={{ color: c.text1, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
              VitTrade
            </span>
            <span style={{ color: c.text3, fontSize: 10, fontWeight: 500 }}>Tablet</span>
          </div>
        )}
      </div>

      {/* ─── Navigation Sections ─── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none"
        style={{ gap: 8 }}
      >
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.title} className="mb-2">
            {/* Section label — only when expanded */}
            {expanded && (
              <div className="px-5 pt-3 pb-1.5">
                <span
                  style={{
                    color: c.text3,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </span>
              </div>
            )}

            {/* Section items */}
            <div className="flex flex-col gap-0.5 px-3">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="relative flex items-center gap-3 rounded-xl transition-colors"
                    style={{
                      height: 48,
                      paddingLeft: expanded ? 14 : 0,
                      justifyContent: expanded ? 'flex-start' : 'center',
                      background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                    }}
                  >
                    {/* Left accent bar */}
                    {active && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                        style={{
                          width: 3,
                          height: 24,
                          background: '#3B82F6',
                          boxShadow: '0 0 8px rgba(59,130,246,0.4)',
                        }}
                      />
                    )}

                    <div className="relative">
                      <Icon
                        size={22}
                        strokeWidth={active ? 2.2 : 1.6}
                        color={active ? '#3B82F6' : c.text2}
                      />
                      {item.badge && item.badge > 0 && (
                        <div
                          className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                          style={{
                            width: 16,
                            height: 16,
                            background: '#EF4444',
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {item.badge}
                        </div>
                      )}
                    </div>

                    {expanded && (
                      <span
                        style={{
                          color: active ? '#3B82F6' : c.text1,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Section divider */}
            {si < NAV_SECTIONS.length - 1 && !expanded && (
              <div className="mx-5 my-2" style={{ height: 1, background: c.divider }} />
            )}
          </div>
        ))}
      </div>

      {/* ─── Bottom Actions ─── */}
      <div
        className="shrink-0 flex flex-col gap-0.5 px-3 py-3"
        style={{ borderTop: `1px solid ${c.divider}` }}
      >
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-3 rounded-xl transition-colors"
              style={{
                height: 42,
                paddingLeft: expanded ? 14 : 0,
                justifyContent: expanded ? 'flex-start' : 'center',
              }}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={1.6} color={c.text3} />
                {item.badge && item.badge > 0 && (
                  <div
                    className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full"
                    style={{
                      width: 14,
                      height: 14,
                      background: '#EF4444',
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {item.badge}
                  </div>
                )}
              </div>
              {expanded && (
                <span style={{ color: c.text3, fontSize: 13, whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 rounded-xl mt-1 transition-colors"
          style={{
            height: 42,
            paddingLeft: expanded ? 14 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            background: c.hoverBg,
          }}
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {expanded ? (
            <ChevronLeft size={20} color={c.text2} />
          ) : (
            <ChevronRight size={20} color={c.text2} />
          )}
          {expanded && <span style={{ color: c.text2, fontSize: 13 }}>Thu gọn</span>}
        </button>
      </div>
    </div>
  );
}
