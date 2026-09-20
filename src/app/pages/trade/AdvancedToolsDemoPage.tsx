/**
 * ══════════════════════════════════════════════════════════════════
 *  ADVANCED TOOLS DEMO PAGE
 * ══════════════════════════════════════════════════════════════════
 *  Phase 3 Implementation Showcase:
 *  1. Ladder Trading (DOM click-to-trade)
 *  2. Bulk Operations (multi-select orders)
 *  3. Keyboard Shortcuts (pro speed workflow)
 */

import React, { useState } from 'react';
import { Target, CheckSquare, Keyboard, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import {
  LadderTrading,
  type OrderBookLevel,
  type LadderOrder,
} from '../../components/trading/LadderTrading';
import {
  BulkOperations,
  type BulkOrder,
  type BulkModification,
} from '../../components/trading/BulkOperations';
import {
  ShortcutsReference,
  useKeyboardShortcuts,
  DEFAULT_SHORTCUTS,
  ShortcutToast,
  type ShortcutAction,
} from '../../components/trading/KeyboardShortcuts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';

const TABS = ['Ladder', 'Bulk Ops', 'Shortcuts'];

// Mock order book data
const MOCK_ORDERBOOK: OrderBookLevel[] = Array.from({ length: 20 }, (_, i) => {
  const basePrice = 69000;
  const priceStep = 50;
  const price = basePrice + (10 - i) * priceStep;
  const buyVol = i > 10 ? Math.random() * 5 + 1 : 0;
  const sellVol = i <= 10 ? Math.random() * 5 + 1 : 0;
  
  return {
    price,
    buyVolume: buyVol,
    sellVolume: sellVol,
    totalBuyVolume: buyVol * (i + 1) / 2,
    totalSellVolume: sellVol * (21 - i) / 2,
  };
});

// Mock ladder orders
const MOCK_LADDER_ORDERS: LadderOrder[] = [
  { id: '1', price: 68800, amount: 0.5, side: 'buy', filled: 0.1 },
  { id: '2', price: 69200, amount: 0.3, side: 'sell', filled: 0 },
];

// Mock bulk orders
const MOCK_BULK_ORDERS: BulkOrder[] = [
  {
    id: 'o1',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    price: 68500,
    amount: 1.0,
    filled: 0.2,
    remaining: 0.8,
    totalValue: 68500,
    createdAt: '2026-03-11T10:00:00Z',
  },
  {
    id: 'o2',
    symbol: 'BTC/USDT',
    side: 'sell',
    type: 'limit',
    price: 69500,
    amount: 0.8,
    filled: 0,
    remaining: 0.8,
    totalValue: 55600,
    createdAt: '2026-03-11T10:15:00Z',
  },
  {
    id: 'o3',
    symbol: 'ETH/USDT',
    side: 'buy',
    type: 'limit',
    price: 3200,
    amount: 10,
    filled: 3,
    remaining: 7,
    totalValue: 32000,
    createdAt: '2026-03-11T09:30:00Z',
  },
  {
    id: 'o4',
    symbol: 'BTC/USDT',
    side: 'buy',
    type: 'limit',
    price: 68000,
    amount: 0.5,
    filled: 0,
    remaining: 0.5,
    totalValue: 34000,
    createdAt: '2026-03-11T11:00:00Z',
  },
];

export function AdvancedToolsDemoPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSuccess, hapticSelection } = useHaptic();
  const actionToast = useActionToast();

  const [tab, setTab] = useState(TABS[0]);
  const [showLadderSheet, setShowLadderSheet] = useState(false);
  const [showBulkSheet, setShowBulkSheet] = useState(false);
  const [showShortcutsSheet, setShowShortcutsSheet] = useState(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Keyboard shortcuts setup
  const shortcuts: ShortcutAction[] = DEFAULT_SHORTCUTS.map(s => ({
    ...s,
    action: () => {
      console.log('Shortcut triggered:', s.id);
      setShortcutToast(s.label);
      hapticSuccess();
    },
  }));

  useKeyboardShortcuts(shortcuts, true, (actionId) => {
    console.log('Shortcut action:', actionId);
  });

  const handleLadderOrder = (side: 'buy' | 'sell', price: number, amount: number) => {
    console.log('Ladder order:', { side, price, amount });
    hapticSuccess();
    actionToast.success({
      title: `${side === 'buy' ? 'Buy' : 'Sell'} Order Placed`,
      message: `${amount} BTC @ $${price.toLocaleString()}`,
    });
  };

  const handleCancelOrder = (orderId: string) => {
    console.log('Cancel order:', orderId);
    hapticSuccess();
    actionToast.success({ title: 'Order Cancelled', message: `#${orderId}` });
  };

  const handleBulkCancel = (orderIds: string[]) => {
    console.log('Bulk cancel:', orderIds);
    hapticSuccess();
    actionToast.success({
      title: 'Orders Cancelled',
      message: `${orderIds.length} orders cancelled`,
    });
  };

  const handleBulkModify = (orderIds: string[], modification: BulkModification) => {
    console.log('Bulk modify:', { orderIds, modification });
    hapticSuccess();
    actionToast.success({
      title: 'Orders Modified',
      message: `${orderIds.length} orders updated`,
    });
  };

  return (
    <PageLayout>
      <Header title="Advanced Trading Tools" back />

      {/* Feature Intro */}
      <PageContent padding="default" gap="default">
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.3)">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)' }}
            >
              <Zap size={20} color="#3B82F6" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 6 }}>
                Phase 3: Advanced Trading Tools
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.6 }}>
                3 công cụ nâng cao cho pro traders: trade nhanh hơn với ladder,
                quản lý nhiều lệnh cùng lúc, và shortcuts để tăng tốc 3x.
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
              setTab('Ladder');
              setShowLadderSheet(true);
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <Target size={24} color="#10B981" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  Ladder Trading
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  Click bất kỳ giá nào trên order book để đặt lệnh ngay. One-click trading trên DOM.
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
              setTab('Bulk Ops');
              setShowBulkSheet(true);
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <CheckSquare size={24} color="#F59E0B" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  Bulk Operations
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  Select nhiều lệnh, cancel tất cả hoặc shift giá hàng loạt. Tiết kiệm thời gian.
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
              setTab('Shortcuts');
              setShowShortcutsSheet(true);
              hapticSelection();
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,0.12)' }}
              >
                <Keyboard size={24} color="#8B5CF6" />
              </div>
              <div className="flex-1 text-left">
                <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
                  Keyboard Shortcuts
                </p>
                <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                  F1=Buy, F2=Sell, ESC=Cancel All. Trade nhanh hơn 3x với shortcuts tùy chỉnh.
                </p>
              </div>
              <ChevronRight size={20} color={c.text3} />
            </div>
          </TrCard>
        </div>

        {/* Speed Improvements */}
        <TrCard className="p-4" accentBorder="rgba(16,185,129,0.3)">
          <div className="flex items-start gap-3">
            <TrendingUp size={18} color="#10B981" className="shrink-0 mt-1" />
            <div className="flex-1">
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#10B981', marginBottom: 4 }}>
                Trading Speed: 3x Faster
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                Pro traders sử dụng Phase 3 tools đặt lệnh trung bình 3-5 giây thay vì 10-15 giây.
                Master shortcuts để trade nhanh như market makers.
              </p>
            </div>
          </div>
        </TrCard>

        {/* Benefits */}
        <TrCard className="p-4">
          <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 12 }}>
            Advanced Tools Benefits
          </p>
          <div className="flex flex-col gap-3">
            {[
              { icon: '⚡', title: 'Ladder: 1-click orders', desc: 'Không cần nhập giá, click trực tiếp trên DOM' },
              { icon: '📦', title: 'Bulk: Manage 100+ orders', desc: 'Select all → Cancel/Modify hàng loạt' },
              { icon: '⌨️', title: 'Shortcuts: Muscle memory', desc: 'F1/F2 để buy/sell, ESC panic close' },
              { icon: '🎯', title: 'Precision + Speed', desc: 'Vừa nhanh vừa chính xác, như pro traders' },
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
            Phase 3 Progress
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Ladder Trading Component', status: 'complete' },
              { label: 'Bulk Operations Component', status: 'complete' },
              { label: 'Keyboard Shortcuts System', status: 'complete' },
              { label: 'Integration với TradePage', status: 'pending' },
              { label: 'Persistent shortcut settings', status: 'pending' },
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

      {/* Tab Bar */}
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => { setTab(t); hapticSelection(); }}
        variant="pill"
      />

      <PageContent padding="default" gap="default">
        {tab === 'Ladder' && (
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              Click any price level on the order book to place instant orders
            </p>
            <button
              onClick={() => setShowLadderSheet(true)}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
              }}
            >
              <Target size={16} />
              Open Ladder Trading
            </button>
          </div>
        )}

        {tab === 'Bulk Ops' && (
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              Select multiple orders and perform batch actions
            </p>
            <button
              onClick={() => setShowBulkSheet(true)}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              <CheckSquare size={16} />
              Open Bulk Operations
            </button>
          </div>
        )}

        {tab === 'Shortcuts' && (
          <div>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
              View all keyboard shortcuts and customize key bindings
            </p>
            <button
              onClick={() => setShowShortcutsSheet(true)}
              className="w-full px-4 py-3 rounded-xl min-h-12 flex items-center justify-center gap-2"
              style={{
                fontSize: FONT_SCALE.sm,
                fontWeight: FONT_WEIGHT.bold,
                color: '#fff',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              }}
            >
              <Keyboard size={16} />
              View Shortcuts Reference
            </button>
          </div>
        )}
      </PageContent>

      {/* Ladder Sheet */}
      <BottomSheetV2
        open={showLadderSheet}
        onClose={() => setShowLadderSheet(false)}
        title="Ladder Trading"
      >
        <LadderTrading
          symbol="BTC/USDT"
          baseAsset="BTC"
          currentPrice={69000}
          levels={MOCK_ORDERBOOK}
          openOrders={MOCK_LADDER_ORDERS}
          position={{
            side: 'long',
            entryPrice: 68900,
            amount: 1.5,
          }}
          defaultLotSize={0.5}
          lotSizes={[0.1, 0.5, 1.0, 2.0]}
          onPlaceOrder={handleLadderOrder}
          onCancelOrder={handleCancelOrder}
          onModifyOrder={(id, price) => console.log('Modify:', id, price)}
        />
      </BottomSheetV2>

      {/* Bulk Operations Sheet */}
      <BottomSheetV2
        open={showBulkSheet}
        onClose={() => setShowBulkSheet(false)}
        title="Bulk Operations"
      >
        <BulkOperations
          orders={MOCK_BULK_ORDERS}
          onBulkCancel={handleBulkCancel}
          onBulkModify={handleBulkModify}
        />
      </BottomSheetV2>

      {/* Shortcuts Reference Sheet */}
      <BottomSheetV2
        open={showShortcutsSheet}
        onClose={() => setShowShortcutsSheet(false)}
        title="Keyboard Shortcuts"
      >
        <ShortcutsReference
          shortcuts={shortcuts}
          onClose={() => setShowShortcutsSheet(false)}
        />
      </BottomSheetV2>

      {/* Shortcut Toast */}
      {shortcutToast && (
        <ShortcutToast
          action={shortcutToast}
          onDismiss={() => setShortcutToast(null)}
        />
      )}
    </PageLayout>
  );
}
