import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ChevronDown, ArrowLeftRight, Repeat, BarChart3, Zap,
  CheckCircle, X, Loader2, AlertTriangle, Info,
  Target, Shield, Edit3, Settings, BookOpen,
  ChevronUp, Search, Clock, Briefcase, Download,
} from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { CRYPTO_PAIRS, USER_ASSETS, OPEN_ORDERS, ORDER_HISTORY } from '../../data/mockData';
import { fmtUsd, fmtPrice, fmtPct, fmtFee, fmtAmount } from '../../data/formatNumber';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { MiniChart } from '../../../components/trading/MiniChart';
import { OrderBook } from '../../components/trading/OrderBook';
import { RecentTrades } from '../../components/trading/RecentTrades';
import { TPSLForm, type TPSLValues } from '../../components/trading/TPSLForm';
import { QuickPairSwitcher } from '../../components/trading/QuickPairSwitcher';
import { FeeTierDisplay, getEffectiveFee } from '../../components/trading/FeeTierDisplay';
import { OCOOrderForm } from '../../components/trading/OCOOrderForm';
import { useTradeSettings } from '../../hooks/useTradeSettings';

/* ═══════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════ */
const PCT_BUTTONS = [25, 50, 75, 100];

const ORDER_TYPE_BASIC = [
  { id: 'market', label: 'Thị trường' },
  { id: 'limit', label: 'Giới hạn' },
  { id: 'stop', label: 'Dừng lỗ' },
];

const ORDER_TYPE_ADVANCED = [
  { id: 'stop-limit', label: 'Stop-Limit' },
  { id: 'trailing', label: 'Trailing Stop' },
  { id: 'oco', label: 'OCO' },
];

const SLIPPAGE_PRESETS = [
  { value: 0.1, label: '0.1%', color: '#10B981' },
  { value: 0.5, label: '0.5%', color: '#3B82F6' },
  { value: 1.0, label: '1%', color: '#F59E0B' },
  { value: 2.0, label: '2%', color: '#EF4444' },
];

const DATA_TABS = [
  { id: 'chart', label: 'Chart' },
  { id: 'orderbook', label: 'Sổ lệnh' },
  { id: 'trades', label: 'Giao dịch' },
];

/* ═══════════════════════════════════════════════════════════
   Real-time price simulation hook (Sprint 3)
   ═══════════════════════════════════════════════════════════ */
