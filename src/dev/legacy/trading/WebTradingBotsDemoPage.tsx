/**
 * ══════════════════════════════════════════════════════════
 *  WebTradingBotsPage — Enterprise Desktop Trading Bots
 * ══════════════════════════════════════════════════════════
 *
 *  Desktop-native version of the Trading Bots page.
 *  Uses enterprise font/spacing/icon tokens from webConstants.ts.
 *
 *  Layout:
 *  ┌───────────────────────────────────────────────────────┐
 *  │  Header: Trading Bots + subtitle                     │
 *  ├───────────────────────────────────────────────────────┤
 *  │  Summary Bar: 4 stats inline                         │
 *  ├───────────────────────────────────────────────────────┤
 *  │  Tabs: Bot của tôi | Chiến lược                      │
 *  ├───────────────────────────────────────────────────────┤
 *  │  My Bots:  2-column card grid                        │
 *  │  Marketplace: 2-column strategy cards                │
 *  └───────────────────────────────────────────────────────┘
 */

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Bot,
  Pause,
  Play,
  Settings,
  Trash2,
  Plus,
  BarChart2,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useWebStyles } from '@/shared/theme/useWebStyles';
import { fmtSignedUsd, fmtPct } from '@/shared/lib/formatNumber';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '@/shared/theme/webTokens';

/* ═══════════════════════════════════════════
   Data types & mock data
   ═══════════════════════════════════════════ */

interface BotStrategy {
  id: string;
  name: string;
  description: string;
  longDesc: string;
  icon: string;
  color: string;
  risk: 'low' | 'medium' | 'high';
  avgReturn: string;
  suitableFor: string;
  params: Array<{
    key: string;
    label: string;
    type: 'number' | 'select' | 'range';
    options?: string[];
    defaultValue: string;
    unit?: string;
  }>;
}

