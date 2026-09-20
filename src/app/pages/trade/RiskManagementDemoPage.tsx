/**
 * ══════════════════════════════════════════════════════════════════
 *  RISK MANAGEMENT DEMO PAGE
 * ══════════════════════════════════════════════════════════════════
 *  Phase 1 Implementation Showcase:
 *  1. OCO Orders (One-Cancels-Other)
 *  2. Position Dashboard (Real-time P&L)
 *  3. Position Sizing Calculator
 */

import React, { useState } from 'react';
import { Shield, TrendingUp, Calculator, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { OCOOrderForm, type OCOOrderParams } from '../../components/trading/OCOOrderForm';
import { PositionDashboard, type Position } from '../../components/trading/PositionDashboard';
import { PositionSizingCalculator, type PositionSizeResult } from '../../components/trading/PositionSizingCalculator';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct } from '../../data/formatNumber';

const TABS = ['OCO Orders', 'Positions', 'Calculator'];

// Mock data
const MOCK_POSITIONS: Position[] = [
  {
    id: '1',
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    logoColor: '#F7931A',
    side: 'long',
    amount: 2.5,
    entryPrice: 67200,
    currentPrice: 69000,
    openedAt: '2026-03-10T08:30:00Z',
  },
  {
    id: '2',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    logoColor: '#627EEA',
    side: 'long',
    amount: 15,
    entryPrice: 3180,
    currentPrice: 3300,
    openedAt: '2026-03-09T14:20:00Z',
  },
  {
    id: '3',
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    logoColor: '#14F195',
    side: 'short',
    amount: 100,
    entryPrice: 145,
    currentPrice: 142,
    leverage: 5,
    liquidationPrice: 155,
    openedAt: '2026-03-11T09:00:00Z',
  },
];