function useRealtimePrice(basePrice: number) {
  const [price, setPrice] = useState(basePrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(basePrice);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(prev => {
        const delta = (Math.random() - 0.48) * prev * 0.0003;
        const next = Math.max(prev * 0.995, Math.min(prev * 1.005, prev + delta));
        const dir = next > prev ? 'up' : next < prev ? 'down' : null;
        prevRef.current = prev;
        if (dir) {
          setFlash(dir);
          setTimeout(() => setFlash(null), 400);
        }
        return parseFloat(next.toFixed(2));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return { price, flash };
}

/* ═══════════════════════════════════════════════════════════
   Success Toast
   ═══════════════════════════════════════════════════════════ */
function SuccessToast({ side, symbol, onClose }: { side: string; symbol: string; onClose: () => void }) {
  useEffect(() => { const id = setTimeout(onClose, 3500); return () => clearTimeout(id); }, [onClose]);
  const c = useThemeColors();
  return (
    <div className="fixed top-24 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in-up"
      style={{ background: c.surface, border: `1px solid ${side === 'buy' ? '#10B981' : '#EF4444'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: 440, margin: '0 auto' }}>
      <CheckCircle size={φIcon.md} color={side === 'buy' ? '#10B981' : '#EF4444'} />
      <div className="flex-1">
        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Đặt lệnh thành công!</p>
        <p style={{ color: c.text2, fontSize: φ.xs }}>Lệnh {side === 'buy' ? 'mua' : 'bán'} {symbol} đang được xử lý</p>
      </div>
      <button onClick={onClose}><X size={φIcon.sm} color={c.text3} /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main TradePage — All Sprints Integrated
   ═══════════════════════════════════════════════════════════ */
export function TradePage() {
  const navigate = useNavigate();
  const { pairId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSide = (searchParams.get('side') ?? 'buy') as 'buy' | 'sell';
  const { hapticSuccess, hapticMedium, hapticSelection } = useHaptic();
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const actionToast = useActionToast();

  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const usdtAsset = USER_ASSETS.find(a => a.symbol === 'USDT')!;
  const baseAsset = USER_ASSETS.find(a => a.symbol === pair.baseAsset);

  /* ─── Core state ─── */
  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderTypeId, setOrderTypeId] = useState('limit');
  const [limitPrice, setLimitPrice] = useState(pair.price.toFixed(2));
  const [amount, setAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'open' | 'history'>('order');
  const [activePct, setActivePct] = useState<number | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  /* ─── Sprint 1B: TP/SL ─── */
  const [tpsl, setTpsl] = useState<TPSLValues>({
    enabled: false, tpPrice: '', slPrice: '', tpTriggerType: 'last', slTriggerType: 'last',
  });

  /* ─── Sprint 2A: Data view tabs ─── */
  const [dataTab, setDataTab] = useState('chart');

  /* ─── Sprint 2A: Slippage for market orders ─── */
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  /* ─── Sprint 2A: Order modify ─── */
  const [modifyOrderId, setModifyOrderId] = useState<string | null>(null);
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifyAmount, setModifyAmount] = useState('');

  /* ─── Sprint 2B: Quick pair switcher ─── */
  const [showPairSwitcher, setShowPairSwitcher] = useState(false);

  /* ─── Sprint 2B: Advanced order types ─── */
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(false);

  /* ─── Sprint 2B: Trailing stop params ─── */
  const [trailingDelta, setTrailingDelta] = useState('2');

  /* ─── Sprint 3: Real-time price ─── */
  const { price: livePrice, flash } = useRealtimePrice(pair.price);

  /* ─── Trade Settings persistence ─── */
  const { settings: tradeSettings } = useTradeSettings();

  // Apply persisted settings on mount
  useEffect(() => {
    setOrderTypeId(tradeSettings.defaultOrderType);
    setSlippage(tradeSettings.defaultSlippage);
    if (tradeSettings.showTpsl) {
      setTpsl(prev => ({ ...prev, enabled: true, bracketMode: tradeSettings.bracketMode }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Computed ─── */
  const orderTypeLabel = [...ORDER_TYPE_BASIC, ...ORDER_TYPE_ADVANCED].find(t => t.id === orderTypeId)?.label ?? 'Giới hạn';
  const isMarket = orderTypeId === 'market';
  const available = side === 'buy' ? usdtAsset.available : (baseAsset?.available ?? 0);
  const availableLabel = side === 'buy' ? 'USDT' : pair.baseAsset;
  const effectivePrice = isMarket ? livePrice : parseFloat(limitPrice || '0');
  const amountNum = parseFloat(amount || '0');
  const total = effectivePrice * amountNum;
  const feeTier = getEffectiveFee(orderTypeLabel);
  const fee = total * feeTier.rate;
  const isPositive = pair.change24h >= 0;
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';

  /* ─── Sprint 2A: Slippage impact estimate ─── */
  const estimatedImpact = useMemo(() => {
    if (!isMarket || amountNum === 0) return 0;
    return Math.min((amountNum / 10) * 0.15, 3);
  }, [isMarket, amountNum]);

  const handlePct = (pct: number) => {
    setActivePct(pct);
    hapticSelection();
    if (side === 'buy') {
      const maxAmount = (available * pct / 100) / effectivePrice;
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount((available * pct / 100).toFixed(6));
    }
  };

  const canPlace = amountNum > 0 && (isMarket || parseFloat(limitPrice) > 0);

  const handleConfirmOrder = async () => {
    setIsPlacing(true);
    hapticMedium();
    await new Promise(r => setTimeout(r, 1200));
    setIsPlacing(false);
    setShowConfirm(false);
    hapticSuccess();
    actionToast.success(TOAST.TRADE.ORDER_PLACED(side), { haptic: 'success' });

    // Navigate to receipt page (Sprint 2A)
    const receiptData = {
      orderId: 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      side,
      orderType: orderTypeLabel,
      price: effectivePrice,
      amount: amountNum,
      total,
      fee,
      feeRate: feeTier.label,
      timestamp: new Date().toLocaleString('vi-VN'),
      status: 'submitted' as const,
      tpPrice: tpsl.enabled && tpsl.tpPrice ? parseFloat(tpsl.tpPrice) : undefined,
      slPrice: tpsl.enabled && tpsl.slPrice ? parseFloat(tpsl.slPrice) : undefined,
      slippage: isMarket ? estimatedImpact : undefined,
    };
    navigate(`${routePrefix}/trade/order-receipt`, { state: { order: receiptData } });

    // Reset form
    setAmount('');
    setActivePct(null);
    setTpsl({ enabled: false, tpPrice: '', slPrice: '', tpTriggerType: 'last', slTriggerType: 'last' });
  };

  const handlePairSwitch = (newPairId: string) => {
    navigate(`${routePrefix}/trade/${newPairId}`, { replace: true });
  };

  const handleModifyOrder = (orderId: string) => {
    const order = OPEN_ORDERS.find(o => o.id === orderId);
    if (order) {
      setModifyOrderId(orderId);
      setModifyPrice(order.price.toString());
      setModifyAmount(order.amount.toString());
    }
  };

  const handleSaveModify = () => {
    if (modifyOrderId) {
      actionToast.success(`Đã sửa lệnh #${modifyOrderId.slice(-6).toUpperCase()}`);
      setModifyOrderId(null);
    }
  };

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  return (
    <PageLayout>
      {showSuccess && <SuccessToast side={side} symbol={pair.symbol} onClose={() => setShowSuccess(false)} />}

      {/* ═══ Quick Pair Switcher (Sprint 2B) ═══ */}
      <QuickPairSwitcher
        open={showPairSwitcher}
        onClose={() => setShowPairSwitcher(false)}
        currentPairId={pair.id}
        onSelect={handlePairSwitch}
      />

      {/* ═══ Order Confirmation Sheet ═══ */}
      <BottomSheetV2
        open={showConfirm}
        onClose={() => { if (!isPlacing) setShowConfirm(false); }}
        title="Xác nhận lệnh"
        preventClose={isPlacing}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: c.surface2 }}>
            <div className="flex justify-between items-center pb-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <div>
                <p style={{ color: c.text2, fontSize: 12 }}>Lệnh {side === 'buy' ? 'Mua' : 'Bán'}</p>
                <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</p>
              </div>
              <span className="px-3 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: sideColor,
                }}>
                {side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
            </div>

            <BottomSheetRow label="Loại lệnh" value={orderTypeLabel} />
            <BottomSheetRow
              label="Giá"
              value={isMarket ? 'Giá thị trường' : `${fmtUsd(parseFloat(limitPrice || '0'))}`}
            />
            <BottomSheetRow label="Khối lượng" value={`${amount} ${pair.baseAsset}`} />
            <BottomSheetRow label="Thành tiền" value={fmtUsd(total)} highlight />
            <BottomSheetRow label={`Phí (${feeTier.label})`} value={fmtFee(fee)} />

            {/* Slippage for market (Sprint 2A) */}
            {isMarket && (
              <BottomSheetRow
                label="Trượt giá tối đa"
                value={`${slippage}% (ước tính ${estimatedImpact.toFixed(2)}%)`}
              />
            )}

            {/* TP/SL summary (Sprint 1B) */}
            {tpsl.enabled && (tpsl.tpPrice || tpsl.slPrice) && (
              <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${c.divider}` }}>
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Quản lý rủi ro</p>
                {tpsl.tpPrice && (
                  <BottomSheetRow label="Take Profit" value={fmtUsd(parseFloat(tpsl.tpPrice))} />
                )}
                {tpsl.slPrice && (
                  <BottomSheetRow label="Stop Loss" value={fmtUsd(parseFloat(tpsl.slPrice))} />
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-xl px-3 py-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
            <p style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1.5 }}>
              Kiểm tra kỹ thông tin trước khi đặt lệnh. Lệnh đã đặt không thể hoàn tác ngay lập tức.
            </p>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={isPlacing}
            className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-white text-base ripple"
            style={{
              height: 52, borderRadius: 14,
              background: isPlacing ? c.surface2
                : side === 'buy' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
              boxShadow: isPlacing ? 'none'
                : side === 'buy' ? '0 4px 16px rgba(16,185,129,0.3)'
                : '0 4px 16px rgba(239,68,68,0.3)',
              color: isPlacing ? c.text3 : '#fff',
            }}
          >
            {isPlacing ? (
              <div className="contents">
                <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
                Đang đặt lệnh...
              </div>
            ) : (
              `Xác nhận ${side === 'buy' ? 'Mua' : 'Bán'}`
            )}
          </button>
        </div>
      </BottomSheetV2>

      {/* ═══ Order Modify Sheet (Sprint 2A) ═══ */}
      <BottomSheetV2
        open={!!modifyOrderId}
        onClose={() => setModifyOrderId(null)}
        title="Sửa lệnh"
      >
        {modifyOrderId && (() => {
          const order = OPEN_ORDERS.find(o => o.id === modifyOrderId);
          if (!order) return null;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-1 rounded-md text-xs font-bold"
                  style={{
                    background: order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: order.side === 'buy' ? '#10B981' : '#EF4444',
                  }}>
                  {order.side === 'buy' ? 'MUA' : 'BÁN'}
                </span>
                <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{order.symbol}</span>
                <span style={{ color: c.text3, fontSize: 12 }}>#{order.id.slice(-6)}</span>
              </div>

              {/* Price edit */}
              <div>
                <label style={{ color: c.text2, fontSize: 12, marginBottom: 4, display: 'block' }}>
                  Giá mới (USDT)
                </label>
                <div className="flex items-center rounded-xl px-3"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 48 }}>
                  <input type="number" inputMode="decimal"
                    value={modifyPrice}
                    onChange={e => setModifyPrice(formatNum(e.target.value))}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: c.text1, fontSize: 18, flex: 1, fontFamily: 'monospace', fontWeight: 600,
                    }}
                  />
                  <span style={{ color: c.text3, fontSize: 12 }}>USDT</span>
                </div>
                {modifyPrice !== order.price.toString() && (
                  <p style={{ color: '#F59E0B', fontSize: 11, marginTop: 2 }}>
                    Thay đổi: {fmtUsd(parseFloat(modifyPrice || '0') - order.price)} ({((parseFloat(modifyPrice || '0') - order.price) / order.price * 100).toFixed(2)}%)
                  </p>
                )}
              </div>

              {/* Amount edit */}
              <div>
                <label style={{ color: c.text2, fontSize: 12, marginBottom: 4, display: 'block' }}>
                  Khối lượng mới
                </label>
                <div className="flex items-center rounded-xl px-3"
                  style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 48 }}>
                  <input type="number" inputMode="decimal"
                    value={modifyAmount}
                    onChange={e => setModifyAmount(formatNum(e.target.value))}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      color: c.text1, fontSize: 18, flex: 1, fontFamily: 'monospace', fontWeight: 600,
                    }}
                  />
                  <span style={{ color: c.text3, fontSize: 12 }}>{order.symbol.split('/')[0]}</span>
                </div>
              </div>

              {/* Queue position note */}
              <div className="flex items-start gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(59,130,246,0.06)' }}>
                <Info size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
                <p style={{ color: '#3B82F6', fontSize: 11, lineHeight: 1.4 }}>
                  Sửa giá sẽ mất vị trí trong hàng đợi sổ lệnh. Sửa khối lượng giữ nguyên vị trí.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModifyOrderId(null)}
                  className="flex-1 h-12 rounded-xl font-semibold"
                  style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 14 }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveModify}
                  className="flex-[2] h-12 rounded-xl font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    fontSize: 14,
                  }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ═══ Row 1: Pair Selector + Live Price ═══ */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <button onClick={() => setShowPairSwitcher(true)} className="flex items-center gap-3 hover-ghost">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: pair.logoColor + '22' }}>
            <span style={{ color: pair.logoColor, fontSize: φ.xs, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
          </div>
          <span style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, letterSpacing: -0.3 }}>{pair.symbol}</span>
          <ChevronDown size={φIcon.sm} color={c.text2} />
        </button>

        <div className="text-right">
          <p style={{
            color: flash === 'up' ? '#10B981' : flash === 'down' ? '#EF4444' : (isPositive ? '#10B981' : '#EF4444'),
            fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.2,
            transition: 'color 0.3s',
          }}>
            {fmtPrice(livePrice)}
          </p>
          <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: φ.xs, fontFamily: 'monospace' }}>
            {fmtPct(pair.change24h)}
          </p>
        </div>
      </div>

      {/* ═══ Row 2: Quick Nav Chips ═══ */}
      <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <button onClick={() => navigate(`${routePrefix}/trade/convert`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <ArrowLeftRight size={φIcon.sm} color="#10B981" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Convert</span>
        </button>
        <button onClick={() => {
            sessionStorage.setItem('dca_preselect', pair.baseAsset);
            navigate(`${routePrefix}/dca`);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
          <Repeat size={φIcon.sm} color="#8B5CF6" />
          <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Mua định kỳ</span>
        </button>
        <button onClick={() => navigate(`${routePrefix}/trade/${pair.id}/futures`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <BarChart3 size={φIcon.sm} color="#EF4444" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Futures</span>
        </button>
        <button onClick={() => navigate(`${routePrefix}/trade/positions`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <Briefcase size={φIcon.sm} color="#3B82F6" />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Vị thế</span>
        </button>
        <button onClick={() => navigate(`${routePrefix}/trade/settings`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover-chip shrink-0"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <Settings size={φIcon.sm} color={c.text3} />
          <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Cài đặt</span>
        </button>
      </div>

      {/* ═══ Data View Tabs: Chart / OrderBook / Trades (Sprint 2A) ═══ */}
      <div className="px-5 pt-1 pb-2">
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: c.surface2 }}>
          {DATA_TABS.map(dt => (
            <button key={dt.id}
              onClick={() => { setDataTab(dt.id); hapticSelection(); }}
              className="flex-1 py-1.5 rounded-md text-center transition-all"
              style={{
                background: dataTab === dt.id ? c.bg : 'transparent',
                color: dataTab === dt.id ? c.text1 : c.text3,
                fontSize: 12, fontWeight: dataTab === dt.id ? 700 : 500,
                boxShadow: dataTab === dt.id ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data view content */}
      <div className="px-5 pb-3" style={{ minHeight: dataTab === 'chart' ? 'auto' : 280 }}>
        {dataTab === 'chart' && (
          <MiniChart
            pairId={pair.id}
            height={120}
            showVolume={true}
            showCurrentPrice={true}
            interactive={true}
          />
        )}
        {dataTab === 'orderbook' && (
          <div className="rounded-xl overflow-hidden" style={{ background: c.surface2, maxHeight: 320 }}>
            <OrderBook price={livePrice} change24h={pair.change24h} />
          </div>
        )}
        {dataTab === 'trades' && (
          <div className="rounded-xl overflow-hidden" style={{ background: c.surface2, maxHeight: 320 }}>
            <RecentTrades price={livePrice} maxRows={15} />
          </div>
        )}
      </div>

      {/* ═══ Main Tab Bar (Segmented) ═══ */}
      <div className="px-5 pb-2">
        <TabBar
          variant="segment"
          tabs={[
            { id: 'order', label: 'Đặt lệnh' },
            { id: 'open', label: `Đang mở (${OPEN_ORDERS.length})` },
            { id: 'history', label: 'Lịch sử' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* ═══ ORDER FORM TAB ═══ */}
      {activeTab === 'order' && (
        <PageContent gap="default">
          {/* Buy / Sell Toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
            <button onClick={() => { setSide('buy'); hapticSelection(); }}
              className="flex-1 h-11 flex items-center justify-center font-bold transition-all"
              style={{
                background: side === 'buy' ? '#10B981' : c.surface2,
                color: side === 'buy' ? '#fff' : c.text2,
                fontSize: 14,
              }}>
              MUA
            </button>
            <button onClick={() => { setSide('sell'); hapticSelection(); }}
              className="flex-1 h-11 flex items-center justify-center font-bold transition-all"
              style={{
                background: side === 'sell' ? '#EF4444' : c.surface2,
                color: side === 'sell' ? '#fff' : c.text2,
                fontSize: 14,
              }}>
              BÁN
            </button>
          </div>

          {/* Order Type Chips — Basic + Advanced toggle (Sprint 2B) */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {ORDER_TYPE_BASIC.map(type => {
                const isActive = orderTypeId === type.id;
                return (
                  <button key={type.id} onClick={() => { setOrderTypeId(type.id); hapticSelection(); }}
                    className="px-4 py-2 rounded-lg transition-all hover-chip"
                    style={{
                      background: isActive ? sideColor + '1A' : c.surface2,
                      color: isActive ? sideColor : c.text2,
                      border: `1px solid ${isActive ? sideColor + '66' : c.borderSolid}`,
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                    }}>
                    {type.label}
                  </button>
                );
              })}
              <button
                onClick={() => { setShowAdvancedTypes(!showAdvancedTypes); hapticSelection(); }}
                className="px-3 py-2 rounded-lg"
                style={{
                  background: showAdvancedTypes ? 'rgba(139,92,246,0.1)' : c.surface2,
                  color: showAdvancedTypes ? '#8B5CF6' : c.text3,
                  border: `1px solid ${showAdvancedTypes ? 'rgba(139,92,246,0.3)' : c.borderSolid}`,
                  fontSize: 11, fontWeight: 600,
                }}
              >
                {showAdvancedTypes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {/* Advanced order types row */}
            {showAdvancedTypes && (
              <div className="flex gap-2">
                {ORDER_TYPE_ADVANCED.map(type => {
                  const isActive = orderTypeId === type.id;
                  return (
                    <button key={type.id} onClick={() => { setOrderTypeId(type.id); hapticSelection(); }}
                      className="px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        background: isActive ? 'rgba(139,92,246,0.15)' : c.surface2,
                        color: isActive ? '#8B5CF6' : c.text2,
                        border: `1px solid ${isActive ? 'rgba(139,92,246,0.4)' : c.borderSolid}`,
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                      }}>
                      {type.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Balance */}
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: 13 }}>Khả dụng</span>
            <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
              {fmtAmount(available, side === 'buy' ? 2 : 6)}{' '}
              <span style={{ color: c.text2 }}>{availableLabel}</span>
            </span>
          </div>

          {/* ═══ OCO ORDER FORM — replaces standard form when OCO selected ═══ */}
          {orderTypeId === 'oco' ? (
            <OCOOrderForm
              side={side}
              symbol={pair.symbol}
              baseAsset={pair.baseAsset}
              currentPrice={livePrice}
              available={available}
              onSubmit={(params) => {
                hapticSuccess();
                actionToast.success(TOAST.TRADE.ORDER_PLACED(side), { haptic: 'success' });
                const receiptData = {
                  orderId: 'OCO-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
                  symbol: pair.symbol,
                  baseAsset: pair.baseAsset,
                  side,
                  orderType: 'OCO',
                  price: livePrice,
                  amount: parseFloat(params.takeProfitAmount),
                  total: livePrice * parseFloat(params.takeProfitAmount),
                  fee: livePrice * parseFloat(params.takeProfitAmount) * 0.001,
                  feeRate: '0.10%',
                  timestamp: new Date().toLocaleString('vi-VN'),
                  status: 'submitted' as const,
                  tpPrice: parseFloat(params.takeProfitPrice),
                  slPrice: parseFloat(params.stopLossPrice),
                };
                navigate(`${routePrefix}/trade/order-receipt`, { state: { order: receiptData } });
              }}
              onCancel={() => {
                setOrderTypeId('limit');
                hapticSelection();
              }}
            />
          ) : (
          <>
          {/* Limit Price Input (non-market orders) */}
          {!isMarket && orderTypeId !== 'trailing' && (
            <div>
              <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
                {orderTypeId === 'stop' || orderTypeId === 'stop-limit' ? 'Giá kích hoạt' : 'Giá đặt'} (USDT)
              </label>
              <div className="flex items-center rounded-xl px-4"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
                <input
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={limitPrice}
                  onChange={e => setLimitPrice(formatNum(e.target.value))}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: 20, flex: 1,
                    fontFamily: 'monospace', fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>USDT</span>
              </div>
            </div>
          )}

          {/* Stop-Limit: second price input */}
          {orderTypeId === 'stop-limit' && (
            <div>
              <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Giá đặt (USDT)
              </label>
              <div className="flex items-center rounded-xl px-4"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
                <input
                  type="number" inputMode="decimal" placeholder="0.00"
                  value={limitPrice}
                  onChange={e => setLimitPrice(formatNum(e.target.value))}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: 20, flex: 1,
                    fontFamily: 'monospace', fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>USDT</span>
              </div>
            </div>
          )}

          {/* Trailing Stop: Delta input (Sprint 2B) */}
          {orderTypeId === 'trailing' && (
            <div>
              <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Trailing Delta (%)
              </label>
              <div className="flex items-center rounded-xl px-4"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
                <input
                  type="number" inputMode="decimal" placeholder="2.0"
                  value={trailingDelta}
                  onChange={e => setTrailingDelta(formatNum(e.target.value))}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: c.text1, fontSize: 20, flex: 1,
                    fontFamily: 'monospace', fontWeight: 600,
                  }}
                />
                <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>%</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>
                Stop sẽ tự động điều chỉnh theo giá tốt nhất, kích hoạt khi giá đảo chiều {trailingDelta}%.
              </p>
            </div>
          )}

          {/* Slippage settings for market orders (Sprint 2A) */}
          {isMarket && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-1.5">
                  <Shield size={12} color={c.text3} />
                  <span style={{ color: c.text2, fontSize: 12 }}>Trượt giá tối đa</span>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ color: c.primary, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                    {slippage}%
                  </span>
                  {showSlippageSettings
                    ? <ChevronUp size={12} color={c.text3} />
                    : <ChevronDown size={12} color={c.text3} />}
                </div>
              </button>

              {showSlippageSettings && (
                <div className="flex gap-2">
                  {SLIPPAGE_PRESETS.map(preset => (
                    <button key={preset.value}
                      onClick={() => { setSlippage(preset.value); hapticSelection(); }}
                      className="flex-1 py-1.5 rounded-lg text-center"
                      style={{
                        background: slippage === preset.value ? preset.color + '15' : c.surface2,
                        color: slippage === preset.value ? preset.color : c.text2,
                        border: `1px solid ${slippage === preset.value ? preset.color + '40' : c.borderSolid}`,
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Price impact warning */}
              {amountNum > 0 && estimatedImpact > 0.5 && (
                <div className="flex items-start gap-1.5 rounded-lg px-2.5 py-2"
                  style={{
                    background: estimatedImpact > 1 ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                  }}>
                  <AlertTriangle size={11}
                    color={estimatedImpact > 1 ? '#EF4444' : '#F59E0B'}
                    className="shrink-0 mt-0.5" />
                  <span style={{
                    color: estimatedImpact > 1 ? '#EF4444' : '#F59E0B',
                    fontSize: 11, lineHeight: 1.4,
                  }}>
                    Ước tính trượt giá: {estimatedImpact.toFixed(2)}%
                    {estimatedImpact > slippage && ' — vượt ngưỡng, lệnh có thể bị từ chối'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
              Khối lượng ({pair.baseAsset})
            </label>
            <div className="flex items-center rounded-xl px-4"
              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
              <input
                type="number" inputMode="decimal" placeholder="0.000000"
                value={amount}
                onChange={e => { setAmount(formatNum(e.target.value)); setActivePct(null); }}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: c.text1, fontSize: 20, flex: 1,
                  fontFamily: 'monospace', fontWeight: 600,
                }}
              />
              <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>{pair.baseAsset}</span>
            </div>
          </div>

          {/* Percentage Quick Buttons */}
          <div className="flex gap-2">
            {PCT_BUTTONS.map(pct => (
              <button key={pct} onClick={() => handlePct(pct)}
                className="flex-1 py-2 rounded-lg transition-all hover-chip"
                style={{
                  background: activePct === pct ? sideColor + '1A' : c.surface2,
                  color: activePct === pct ? sideColor : c.text2,
                  border: `1px solid ${activePct === pct ? sideColor + '66' : c.borderSolid}`,
                  fontSize: 13, fontWeight: 600,
                }}>
                {pct}%
              </button>
            ))}
          </div>

          {/* TP/SL Form (Sprint 1B) */}
          <TPSLForm
            side={side}
            currentPrice={livePrice}
            entryPrice={effectivePrice}
            amount={amountNum}
            baseAsset={pair.baseAsset}
            values={tpsl}
            onChange={setTpsl}
            defaultBracketMode={tradeSettings.bracketMode}
          />

          {/* Total + Fee Summary — Dynamic Fee Tier (Sprint 2B) */}
          <TrCard rounded="sm" className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span style={{ color: c.text2, fontSize: 13 }}>Thành tiền</span>
              <span style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtUsd(total)}
              </span>
            </div>
            <FeeTierDisplay orderType={orderTypeLabel} total={total} />
          </TrCard>

          {/* Place Order Button */}
          <button
            onClick={() => { setShowConfirm(true); hapticMedium(); }}
            disabled={!canPlace}
            className="w-full h-13 rounded-xl flex items-center justify-center font-bold text-white transition-all ripple"
            style={{
              height: 52,
              background: !canPlace ? c.surface2 : side === 'buy'
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
              color: !canPlace ? c.text3 : '#fff',
              boxShadow: !canPlace ? 'none' : side === 'buy'
                ? '0 4px 16px rgba(16,185,129,0.25)'
                : '0 4px 16px rgba(239,68,68,0.25)',
              fontSize: 16,
            }}
            aria-label={`Đặt lệnh ${side === 'buy' ? 'mua' : 'bán'} ${pair.symbol}`}
          >
            {!canPlace ? 'Nhập thông tin lệnh' : `${side === 'buy' ? 'Mua' : 'Bán'} ${pair.baseAsset}`}
          </button>

          <p style={{ color: c.text3, fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
            Kiểm tra kỹ trước khi xác nhận.
          </p>
          </>
          )}
        </PageContent>
      )}

      {/* ═══ OPEN ORDERS TAB — with Modify (Sprint 2A) ══ */}
      {activeTab === 'open' && (
        <PageContent gap="default">
          {OPEN_ORDERS.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <BarChart3 size={28} color={c.borderSolid} />
              </div>
              <p style={{ color: c.text3, fontSize: 14 }}>Không có lệnh đang mở</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {OPEN_ORDERS.map(order => (
                <TrCard key={order.id} rounded="sm" hover className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md text-xs font-bold"
                        style={{
                          background: order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: order.side === 'buy' ? '#10B981' : '#EF4444',
                        }}>
                        {order.side === 'buy' ? 'MUA' : 'BÁN'}
                      </span>
                      <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{order.symbol}</span>
                      <span className="px-2 py-1 rounded text-xs" style={{ background: c.hoverBg, color: c.text2 }}>
                        {order.type}
                      </span>
                      {/* Bracket / OCO badges */}
                      {order.bracketMode && (
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>
                          Bracket
                        </span>
                      )}
                      {order.ocoLinked && (
                        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>
                          OCO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Modify button (Sprint 2A) */}
                      <button
                        onClick={() => handleModifyOrder(order.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}
                      >
                        <Edit3 size={10} />
                        Sửa
                      </button>
                      <button className="px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Hủy
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <p style={{ color: c.text3, fontSize: 12 }}>Giá</p>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                        {fmtPrice(order.price)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: c.text3, fontSize: 12 }}>Khối lượng</p>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                        {order.amount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text3, fontSize: 12 }}>Đã khớp</p>
                      <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                        {order.filled}/{order.amount}
                      </p>
                    </div>
                  </div>

                  {/* Bracket TP/SL inline display */}
                  {(order.bracketMode || order.ocoLinked) && order.tpPrice && order.slPrice && (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg mb-2"
                      style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <div className="flex items-center gap-1">
                        <Target size={10} color="#10B981" />
                        <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                          TP {fmtPrice(order.tpPrice)}
                        </span>
                      </div>
                      <div style={{ width: 1, height: 12, background: c.divider }} />
                      <div className="flex items-center gap-1">
                        <Shield size={10} color="#EF4444" />
                        <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                          SL {fmtPrice(order.slPrice)}
                        </span>
                      </div>
                      <span style={{ color: c.text3, fontSize: 9, marginLeft: 'auto' }}>
                        {order.ocoLinked ? 'Linked' : 'Bracket'}
                      </span>
                    </div>
                  )}

                  {order.status === 'partial' && (
                    <div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface3 }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ background: 'linear-gradient(90deg, #10B981, #34D399)', width: `${(order.filled / order.amount) * 100}%` }} />
                      </div>
                      <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
                        Đã khớp {((order.filled / order.amount) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}

                  <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>{order.createdAt}</p>
                </TrCard>
              ))}
            </div>
          )}

          {/* Export link (Sprint 3) */}
          <button
            onClick={() => navigate(`${routePrefix}/trade/export`)}
            className="flex items-center justify-center gap-2 py-2 rounded-lg"
            style={{ color: c.text3, fontSize: 12 }}
          >
            <Download size={12} />
            Xuất lịch sử giao dịch
          </button>
        </PageContent>
      )}

      {/* ═══ ORDER HISTORY TAB ═══ */}
      {activeTab === 'history' && (
        <PageContent gap="default">
          {ORDER_HISTORY.map(order => (
            <TrCard key={order.id} rounded="sm" hover className="p-4"
              onClick={() => navigate(`${routePrefix}/trade/order-receipt`, {
                state: {
                  order: {
                    orderId: order.id,
                    symbol: order.symbol,
                    baseAsset: order.symbol.split('/')[0],
                    side: order.side,
                    orderType: order.type,
                    price: order.price,
                    amount: order.amount,
                    total: order.price * order.amount,
                    fee: order.fee,
                    feeRate: '0.095%',
                    timestamp: order.createdAt,
                    status: 'submitted',
                  },
                },
              })}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md text-xs font-bold"
                    style={{
                      background: order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: order.side === 'buy' ? '#10B981' : '#EF4444',
                    }}>
                    {order.side === 'buy' ? 'MUA' : 'BÁN'}
                  </span>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{order.symbol}</span>
                </div>
                <span className="px-2 py-1 rounded-md text-xs font-semibold"
                  style={{
                    background: order.status === 'filled' ? 'rgba(16,185,129,0.1)' : order.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: order.status === 'filled' ? '#10B981' : order.status === 'cancelled' ? '#EF4444' : '#F59E0B',
                  }}>
                  {order.status === 'filled' ? 'Đã khớp' : order.status === 'cancelled' ? 'Đã hủy' : 'Một phần'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p style={{ color: c.text3, fontSize: 12 }}>Giá</p>
                  <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmtPrice(order.price)}
                  </p>
                </div>
                <div>
                  <p style={{ color: c.text3, fontSize: 12 }}>Khối lượng</p>
                  <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                    {order.amount}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: c.text3, fontSize: 12 }}>Phí</p>
                  <p style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                    {fmtFee(order.fee)}
                  </p>
                </div>
              </div>

              <p style={{ color: c.text3, fontSize: 12, marginTop: 8 }}>{order.createdAt}</p>
            </TrCard>
          ))}

          {/* Export link (Sprint 3) */}
          <button
            onClick={() => navigate(`${routePrefix}/trade/export`)}
            className="flex items-center justify-center gap-2 py-2 rounded-lg"
            style={{ color: c.text3, fontSize: 12 }}
          >
            <Download size={12} />
            Xuất lịch sử giao dịch
          </button>
        </PageContent>
      )}
    </PageLayout>
  );
}