const STRATEGIES: BotStrategy[] = [
  {
    id: 'dca',
    name: 'DCA Bot',
    description: 'Dollar Cost Averaging — Mua định kỳ, giảm rủi ro biến động',
    longDesc:
      'DCA Bot tự động mua một lượng cố định theo chu kỳ thời gian, bất kể giá tăng hay giảm. Chiến lược này giảm tác động của biến động giá ngắn hạn.',
    icon: '📅',
    color: '#3B82F6',
    risk: 'low',
    avgReturn: '+8–15% / năm',
    suitableFor: 'Nhà đầu tư dài hạn, người mới',
    params: [
      {
        key: 'pair',
        label: 'Cặp giao dịch',
        type: 'select',
        options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'],
        defaultValue: 'BTC/USDT',
      },
      { key: 'amount', label: 'Mỗi lần mua', type: 'number', defaultValue: '50', unit: 'USDT' },
      {
        key: 'interval',
        label: 'Chu kỳ',
        type: 'select',
        options: ['Mỗi giờ', 'Mỗi ngày', 'Mỗi tuần', 'Mỗi tháng'],
        defaultValue: 'Mỗi ngày',
      },
      {
        key: 'totalBudget',
        label: 'Ngân sách tổng',
        type: 'number',
        defaultValue: '1000',
        unit: 'USDT',
      },
    ],
  },
  {
    id: 'grid',
    name: 'Grid Bot',
    description: 'Lưới giá — Mua thấp bán cao tự động trong khoảng giá',
    longDesc:
      'Grid Bot đặt nhiều lệnh mua và bán trong khoảng giá xác định, tự động kiếm lời khi thị trường đi ngang hoặc biến động nhẹ.',
    icon: '⚡',
    color: '#F59E0B',
    risk: 'medium',
    avgReturn: '+15–40% / năm',
    suitableFor: 'Thị trường sideway, trader kinh nghiệm',
    params: [
      {
        key: 'pair',
        label: 'Cặp giao dịch',
        type: 'select',
        options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        defaultValue: 'ETH/USDT',
      },
      { key: 'upperPrice', label: 'Giá trần', type: 'number', defaultValue: '4000', unit: 'USDT' },
      { key: 'lowerPrice', label: 'Giá sàn', type: 'number', defaultValue: '3000', unit: 'USDT' },
      { key: 'gridCount', label: 'Số lưới', type: 'number', defaultValue: '20', unit: 'lưới' },
      { key: 'investment', label: 'Đầu tư', type: 'number', defaultValue: '500', unit: 'USDT' },
    ],
  },
  {
    id: 'martingale',
    name: 'Martingale Bot',
    description: 'Tăng gấp đôi khi thua — Phục hồi nhanh sau drawdown',
    longDesc:
      'Martingale tăng gấp đôi kích thước lệnh sau mỗi lần thua để bù đắp khi thắng. Tiềm năng lợi nhuận cao nhưng rủi ro cũng cao hơn.',
    icon: '🎯',
    color: '#8B5CF6',
    risk: 'high',
    avgReturn: '+30–80% / năm',
    suitableFor: 'Trader chuyên nghiệp, vốn lớn',
    params: [
      {
        key: 'pair',
        label: 'Cặp giao dịch',
        type: 'select',
        options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        defaultValue: 'BTC/USDT',
      },
      { key: 'baseOrder', label: 'Lệnh cơ bản', type: 'number', defaultValue: '20', unit: 'USDT' },
      { key: 'multiplier', label: 'Hệ số nhân', type: 'number', defaultValue: '2', unit: 'x' },
      {
        key: 'maxOrders',
        label: 'Số lệnh tối đa',
        type: 'number',
        defaultValue: '5',
        unit: 'lệnh',
      },
      { key: 'takeProfit', label: 'Take profit', type: 'number', defaultValue: '2', unit: '%' },
    ],
  },
  {
    id: 'momentum',
    name: 'Momentum Bot',
    description: 'Theo đà thị trường — Mua khi uptrend, bán khi downtrend',
    longDesc:
      'Momentum Bot sử dụng chỉ báo kỹ thuật (RSI, MACD) để xác định xu hướng và tự động vào/ra lệnh theo momentum của thị trường.',
    icon: '📈',
    color: '#10B981',
    risk: 'medium',
    avgReturn: '+20–50% / năm',
    suitableFor: 'Thị trường trending, trader trung cấp',
    params: [
      {
        key: 'pair',
        label: 'Cặp giao dịch',
        type: 'select',
        options: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
        defaultValue: 'BTC/USDT',
      },
      {
        key: 'investment',
        label: 'Vốn giao dịch',
        type: 'number',
        defaultValue: '500',
        unit: 'USDT',
      },
      { key: 'rsiPeriod', label: 'RSI Period', type: 'number', defaultValue: '14', unit: '' },
      { key: 'stopLoss', label: 'Stop loss', type: 'number', defaultValue: '5', unit: '%' },
      { key: 'takeProfit', label: 'Take profit', type: 'number', defaultValue: '10', unit: '%' },
    ],
  },
];