export function RiskManagementDemoPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSuccess, hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const [tab, setTab] = useState(TABS[0]);
  const [showOCOSheet, setShowOCOSheet] = useState(false);
  const [showCalcSheet, setShowCalcSheet] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Mock trading pair
  const mockPair = {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    currentPrice: 69000,
    available: 50000, // USDT balance
  };

  const handleOCOSubmit = (params: OCOOrderParams) => {
    console.log('OCO Order Submitted:', params);
    setShowOCOSheet(false);
    hapticSuccess();
    actionToast.success(TOAST.TRADE.ORDER_PLACED('buy'), { haptic: 'success' });
  };

  const handlePositionClick = (position: Position) => {
    console.log('Position clicked:', position);
    // Navigate to position detail or show actions
  };

  const handleCalculatorApply = (amount: number) => {
    console.log('Suggested amount applied:', amount);
    setShowCalcSheet(false);
    hapticSuccess();
    actionToast.success({
      title: 'Đã áp dụng',
      message: `Khối lượng ${amount.toFixed(6)} BTC đã được điền vào form`,
    });
  };

  return (
    <PageLayout>
      <Header title="Risk Management" back />

      {/* Feature Intro */}
      <PageContent padding="default" gap="default">
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)' }}
            >
              <Shield size={20} color="#3B82F6" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 6 }}>
                Phase 1: Risk Management Foundation
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.6 }}>
                3 công cụ quản lý rủi ro chuyên nghiệp giúp bảo vệ vốn và tối ưu hóa lợi nhuận.
                Đây là foundation quan trọng nhất cho enterprise trading platform.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Feature Cards */}
        <div className="grid gap-3">
          <TrCard
            as="button"
            hover
            className="p-4"
            onClick={() => {
              setTab('OCO Orders');
              setShowOCOSheet(true);
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <TrendingUp size={24} color="#10B981" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  OCO Orders
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  Đặt Take Profit + Stop Loss cùng lúc. Khi 1 lệnh khớp, lệnh còn lại tự động hủy.
                </p>
              </div>
              <ChevronRight size={20} color={c.text3} />
            </div>
          </TrCard>

          <TrCard
            as="button"
            hover
            className="p-4"
            onClick={() => {
              setTab('Positions');
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <CheckCircle size={24} color="#F59E0B" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  Position Dashboard
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  Theo dõi P&L thời gian thực, entry price, break-even, và liquidation risk.
                </p>
              </div>
              <ChevronRight size={20} color={c.text3} />
            </div>
          </TrCard>

          <TrCard
            as="button"
            hover
            className="p-4"
            onClick={() => {
              setTab('Calculator');
              setShowCalcSheet(true);
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Calculator size={24} color="#8B5CF6" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  Position Sizing Calculator
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  Tính toán khối lượng lệnh tối ưu dựa trên risk % và stop loss.
                </p>
              </div>
              <ChevronRight size={20} color={c.text3} />
            </div>
          </TrCard>
        </div>

        {/* Benefits */}
        <TrCard className="p-4">
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 12 }}>
            Lợi ích chính
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '🎯', title: 'Quản lý rủi ro tốt hơn', desc: 'Không bị over-leverage, bảo vệ tài khoản' },
              { icon: '📊', title: 'Theo dõi P&L real-time', desc: 'Biết đang lời hay lỗ mọi lúc' },
              { icon: '⚖️', title: 'R:R ratio tối ưu', desc: 'Đảm bảo tiềm năng lời > rủi ro' },
              { icon: '🛡️', title: 'Stop loss tự động', desc: 'OCO orders bảo vệ vị thế 24/7' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span style={{ fontSize: FONT_SCALE.lg }}>{item.icon}</span>
                <div className="flex-1">
                  <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, marginBottom: 2 }}>
                    {item.title}
                  </p>
                  <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Implementation Status */}
        <TrCard className="p-4">
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 12 }}>
            Implementation Status
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'OCO Order Form', status: 'complete' },
              { label: 'Position Dashboard', status: 'complete' },
              { label: 'Position Sizing Calculator', status: 'complete' },
              { label: 'Integration với TradePage', status: 'pending' },
              { label: 'Backend API Integration', status: 'pending' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
                  {item.label}
                </span>
                <span
                  className="px-2 py-1 rounded"
                  style={{
                    fontSize: FONT_SCALE.micro,
                    fontWeight: FONT_WEIGHT.bold,
                    color: item.status === 'complete' ? '#10B981' : '#F59E0B',
                    background: item.status === 'complete' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  }}
                >
                  {item.status === 'complete' ? '✓ Complete' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>

      {/* Tab Content */}
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => { setTab(t); hapticSelection(); }}
        variant="pill"
      />

      <PageContent padding="default" gap="default">
        {tab === 'OCO Orders' && (
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              Nhấn nút bên dưới để mở form đặt lệnh OCO
            </p>
            <button
              onClick={() => setShowOCOSheet(true)}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              <TrendingUp size={16} />
              Mở OCO Order Form
            </button>
          </div>
        )}

        {tab === 'Positions' && (
          <PositionDashboard
            positions={MOCK_POSITIONS}
            totalPortfolioValue={250000}
            onPositionClick={handlePositionClick}
          />
        )}

        {tab === 'Calculator' && (
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              Nhấn nút bên dưới để mở calculator
            </p>
            <button
              onClick={() => setShowCalcSheet(true)}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              }}
            >
              <Calculator size={16} />
              Mở Position Sizing Calculator
            </button>
          </div>
        )}
      </PageContent>

      {/* OCO Order Sheet */}
      <BottomSheetV2
        open={showOCOSheet}
        onClose={() => setShowOCOSheet(false)}
        title="OCO Order Form"
      >
        <OCOOrderForm
          side="buy"
          symbol={mockPair.symbol}
          baseAsset={mockPair.baseAsset}
          currentPrice={mockPair.currentPrice}
          available={mockPair.available}
          onSubmit={handleOCOSubmit}
          onCancel={() => setShowOCOSheet(false)}
        />
      </BottomSheetV2>

      {/* Position Sizing Calculator Sheet */}
      <BottomSheetV2
        open={showCalcSheet}
        onClose={() => setShowCalcSheet(false)}
        title="Position Sizing Calculator"
      >
        <PositionSizingCalculator
          symbol={mockPair.symbol}
          baseAsset={mockPair.baseAsset}
          currentPrice={mockPair.currentPrice}
          accountBalance={mockPair.available}
          onApply={handleCalculatorApply}
        />
      </BottomSheetV2>
    </PageLayout>
  );
}
