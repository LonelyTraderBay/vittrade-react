import { ChevronDown, AlertTriangle, Info, ArrowLeftRight, BarChart3, Zap, Repeat } from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtPrice, fmtAmount, fmtUsd, fmtPct } from '../../data/formatNumber';
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { CRYPTO_PAIRS, USER_ASSETS, OPEN_ORDERS, ORDER_HISTORY } from '../../data/mockData';
import { PriceAreaChart } from '../../components/trading/PriceAreaChart';
import { OrderBook } from '../../components/trading/OrderBook';
import { PageLayout } from '../../components/layout/PageLayout';

const PCT_BUTTONS = [25, 50, 75, 100];
const ORDER_TYPES = ['Thị trường', 'Giới hạn', 'Dừng lỗ'];

/* ─── Order Form (reused for both mobile & desktop right panel) ─── */
function OrderForm({ pair, initialSide }: { pair: typeof CRYPTO_PAIRS[0]; initialSide: 'buy' | 'sell' }) {
  const c = useThemeColors();
  const usdtAsset = USER_ASSETS.find(a => a.symbol === 'USDT')!;
  const baseAsset = USER_ASSETS.find(a => a.symbol === pair.baseAsset);

  const [side, setSide] = useState<'buy' | 'sell'>(initialSide);
  const [orderType, setOrderType] = useState('Giới hạn');
  const [limitPrice, setLimitPrice] = useState(pair.price.toFixed(2));
  const [amount, setAmount] = useState('');
  const [activePct, setActivePct] = useState<number | null>(null);

  const available = side === 'buy' ? usdtAsset.available : (baseAsset?.available ?? 0);
  const availableLabel = side === 'buy' ? 'USDT' : pair.baseAsset;
  const price = orderType === 'Thị trường' ? pair.price : parseFloat(limitPrice || '0');
  const amountNum = parseFloat(amount || '0');
  const total = price * amountNum;
  const fee = total * 0.001;
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';
  const canPlace = amountNum > 0 && (orderType === 'Thị trường' || parseFloat(limitPrice) > 0);

  const handlePct = (pct: number) => {
    setActivePct(pct);
    if (side === 'buy') {
      const maxAmount = (available * pct / 100) / price;
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount((available * pct / 100).toFixed(6));
    }
  };

  const formatNum = (v: string) => v.replace(/[^\d.]/g, '');

  return (
    <div className="flex flex-col gap-4">
      {/* Buy / Sell Toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${c.borderSolid}` }}>
        <button onClick={() => setSide('buy')}
          className="flex-1 h-11 flex items-center justify-center font-bold"
          style={{ background: side === 'buy' ? '#10B981' : c.surface2, color: side === 'buy' ? '#fff' : c.text2, fontSize: 15 }}>
          MUA
        </button>
        <button onClick={() => setSide('sell')}
          className="flex-1 h-11 flex items-center justify-center font-bold"
          style={{ background: side === 'sell' ? '#EF4444' : c.surface2, color: side === 'sell' ? '#fff' : c.text2, fontSize: 15 }}>
          BÁN
        </button>
      </div>

      {/* Order Type */}
      <div className="flex gap-2">
        {ORDER_TYPES.map(type => (
          <button key={type} onClick={() => setOrderType(type)}
            className="px-3.5 py-1.5 rounded-lg"
            style={{
              background: orderType === type ? sideColor + '1A' : c.surface2,
              color: orderType === type ? sideColor : c.text2,
              border: `1px solid ${orderType === type ? sideColor + '66' : c.borderSolid}`,
              fontSize: 13, fontWeight: orderType === type ? 700 : 500,
            }}>
            {type}
          </button>
        ))}
      </div>

      {/* Available */}
      <div className="flex items-center justify-between">
        <span style={{ color: c.text2, fontSize: 13 }}>Khả dụng</span>
        <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
          {fmtAmount(available, side === 'buy' ? 2 : 6)}
          {' '}<span style={{ color: c.text2 }}>{availableLabel}</span>
        </span>
      </div>

      {/* Limit Price */}
      {orderType !== 'Thị trường' && (
        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
            {orderType === 'Dừng lỗ' ? 'Giá kích hoạt' : 'Giá đặt'} (USDT)
          </label>
          <div className="flex items-center rounded-xl px-4"
            style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
            <input type="number" inputMode="decimal" placeholder="0.00" value={limitPrice}
              onChange={e => setLimitPrice(formatNum(e.target.value))}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 18, flex: 1, fontFamily: 'monospace', fontWeight: 600 }} />
            <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>USDT</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>
          Khối lượng ({pair.baseAsset})
        </label>
        <div className="flex items-center rounded-xl px-4"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, height: 52 }}>
          <input type="number" inputMode="decimal" placeholder="0.000000" value={amount}
            onChange={e => { setAmount(formatNum(e.target.value)); setActivePct(null); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 18, flex: 1, fontFamily: 'monospace', fontWeight: 600 }} />
          <span style={{ color: c.text3, fontSize: 13, fontWeight: 600 }}>{pair.baseAsset}</span>
        </div>
      </div>

      {/* Pct buttons */}
      <div className="flex gap-2">
        {PCT_BUTTONS.map(pct => (
          <button key={pct} onClick={() => handlePct(pct)}
            className="flex-1 py-2 rounded-lg"
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

      {/* Summary */}
      <div className="rounded-xl p-3.5" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
        <div className="flex justify-between items-center mb-2">
          <span style={{ color: c.text2, fontSize: 13 }}>Thành tiền</span>
          <span style={{ color: c.text1, fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtUsd(total)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1" style={{ color: c.text3, fontSize: 12 }}>
            Phí (0.1%) <Info size={11} />
          </span>
          <span style={{ color: c.text3, fontSize: 12, fontFamily: 'monospace' }}>≈ ${fee.toFixed(4)}</span>
        </div>
      </div>

      {/* Submit */}
      <button disabled={!canPlace}
        className="w-full rounded-xl flex items-center justify-center font-bold text-white"
        style={{
          height: 52,
          background: !canPlace ? c.surface2 : side === 'buy'
            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
          color: !canPlace ? c.text3 : '#fff',
          fontSize: 16,
        }}>
        {!canPlace ? 'Nhập thông tin lệnh' : `${side === 'buy' ? 'Mua' : 'Bán'} ${pair.baseAsset}`}
      </button>
    </div>
  );
}

export function ResponsiveTradePage() {
  const navigate = useNavigate();
  const { pairId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSide = (searchParams.get('side') ?? 'buy') as 'buy' | 'sell';
  const { isDesktop } = useBreakpoint();

  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const isPositive = pair.change24h >= 0;

  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook'>('chart');

  /* ─── Left panel: Chart + Orderbook ─── */
  const chartPanel = (
    <div className="flex flex-col" style={{ flex: 1 }}>
      {/* Pair header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button onClick={() => navigate(`${prefix}/markets`)} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: pair.logoColor + '22' }}>
            <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
          </div>
          <span style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{pair.symbol}</span>
          <ChevronDown size={16} color={c.text2} />
        </button>
        <div className="text-right">
          <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.2 }}>
            {fmtPrice(pair.price)}
          </p>
          <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 12, fontFamily: 'monospace' }}>
            {fmtPct(pair.change24h)}
          </p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <button onClick={() => navigate(`${prefix}/trade/convert`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <ArrowLeftRight size={13} color="#10B981" />
          <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Convert</span>
        </button>
        <button onClick={() => {
            sessionStorage.setItem('dca_preselect', pair.baseAsset);
            navigate(`${prefix}/dca`);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
          <Repeat size={13} color="#8B5CF6" />
          <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>Mua định kỳ</span>
        </button>
        <button onClick={() => navigate(`${prefix}/trade/${pair.id}/futures`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <BarChart3 size={13} color="#EF4444" />
          <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Futures</span>
        </button>
      </div>

      {/* Desktop: show chart + orderbook side by side or tabbed */}
      {isDesktop ? (
        <div className="flex gap-4 px-4 pb-4">
          <div className="flex-1">
            <div style={{ height: 400 }}>
              <PriceAreaChart basePrice={pair.price} isPositive={isPositive} timeframe="1H" />
            </div>
          </div>
          <div style={{ width: 280 }}>
            <OrderBook price={pair.price} change24h={pair.change24h} />
          </div>
        </div>
      ) : (
        <div className="contents">
          <div className="flex mx-4 mb-3 rounded-xl p-1" style={{ background: c.surface2 }}>
            {[
              { id: 'chart', label: '📈 Biểu đồ' },
              { id: 'orderbook', label: '📊 Sổ lệnh' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className="flex-1 py-2 rounded-lg text-center"
                style={{
                  background: activeTab === tab.id ? c.chipActiveBg : 'transparent',
                  color: activeTab === tab.id ? c.chipActiveText : c.text3,
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                }}>
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === 'chart' && (
            <div className="px-2" style={{ height: 220 }}>
              <PriceAreaChart basePrice={pair.price} isPositive={isPositive} timeframe="1H" />
            </div>
          )}
          {activeTab === 'orderbook' && (
            <div className="px-0">
              <OrderBook price={pair.price} change24h={pair.change24h} />
            </div>
          )}
        </div>
      )}

      {/* Open orders summary (desktop) */}
      {isDesktop && OPEN_ORDERS.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Lệnh đang mở ({OPEN_ORDERS.length})</span>
            <button onClick={() => navigate(`${prefix}/trade/orders-history`)} style={{ color: '#3B82F6', fontSize: 13 }}>Xem tất cả</button>
          </div>
          <div className="flex flex-col gap-2">
            {OPEN_ORDERS.slice(0, 3).map(order => (
              <div key={order.id} className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{ background: order.side === 'buy' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: order.side === 'buy' ? '#10B981' : '#EF4444' }}>
                    {order.side === 'buy' ? 'MUA' : 'BÁN'}
                  </span>
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{order.symbol}</span>
                </div>
                <span style={{ color: c.text1, fontSize: 13, fontFamily: 'monospace' }}>
                  {fmtPrice(order.price)}
                </span>
                <button className="px-2 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  Hủy
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Desktop: 2-column (left: chart/orderbook, right: order form)
  if (isDesktop) {
    return (
      <PageLayout style={{ background: c.bg }}>
        <div className="flex gap-6 py-4">
          <div className="flex-1 min-w-0">{chartPanel}</div>
          <div style={{ width: 360 }}>
            <TrCard className="p-5 sticky top-4">
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Đặt lệnh — {pair.symbol}</p>
              <OrderForm pair={pair} initialSide={initialSide} />
            </TrCard>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Mobile: stacked
  return (
    <PageLayout style={{ background: c.bg }}>
      {chartPanel}
      <div className="px-4 pb-4">
        <TrCard className="p-5 sticky top-4">
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Đặt lệnh — {pair.symbol}</p>
          <OrderForm pair={pair} initialSide={initialSide} />
        </TrCard>
      </div>
    </PageLayout>
  );
}