const RISK_CONFIG = {
  low: { label: 'Thấp', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  medium: { label: 'Trung bình', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'Cao', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

interface ActiveBot {
  id: string;
  strategyId: string;
  strategyName: string;
  icon: string;
  color: string;
  pair: string;
  status: 'running' | 'paused' | 'stopped';
  profit: number;
  profitPct: number;
  trades: number;
  investment: number;
  startDate: string;
  runtime: string;
}

const ACTIVE_BOTS: ActiveBot[] = [
  {
    id: 'bot1',
    strategyId: 'dca',
    strategyName: 'DCA Bot',
    icon: '📅',
    color: '#3B82F6',
    pair: 'BTC/USDT',
    status: 'running',
    profit: 84.2,
    profitPct: 8.42,
    trades: 47,
    investment: 1000,
    startDate: '01/01/2026',
    runtime: '52 ngày',
  },
  {
    id: 'bot2',
    strategyId: 'grid',
    strategyName: 'Grid Bot',
    icon: '⚡',
    color: '#F59E0B',
    pair: 'ETH/USDT',
    status: 'running',
    profit: 127.4,
    profitPct: 25.48,
    trades: 234,
    investment: 500,
    startDate: '15/01/2026',
    runtime: '38 ngày',
  },
  {
    id: 'bot3',
    strategyId: 'momentum',
    strategyName: 'Momentum Bot',
    icon: '📈',
    color: '#10B981',
    pair: 'SOL/USDT',
    status: 'paused',
    profit: -12.3,
    profitPct: -2.46,
    trades: 18,
    investment: 500,
    startDate: '10/02/2026',
    runtime: '13 ngày',
  },
];

/* ═══════════════════════════════════════════
   Create Bot Dialog (centered modal for desktop)
   ═══════════════════════════════════════════ */

function CreateBotDialog({
  strategy,
  onClose,
  onCreate,
}: {
  strategy: BotStrategy;
  onClose: () => void;
  onCreate: () => void;
}) {
  const c = useThemeColors();
  const [params, setParams] = useState<Record<string, string>>(
    Object.fromEntries(strategy.params.map((p) => [p.key, p.defaultValue])),
  );
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col"
        style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 20,
          width: 520,
          maxHeight: '80vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${c.divider}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: strategy.color + '18',
                fontSize: 24,
              }}
            >
              {strategy.icon}
            </div>
            <div>
              <h3 style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, margin: 0 }}>
                {strategy.name}
              </h3>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>
                {strategy.suitableFor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-colors"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.surface2,
            }}
          >
            <X size={WEB_ICON.md} color={c.text3} />
          </button>
        </div>

        {/* Dialog Body */}
        <div className="overflow-y-auto flex-1" style={{ padding: 24 }}>
          <div className="flex flex-col" style={{ gap: 20 }}>
            {/* Description */}
            <div
              style={{
                background: strategy.color + '0A',
                border: `1px solid ${strategy.color}22`,
                borderRadius: 14,
                padding: '14px 16px',
              }}
            >
              <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                {strategy.longDesc}
              </p>
            </div>

            {/* Params */}
            {strategy.params.map((param) => (
              <div key={param.key}>
                <label
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  {param.label}
                  {param.unit && (
                    <span style={{ color: c.text3, fontWeight: 400 }}> ({param.unit})</span>
                  )}
                </label>
                {param.type === 'select' ? (
                  <div className="flex gap-2 flex-wrap">
                    {param.options?.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setParams((p) => ({ ...p, [param.key]: opt }))}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          background: params[param.key] === opt ? strategy.color : c.surface2,
                          color: params[param.key] === opt ? '#fff' : c.text2,
                          border: `1px solid ${params[param.key] === opt ? strategy.color : c.border}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3"
                    style={{
                      background: c.surface2,
                      border: `1.5px solid ${strategy.color}33`,
                      height: WEB_SPACING.rowDefault,
                      borderRadius: 12,
                      padding: '0 16px',
                    }}
                  >
                    <input
                      type="number"
                      inputMode="decimal"
                      value={params[param.key]}
                      onChange={(e) => setParams((p) => ({ ...p, [param.key]: e.target.value }))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        flex: 1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                    {param.unit && (
                      <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{param.unit}</span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Risk warning for high risk */}
            {strategy.risk === 'high' && (
              <div
                className="flex items-start gap-3"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <AlertTriangle size={WEB_ICON.sm} color="#EF4444" className="shrink-0 mt-0.5" />
                <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
                  Chiến lược này có rủi ro cao. Bạn có thể mất nhiều hơn vốn ban đầu nếu thị trường
                  biến động mạnh.
                </p>
              </div>
            )}

            {/* Agreement */}
            <button
              onClick={() => setAgreed(!agreed)}
              className="flex items-start gap-3"
              style={{
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  marginTop: 1,
                  border: `2px solid ${agreed ? strategy.color : c.border}`,
                  background: agreed ? strategy.color : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {agreed && <CheckCircle size={14} color="#fff" />}
              </div>
              <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6 }}>
                Tôi hiểu các rủi ro và đồng ý với{' '}
                <span style={{ color: '#3B82F6', cursor: 'pointer' }}>điều khoản sử dụng Bot</span>
              </span>
            </button>
          </div>
        </div>

        {/* Dialog Footer */}
        <div
          className="shrink-0"
          style={{
            padding: '16px 24px 20px',
            borderTop: `1px solid ${c.divider}`,
          }}
        >
          <button
            onClick={() => {
              if (agreed) {
                onCreate();
                onClose();
              }
            }}
            disabled={!agreed}
            style={{
              width: '100%',
              height: WEB_BUTTON.lg,
              borderRadius: 12,
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              border: 'none',
              cursor: agreed ? 'pointer' : 'not-allowed',
              background: agreed
                ? `linear-gradient(135deg, ${strategy.color} 0%, ${strategy.color}bb 100%)`
                : c.surface2,
              color: agreed ? '#fff' : c.text3,
              boxShadow: agreed ? `0 4px 20px ${strategy.color}33` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {agreed ? `Khởi chạy ${strategy.name}` : 'Nhập thông số và đồng ý điều khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Summary Stat Card
   ═══════════════════════════════════════════ */

function SummaryStatCard({
  icon: Icon,
  label,
  value,
  valueColor,
  subValue,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
  subValue?: string;
}) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center gap-4"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: '18px 20px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: (valueColor || c.text1) + '12',
        }}
      >
        <Icon size={WEB_ICON.lg} color={valueColor || c.text2} />
      </div>
      <div className="min-w-0">
        <p
          style={{
            color: c.text3,
            fontSize: WEB_FONT.xs,
            fontWeight: 600,
            letterSpacing: 0.3,
            textTransform: 'uppercase' as const,
            margin: 0,
            marginBottom: 4,
          }}
        >
          {label}
        </p>
        <p
          style={{
            color: valueColor || c.text1,
            fontSize: WEB_FONT.xl,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {value}
        </p>
        {subValue && (
          <p
            style={{
              color: c.text3,
              fontSize: WEB_FONT.xs,
              margin: 0,
              marginTop: 2,
            }}
          >
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Bot Card (desktop)
   ═══════════════════════════════════════════ */

function BotCard({
  bot,
  onToggle,
  onDelete,
}: {
  bot: ActiveBot;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();
  const isRunning = bot.status === 'running';
  const profitColor = bot.profit >= 0 ? '#10B981' : '#EF4444';

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        opacity: bot.status === 'stopped' ? 0.6 : 1,
        transition: 'box-shadow 0.2s ease',
      }}
      className="web-cmd-btn"
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${c.divider}`,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: bot.color + '15',
              fontSize: 20,
            }}
          >
            {bot.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                {bot.strategyName}
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  background: bot.color + '18',
                  color: bot.color,
                }}
              >
                {bot.pair}
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 3 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: isRunning ? '#10B981' : '#F59E0B',
                  boxShadow: isRunning ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
                }}
              />
              <span
                style={{
                  color: isRunning ? '#10B981' : '#F59E0B',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                }}
              >
                {isRunning ? 'Đang chạy' : 'Tạm dừng'}
              </span>
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>· {bot.runtime}</span>
            </div>
          </div>
        </div>

        {/* P/L */}
        <div className="text-right shrink-0" style={{ marginLeft: 16 }}>
          <p
            style={{
              color: profitColor,
              fontSize: WEB_FONT.lg,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              margin: 0,
            }}
          >
            {fmtSignedUsd(bot.profit)}
          </p>
          <p
            style={{
              color: profitColor,
              fontSize: WEB_FONT.sm,
              fontVariantNumeric: 'tabular-nums',
              margin: 0,
              marginTop: 2,
            }}
          >
            {fmtPct(bot.profitPct)}
          </p>
        </div>
      </div>

      {/* Card Body — Stats Row */}
      <div className="grid grid-cols-3 gap-3" style={{ padding: '14px 20px' }}>
        {[
          { label: 'Đầu tư', value: `$${bot.investment.toLocaleString()}`, icon: DollarSign },
          { label: 'Số lệnh', value: `${bot.trades}`, icon: Activity },
          { label: 'Ngày bắt đầu', value: bot.startDate, icon: Clock },
        ].map((s) => {
          const SIcon = s.icon;
          return (
            <div
              key={s.label}
              style={{
                background: c.surface2,
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                <SIcon size={12} color={c.text3} />
                <span
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </span>
              </div>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card Footer — Actions */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: '12px 20px 16px',
        }}
      >
        <button
          onClick={onToggle}
          className="flex items-center justify-center gap-2 transition-colors"
          style={{
            flex: 1,
            height: WEB_BUTTON.md,
            borderRadius: 10,
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid ${isRunning ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
            background: isRunning ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
            color: isRunning ? '#F59E0B' : '#10B981',
          }}
        >
          {isRunning ? <Pause size={WEB_ICON.xs} /> : <Play size={WEB_ICON.xs} />}
          {isRunning ? 'Tạm dừng' : 'Tiếp tục'}
        </button>
        <button
          className="flex items-center justify-center gap-2 transition-colors"
          style={{
            height: WEB_BUTTON.md,
            padding: '0 16px',
            borderRadius: 10,
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            cursor: 'pointer',
            border: `1px solid rgba(59,130,246,0.2)`,
            background: 'rgba(59,130,246,0.06)',
            color: '#3B82F6',
          }}
        >
          <Settings size={WEB_ICON.xs} />
          Cài đặt
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 transition-colors"
          style={{
            height: WEB_BUTTON.md,
            padding: '0 16px',
            borderRadius: 10,
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.06)',
            color: '#EF4444',
          }}
        >
          <Trash2 size={WEB_ICON.xs} />
          Xóa
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Strategy Card (desktop)
   ═══════════════════════════════════════════ */

function StrategyCard({ strategy, onSelect }: { strategy: BotStrategy; onSelect: () => void }) {
  const c = useThemeColors();
  const risk = RISK_CONFIG[strategy.risk];

  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
      }}
      className="web-cmd-btn"
    >
      <div style={{ padding: '20px 24px' }}>
        {/* Top row */}
        <div className="flex items-start gap-4" style={{ marginBottom: 16 }}>
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: strategy.color + '15',
              border: `1.5px solid ${strategy.color}30`,
              fontSize: 26,
            }}
          >
            {strategy.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3" style={{ marginBottom: 6 }}>
              <span style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                {strategy.name}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  background: risk.bg,
                  color: risk.color,
                }}
              >
                Rủi ro: {risk.label}
              </span>
            </div>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.base,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {strategy.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
          <div style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}>
            <p
              style={{
                color: c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 500,
                margin: 0,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
              }}
            >
              Lợi nhuận kỳ vọng
            </p>
            <p
              style={{
                color: '#10B981',
                fontSize: WEB_FONT.md,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {strategy.avgReturn}
            </p>
          </div>
          <div style={{ background: c.surface2, borderRadius: 10, padding: '12px 14px' }}>
            <p
              style={{
                color: c.text3,
                fontSize: WEB_FONT.xs,
                fontWeight: 500,
                margin: 0,
                marginBottom: 4,
                textTransform: 'uppercase' as const,
              }}
            >
              Phù hợp với
            </p>
            <p
              style={{
                color: c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {strategy.suitableFor}
            </p>
          </div>
        </div>

        {/* Param tags */}
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 18 }}>
          <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Thông số:</span>
          {strategy.params.slice(0, 4).map((p) => (
            <span
              key={p.key}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                fontSize: WEB_FONT.xs,
                fontWeight: 500,
                background: strategy.color + '0D',
                color: strategy.color,
              }}
            >
              {p.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onSelect}
          className="flex items-center justify-center gap-2 w-full transition-all"
          style={{
            height: WEB_BUTTON.lg,
            borderRadius: 12,
            fontSize: WEB_FONT.md,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: `linear-gradient(135deg, ${strategy.color} 0%, ${strategy.color}bb 100%)`,
            color: '#fff',
            boxShadow: `0 4px 16px ${strategy.color}30`,
          }}
        >
          <Plus size={WEB_ICON.sm} />
          Tạo Bot {strategy.name}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════ */

export function WebTradingBotsDemoPage() {
  const c = useThemeColors();
  const ws = useWebStyles();
  const [tab, setTab] = useState<'mybots' | 'marketplace'>('mybots');
  const [selectedStrategy, setSelectedStrategy] = useState<BotStrategy | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bots, setBots] = useState<ActiveBot[]>(ACTIVE_BOTS);

  const totalProfit = bots.reduce((s, b) => s + b.profit, 0);
  const totalInvestment = bots.reduce((s, b) => s + b.investment, 0);
  const runningCount = bots.filter((b) => b.status === 'running').length;

  const toggleBot = (id: string) => {
    setBots((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === 'running' ? 'paused' : 'running' } : b,
      ),
    );
  };

  const tabs = [
    { id: 'mybots' as const, label: `Bot của tôi (${bots.length})`, icon: Bot },
    { id: 'marketplace' as const, label: 'Chiến lược', icon: Zap },
  ];

  return (
    <PageLayout>
      {/* Centered modal for desktop */}
      {selectedStrategy && (
        <CreateBotDialog
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
          onCreate={() => {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
        />
      )}

      {/* Success toast */}
      {showSuccess && (
        <div
          className="fixed z-50 flex items-center gap-3"
          style={{
            top: 80,
            right: 40,
            background: c.surface,
            border: '1px solid rgba(16,185,129,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            borderRadius: 14,
            padding: '14px 20px',
            minWidth: 340,
          }}
        >
          <CheckCircle size={WEB_ICON.lg} color="#10B981" />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, margin: 0 }}>
              Bot đã được khởi chạy!
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0 }}>
              Bot đang hoạt động và giao dịch tự động
            </p>
          </div>
          <button onClick={() => setShowSuccess(false)}>
            <X size={WEB_ICON.sm} color={c.text3} />
          </button>
        </div>
      )}

      {/* Header */}
      <Header title="Trading Bots" subtitle="Bot giao dịch · Trade" back />

      {/* Content wrapper */}
      <div style={{ padding: '24px 0 40px' }}>
        {/* ─── Summary Stats Bar ─── */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}
        >
          <SummaryStatCard
            icon={Bot}
            label="Bot đang chạy"
            value={runningCount.toString()}
            valueColor="#3B82F6"
            subValue={`${bots.length} bot tổng`}
          />
          <SummaryStatCard
            icon={DollarSign}
            label="Tổng đầu tư"
            value={`$${totalInvestment.toLocaleString()}`}
            subValue="Across all bots"
          />
          <SummaryStatCard
            icon={TrendingUp}
            label="Tổng lợi nhuận"
            value={fmtSignedUsd(totalProfit)}
            valueColor={totalProfit >= 0 ? '#10B981' : '#EF4444'}
            subValue={fmtPct((totalProfit / totalInvestment) * 100)}
          />
          <SummaryStatCard
            icon={Activity}
            label="Tổng lệnh"
            value={bots.reduce((s, b) => s + b.trades, 0).toLocaleString()}
            valueColor="#8B5CF6"
            subValue="Giao dịch tự động"
          />
        </div>

        {/* ─── Tab Navigation ─── */}
        <div
          className="flex items-center gap-1"
          style={{
            background: c.surface2,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            display: 'inline-flex',
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            const TIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 transition-all"
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  fontSize: WEB_FONT.base,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: active ? c.surface : 'transparent',
                  color: active ? c.text1 : c.text3,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <TIcon size={WEB_ICON.sm} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── My Bots Tab ─── */}
        {tab === 'mybots' && (
          <div>
            {bots.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '64px 32px',
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: c.surface2,
                    marginBottom: 16,
                  }}
                >
                  <Bot size={32} color={c.text3} />
                </div>
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.lg,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Chưa có bot nào đang chạy
                </p>
                <p style={{ color: c.text3, fontSize: WEB_FONT.base, marginBottom: 20 }}>
                  Tạo bot đầu tiên của bạn để bắt đầu giao dịch tự động
                </p>
                <button
                  onClick={() => setTab('marketplace')}
                  className="flex items-center gap-2"
                  style={{
                    height: WEB_BUTTON.lg,
                    padding: '0 28px',
                    borderRadius: 12,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: '#3B82F6',
                    color: '#fff',
                  }}
                >
                  <Plus size={WEB_ICON.sm} />
                  Tạo Bot mới
                </button>
              </div>
            ) : (
              <div>
                {/* 2-column bot grid */}
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 20 }}
                >
                  {bots.map((bot) => (
                    <BotCard
                      key={bot.id}
                      bot={bot}
                      onToggle={() => toggleBot(bot.id)}
                      onDelete={() => setBots((prev) => prev.filter((b) => b.id !== bot.id))}
                    />
                  ))}

                  {/* Add new bot card */}
                  <button
                    onClick={() => setTab('marketplace')}
                    className="flex flex-col items-center justify-center gap-3 transition-colors"
                    style={{
                      background: 'transparent',
                      border: `2px dashed ${c.border}`,
                      borderRadius: 16,
                      cursor: 'pointer',
                      minHeight: 200,
                      color: '#3B82F6',
                    }}
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: 'rgba(59,130,246,0.08)',
                      }}
                    >
                      <Plus size={WEB_ICON.lg} color="#3B82F6" />
                    </div>
                    <span style={{ fontSize: WEB_FONT.md, fontWeight: 600 }}>Thêm Bot mới</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Marketplace Tab ─── */}
        {tab === 'marketplace' && (
          <div>
            {/* Performance overview */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 24,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <BarChart2 size={WEB_ICON.md} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Hiệu suất chiến lược (30 ngày gần đây)
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'DCA Bot', value: '+9.4%', color: '#3B82F6', icon: '📅' },
                  { label: 'Grid Bot', value: '+27.1%', color: '#F59E0B', icon: '⚡' },
                  { label: 'Momentum', value: '+18.3%', color: '#10B981', icon: '📈' },
                  { label: 'Martingale', value: '+42.7%', color: '#8B5CF6', icon: '🎯' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-3"
                    style={{ background: c.surface2, borderRadius: 12, padding: '14px 16px' }}
                  >
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <p
                        style={{
                          color: s.color,
                          fontSize: WEB_FONT.lg,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          margin: 0,
                        }}
                      >
                        {s.value}
                      </p>
                      <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, marginTop: 2 }}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2-column strategy grid */}
            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
            >
              {STRATEGIES.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onSelect={() => setSelectedStrategy(strategy)}
                />
              ))}
            </div>

            {/* Risk disclaimer */}
            <div
              className="flex items-start gap-3"
              style={{
                background: c.surface,
                border: `1px solid rgba(245,158,11,0.2)`,
                borderRadius: 14,
                padding: '16px 20px',
              }}
            >
              <AlertTriangle size={WEB_ICON.md} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>Lưu ý quan trọng:</span> Bot
                giao dịch không đảm bảo lợi nhuận. Hiệu suất trong quá khứ không đại diện cho kết
                quả tương lai. Chỉ đầu tư số tiền bạn có thể chấp nhận mất.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
