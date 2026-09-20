/**
 * ══════════════════════════════════════════════════════════════════
 *  MARGIN TRADING NAVIGATION MENU
 * ══════════════════════════════════════════════════════════════════
 *  Entry points for Margin Trading features (P0, P1, P2)
 */

import React from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Activity,
  BarChart3,
  Settings,
  GraduationCap,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
}

function MenuItem({ icon, title, subtitle, badge, badgeColor = '#3B82F6', onClick }: MenuItemProps) {
  const c = useThemeColors();

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-4 flex items-center gap-3 transition-all"
      style={{
        background: c.surface,
        border: `1px solid ${c.borderSolid}`,
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: withAlpha(badgeColor, ALPHA.muted) }}
      >
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            {title}
          </p>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-md"
              style={{
                background: withAlpha(badgeColor, ALPHA.soft),
                color: badgeColor,
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.bold,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4 }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight size={ICON_SIZE.sm} color={c.text3} strokeWidth={ICON_STROKE.standard} />
    </button>
  );
}

export function MarginTradingMenu() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: <TrendingUp size={ICON_SIZE.md} color="#10B981" strokeWidth={ICON_STROKE.bold} />,
      title: 'Margin Trading',
      subtitle: 'Trade với đòn bẩy - P0 Compliance đầy đủ',
      badge: 'LIVE',
      badgeColor: '#10B981',
      path: '/trade/margin',
    },
    {
      icon: <Settings size={ICON_SIZE.md} color="#3B82F6" strokeWidth={ICON_STROKE.bold} />,
      title: 'Advanced Controls',
      subtitle: 'Partial close, Ladder TP/SL, Trailing Stop, Order types',
      badge: 'P1',
      badgeColor: '#3B82F6',
      path: '/trade/margin/advanced-demo',
    },
    {
      icon: <Activity size={ICON_SIZE.md} color="#F59E0B" strokeWidth={ICON_STROKE.bold} />,
      title: 'Market Analytics',
      subtitle: 'OI, Long/Short Ratio, Liquidation Heatmap, Sentiment',
      badge: 'P2',
      badgeColor: '#F59E0B',
      path: '/trade/margin/live-market-data-analytics',
    },
    {
      icon: <GraduationCap size={ICON_SIZE.md} color="#8B5CF6" strokeWidth={ICON_STROKE.bold} />,
      title: 'AI & Advanced Analytics',
      subtitle: 'AI Signals, Risk Analysis, Trade Journal, Position Sizing',
      badge: 'P3',
      badgeColor: '#8B5CF6',
      path: '/trade/margin/advanced-analytics',
    },
  ];

  return (
    <TrCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={ICON_SIZE.md} color={c.primary} strokeWidth={ICON_STROKE.bold} />
        <h2 style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>
          Margin Trading Suite
        </h2>
      </div>

      <p style={{ color: c.text3, fontSize: FONT_SCALE.sm, lineHeight: 1.6, marginBottom: 16 }}>
        Enterprise-level margin trading với đầy đủ regulatory compliance, advanced controls và market intelligence.
      </p>

      <div className="flex flex-col gap-3">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            badge={item.badge}
            badgeColor={item.badgeColor}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2 mt-4 p-3 rounded-xl"
        style={{ background: withAlpha('#8B5CF6', ALPHA.hover) }}
      >
        <Shield size={14} color="#8B5CF6" className="shrink-0 mt-0.5" />
        <div className="flex-1">
          <p style={{ color: '#8B5CF6', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
            Fully Compliant
          </p>
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Đáp ứng MiFID II, ESMA, FCA, MAS regulations. Bao gồm appropriateness test, leverage limits, cost disclosure.
          </p>
        </div>
      </div>
    </TrCard>
  );
}

/**
 * Compact version for Home page quick access
 */
export function MarginTradingQuickAccess() {
  const c = useThemeColors();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => navigate('/trade/margin')}
        className="rounded-xl p-3 text-center transition-all"
        style={{
          background: withAlpha('#10B981', ALPHA.hover),
          border: `1px solid ${withAlpha('#10B981', ALPHA.soft)}`,
        }}
      >
        <TrendingUp size={20} color="#10B981" strokeWidth={ICON_STROKE.bold} className="mx-auto mb-1" />
        <p style={{ color: '#10B981', fontSize: 11, fontWeight: FONT_WEIGHT.bold }}>
          Margin
        </p>
      </button>

      <button
        onClick={() => navigate('/trade/margin/advanced-demo')}
        className="rounded-xl p-3 text-center transition-all"
        style={{
          background: withAlpha('#3B82F6', ALPHA.hover),
          border: `1px solid ${withAlpha('#3B82F6', ALPHA.soft)}`,
        }}
      >
        <Settings size={20} color="#3B82F6" strokeWidth={ICON_STROKE.bold} className="mx-auto mb-1" />
        <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: FONT_WEIGHT.bold }}>
          Advanced
        </p>
      </button>

      <button
        onClick={() => navigate('/trade/margin/market-data-analytics')}
        className="rounded-xl p-3 text-center transition-all"
        style={{
          background: withAlpha('#F59E0B', ALPHA.hover),
          border: `1px solid ${withAlpha('#F59E0B', ALPHA.soft)}`,
        }}
      >
        <Activity size={20} color="#F59E0B" strokeWidth={ICON_STROKE.bold} className="mx-auto mb-1" />
        <p style={{ color: '#F59E0B', fontSize: 11, fontWeight: FONT_WEIGHT.bold }}>
          Analytics
        </p>
      </button>
    </div>
  );
}