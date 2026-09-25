import { useNavigate, useLocation } from 'react-router';
import {
  Home,
  BarChart2,
  ArrowLeftRight,
  Wallet,
  Bell,
  HelpCircle,
  Settings,
  Shield,
  Layers,
  Zap,
  Globe,
  TrendingUp,
  Target,
  PieChart,
  Activity,
  FileText,
  Award,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_SIDEBAR_WIDTH, WEB_COMMAND_BAR_HEIGHT } from './webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WEB SIDEBAR — Full Enterprise Navigation Panel
 * ══════════════════════════════════════════════════════════
 *
 *  260px fixed width — always expanded (desktop has space)
 *  Multi-level hierarchy with sections
 *  Active: highlight bar + bg + bold text
 *  Hover: subtle bg highlight (mouse-first interaction)
 *  Bottom: user profile card + version
 *
 *  Enterprise desktop sizing:
 *  - Nav items: 40px height, 14px text
 *  - Sub-items: 34px height, 13px text
 *  - Section labels: 11px uppercase
 *  - Bottom items: 38px height, 13px text
 *  - Icons: 18px primary, 16px secondary
 *  - Brand header: 64px (matches CommandBar)
 */

const PREFIX = '/w';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  children?: { path: string; label: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'TỔNG QUAN',
    items: [
      { path: `${PREFIX}/home`, icon: Home, label: 'Trang chủ' },
      {
        path: `${PREFIX}/markets`,
        icon: BarChart2,
        label: 'Thị trường',
        children: [
          { path: `${PREFIX}/markets/overview`, label: 'Tổng quan' },
          { path: `${PREFIX}/markets/movers`, label: 'Biến động' },
          { path: `${PREFIX}/markets/watchlist`, label: 'Theo dõi' },
          { path: `${PREFIX}/markets/heatmap`, label: 'Heatmap' },
        ],
      },
    ],
  },
  {
    title: 'GIAO DỊCH',
    items: [
      { path: `${PREFIX}/trade/btcusdt`, icon: ArrowLeftRight, label: 'Spot Trading' },
      { path: `${PREFIX}/trade/bots`, icon: Activity, label: 'Trading Bots' },
      { path: `${PREFIX}/trade/copy`, icon: Users, label: 'Copy Trading' },
      { path: `${PREFIX}/trade/orders`, icon: FileText, label: 'Lệnh & Lịch sử' },
    ],
  },
  {
    title: 'TÀI SẢN',
    items: [
      { path: `${PREFIX}/wallet`, icon: Wallet, label: 'Ví' },
      { path: `${PREFIX}/p2p`, icon: Globe, label: 'P2P Trading' },
      { path: `${PREFIX}/earn/savings`, icon: PieChart, label: 'Earn & Savings' },
      { path: `${PREFIX}/launchpad`, icon: Layers, label: 'Launchpad' },
    ],
  },
  {
    title: 'MODULES',
    items: [
      { path: `${PREFIX}/markets/predictions`, icon: Target, label: 'Prediction Markets' },
      { path: `${PREFIX}/arena`, icon: Zap, label: 'Open Arena' },
      { path: `${PREFIX}/referral`, icon: Award, label: 'Giới thiệu' },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { path: `${PREFIX}/notifications`, icon: Bell, label: 'Thông báo', badge: 3 },
  { path: `${PREFIX}/support`, icon: HelpCircle, label: 'Hỗ trợ' },
  { path: `${PREFIX}/profile/security`, icon: Shield, label: 'Bảo mật' },
  { path: `${PREFIX}/profile/settings`, icon: Settings, label: 'Cài đặt' },
];

export function WebSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  const isActive = (path: string) => {
    // Exact match
    if (location.pathname === path) return true;

    // For items with children, match if current path starts with item path
    // Example: /w/markets/overview should activate /w/markets
    if (location.pathname.startsWith(path + '/')) return true;

    return false;
  };

  const isExactActive = (path: string) => location.pathname === path;

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width: WEB_SIDEBAR_WIDTH,
        height: '100%',
        background: c.surface,
        borderRight: `1px solid ${c.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* ─── Brand Header ─── */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: WEB_COMMAND_BAR_HEIGHT, borderBottom: `1px solid ${c.divider}` }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
          }}
        >
          <TrendingUp size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span style={{ color: c.text1, fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>
            VitTrade
          </span>
          <span style={{ color: c.text3, fontSize: 11, fontWeight: 500 }}>Enterprise Web</span>
        </div>
      </div>

      {/* ─── Navigation Sections ─── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <div className="px-5 pt-5 pb-2">
              <span
                style={{
                  color: c.text3,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                {section.title}
              </span>
            </div>

            <div className="flex flex-col px-2.5 gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <div key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className="web-sidebar-item w-full flex items-center gap-3 rounded-lg px-3 transition-colors"
                      style={{
                        height: 40,
                        background: active ? 'rgba(59,130,246,0.08)' : 'transparent',
                        position: 'relative',
                      }}
                    >
                      {active && (
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                          style={{ width: 3, height: 20, background: '#3B82F6' }}
                        />
                      )}
                      <Icon
                        size={18}
                        strokeWidth={active ? 2 : 1.5}
                        color={active ? '#3B82F6' : c.text2}
                      />
                      <span
                        style={{
                          color: active ? '#3B82F6' : c.text1,
                          fontSize: 14,
                          fontWeight: active ? 600 : 400,
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        {item.label}
                      </span>
                      {item.badge && item.badge > 0 && (
                        <span
                          className="flex items-center justify-center rounded"
                          style={{
                            minWidth: 22,
                            height: 20,
                            padding: '0 6px',
                            background: '#EF4444',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#fff',
                            borderRadius: 5,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Sub-items */}
                    {active && item.children && (
                      <div
                        className="flex flex-col ml-9 mt-0.5 mb-1.5 border-l-2"
                        style={{ borderColor: c.divider }}
                      >
                        {item.children.map((child) => (
                          <button
                            key={child.path}
                            onClick={() => navigate(child.path)}
                            className="web-sidebar-subitem flex items-center pl-3.5 rounded-r transition-colors"
                            style={{
                              height: 34,
                              color: isExactActive(child.path) ? '#3B82F6' : c.text2,
                              fontSize: 13,
                              fontWeight: isExactActive(child.path) ? 600 : 400,
                              background: isExactActive(child.path)
                                ? 'rgba(59,130,246,0.05)'
                                : 'transparent',
                            }}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Bottom Section ─── */}
      <div
        className="shrink-0 flex flex-col px-2.5 py-2.5 gap-0.5"
        style={{ borderTop: `1px solid ${c.divider}` }}
      >
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="web-sidebar-item w-full flex items-center gap-3 rounded-lg px-3 transition-colors"
              style={{
                height: 38,
                background: active ? 'rgba(59,130,246,0.06)' : 'transparent',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} color={active ? '#3B82F6' : c.text3} />
              <span
                style={{
                  color: active ? '#3B82F6' : c.text2,
                  fontSize: 13,
                  flex: 1,
                  textAlign: 'left',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {item.label}
              </span>
              {item.badge && (
                <span
                  className="rounded"
                  style={{
                    minWidth: 20,
                    height: 18,
                    padding: '0 5px',
                    background: 'rgba(239,68,68,0.15)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* User Profile Card */}
        <button
          onClick={() => navigate(`${PREFIX}/profile`)}
          className="web-sidebar-item flex items-center gap-3 rounded-lg px-3 mt-2 transition-colors"
          style={{ height: 52, background: c.hoverBg }}
        >
          <div
            className="flex items-center justify-center shrink-0 rounded-lg"
            style={{
              width: 34,
              height: 34,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>V</span>
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span
              style={{
                color: c.text1,
                fontSize: 13,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              VitTrader Pro
            </span>
            <span style={{ color: c.text3, fontSize: 11 }}>VIP 3 · v2.4.1</span>
          </div>
        </button>
      </div>
    </div>
  );
}
