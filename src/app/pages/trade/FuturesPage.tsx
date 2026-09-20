import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import {
  ChevronDown, AlertTriangle, X, Info, TrendingUp, TrendingDown,
  Zap, Shield, Target, RefreshCw, CheckCircle, ChevronRight,
} from 'lucide-react';
import { CRYPTO_PAIRS } from '../../data/mockData';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { TabBar } from '../../components/layout/TabBar';
import { TrCard } from '../../components/ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd, fmtPrice, fmtPct, fmtSignedUsd } from '../../data/formatNumber';

const LEVERAGES = [1, 2, 3, 5, 10, 20, 50, 75, 100];

interface FuturesPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  leverage: number;
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidPrice: number;
  pnl: number;
  pnlPct: number;
  margin: number;
  roe: number;
}

const MOCK_POSITIONS: FuturesPosition[] = [
  {
    id: 'fp1', symbol: 'ETH/USDT', side: 'long', leverage: 10,
    size: 0.5, entryPrice: 3480.00, markPrice: 3521.45,
    liquidPrice: 3150.00, pnl: 20.73, pnlPct: 1.19, margin: 174.00, roe: 11.9,
  },
  {
    id: 'fp2', symbol: 'SOL/USDT', side: 'short', leverage: 5,
    size: 10, entryPrice: 185.00, markPrice: 178.32,
    liquidPrice: 222.00, pnl: 66.80, pnlPct: 3.61, margin: 370.00, roe: 18.05,
  },
];

export function FuturesPage() {
  const { pairId } = useParams<{ pairId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  const handleClose = () => {
    navigate(`${prefix}/trade/${pairId || 'btc-usdt'}`);
  };

  // Read newLeverage from location.state (returned from LeveragePage)
  const incomingLeverage = (location.state as any)?.newLeverage;

  const [side, setSide] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(incomingLeverage ?? 10);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [margin, setMargin] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [tpEnabled, setTpEnabled] = useState(false);
  const [slEnabled, setSlEnabled] = useState(false);
  const [tp, setTp] = useState('');
  const [sl, setSl] = useState('');
  const [tab, setTab] = useState<'trade' | 'positions' | 'orders'>('trade');
  const [showSuccess, setShowSuccess] = useState(false);

  // Update leverage when returning from LeveragePage
  React.useEffect(() => {
    if (incomingLeverage && incomingLeverage !== leverage) {
      setLeverage(incomingLeverage);
    }
  }, [incomingLeverage]);

  const marginNum = parseFloat(margin || '0');
  const positionSize = marginNum * leverage;
  const contractQty = positionSize / pair.price;
  const liquidationDist = side === 'long' ? (100 / leverage) * 0.9 : (100 / leverage) * 0.9;
  const liqPrice = side === 'long'
    ? pair.price * (1 - liquidationDist / 100)
    : pair.price * (1 + liquidationDist / 100);

  const canOpen = marginNum > 0 && marginNum <= 5000;

  const handleOpen = async () => {
    if (!canOpen) return;
    setShowSuccess(true);
    setMargin('');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Navigate to standalone LeveragePage
  const openLeveragePage = () => {
    navigate(`${prefix}/trade/${pairId || 'btc-usdt'}/futures/leverage`, {
      state: { currentLeverage: leverage },
    });
  };

  return (
    <PageLayout>
      {showSuccess && (
        <div className="fixed top-24 left-5 right-5 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: c.surface, border: `1px solid ${side === 'long' ? '#10B981' : '#EF4444'}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 440, margin: '0 auto' }}>
          <CheckCircle size={20} color={side === 'long' ? '#10B981' : '#EF4444'} />
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
              Mở vị thế {side === 'long' ? 'Long' : 'Short'} thành công!
            </p>
            <p style={{ color: c.text2, fontSize: 12 }}>{pair.symbol} • {leverage}x • {positionSize.toFixed(2)} USDT</p>
          </div>
          <button onClick={() => setShowSuccess(false)}><X size={16} color={c.text3} /></button>
        </div>
      )}

      {/* Header + Breadcrumb */}
      <Header variant="custom" breadcrumb>
        <div className="flex items-center justify-between px-5 py-3 relative z-10"
          style={{ background: c.bg, borderBottom: `1px solid ${c.divider}`, backdropFilter: 'saturate(180%) blur(24px)', minHeight: 52 }}>
          <button onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl relative z-20"
            style={{ background: c.hoverBg }}>
            <X size={20} color={c.text1} />
          </button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <span style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>{pair.symbol}</span>
              <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>FUTURES</span>
            </div>
            <span style={{ color: pair.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 13 }}>
              {fmtUsd(pair.price)} ({fmtPct(pair.change24h)})
            </span>
          </div>
          <button onClick={() => navigate(`${prefix}/trade/advanced-chart/${pairId}`)}
            className="w-10 h-10 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <TrendingUp size={18} color={c.text2} />
          </button>
        </div>
      </Header>

      {/* Tab bar */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'trade', label: '⚡ Giao dịch' },
          { id: 'positions', label: `📊 Vị thế (${MOCK_POSITIONS.length})` },
          { id: 'orders', label: '📋 Lệnh' },
        ]}
        active={tab}
        onChange={setTab}
        className="mx-5 mt-3"
      />

      {/* TRADE TAB */}
      {tab === 'trade' && (
        <div className="px-5 mt-3 flex flex-col gap-3">
          {/* Leverage + margin info */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Mark Price', value: fmtUsd(pair.price), color: c.text1 },
              { label: 'Index', value: `$${(pair.price * 0.9998).toFixed(2)}`, color: c.text1 },
              { label: 'Funding', value: '+0.01%', color: side === 'long' ? '#EF4444' : '#10B981' },
            ].map(s => (
              <TrCard key={s.label} className="p-3 text-center">
                <p style={{ color: s.color, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                <p style={{ color: c.text3, fontSize: 10 }}>{s.label}</p>
              </TrCard>
            ))}
          </div>

          {/* Long / Short selector */}
          <div className="flex rounded-2xl p-1 gap-1" style={{ background: c.surface2 }}>
            <button onClick={() => setSide('long')}
              className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{ background: side === 'long' ? '#10B981' : 'transparent', color: side === 'long' ? '#fff' : c.text2, fontSize: 14 }}>
              <TrendingUp size={16} />Long
            </button>
            <button onClick={() => setSide('short')}
              className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{ background: side === 'short' ? '#EF4444' : 'transparent', color: side === 'short' ? '#fff' : c.text2, fontSize: 14 }}>
              <TrendingDown size={16} />Short
            </button>
          </div>

          {/* Order type + Leverage */}
          <div className="flex gap-2">
            <div className="flex rounded-2xl p-1 gap-1 flex-1" style={{ background: c.surface2 }}>
              {(['market', 'limit'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold"
                  style={{ background: orderType === t ? c.chipActiveBg : 'transparent', color: orderType === t ? c.chipActiveText : c.chipText }}>
                  {t === 'market' ? 'Thị trường' : 'Giới hạn'}
                </button>
              ))}
            </div>
            <button onClick={openLeveragePage}
              className="flex items-center gap-2 px-4 h-11 rounded-2xl font-bold"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontSize: 14 }}>
              <Zap size={14} />{leverage}x
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Limit price */}
          {orderType === 'limit' && (
            <div className="rounded-2xl px-4"
              style={{ background: c.surface, border: `1.5px solid ${c.borderSolid}`, height: 52, borderRadius: 14 }}
              onClick={() => {}}>
              <label style={{ color: c.text3, fontSize: 12, display: 'block', paddingTop: 8 }}>Giá giới hạn (USDT)</label>
              <input
                type="number" inputMode="decimal"
                placeholder={pair.price.toFixed(2)}
                value={limitPrice}
                onChange={e => setLimitPrice(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, fontFamily: 'monospace', width: '100%' }}
              />
            </div>
          )}

          {/* Margin input */}
          <div className="rounded-2xl px-4 py-2"
            style={{ background: c.surface, border: `1.5px solid ${marginNum > 0 ? (side === 'long' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)') : c.borderSolid}` }}>
            <label style={{ color: c.text3, fontSize: 12, display: 'block', paddingTop: 4 }}>Ký quỹ (USDT)</label>
            <div className="flex items-center gap-2">
              <input
                type="number" inputMode="decimal"
                placeholder="Nhập số tiền ký quỹ"
                value={margin}
                onChange={e => setMargin(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 16, fontFamily: 'monospace', flex: 1 }}
              />
              <span style={{ color: c.text3, fontSize: 13 }}>USDT</span>
            </div>
          </div>

          {/* Pct quick fill */}
          <div className="flex gap-2">
            {[10, 25, 50, 100].map(pct => (
              <button key={pct} onClick={() => setMargin(((5000 * pct) / 100).toString())}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}` }}>
                {pct}%
              </button>
            ))}
          </div>

          {/* Position preview */}
          {marginNum > 0 && (
            <TrCard className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <p style={{ color: c.text2, fontSize: 12, marginBottom: 2 }}>Ước tính vị thế</p>
                <button className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                  Thêm ký quỹ
                </button>
              </div>
              {[
                { label: 'Giá trị hợp đồng', value: fmtUsd(positionSize) },
                { label: 'Số lượng', value: `${contractQty.toFixed(4)} ${pair.baseAsset}` },
                { label: 'Giá thanh lý', value: fmtUsd(liqPrice), color: '#EF4444' },
                { label: 'Phí mở vị thế', value: `$${(positionSize * 0.0002).toFixed(4)}`, color: '#F59E0B' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span style={{ color: c.text3, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: (row as any).color ?? c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
                </div>
              ))}
            </TrCard>
          )}

          {/* TP/SL toggles */}
          <div className="flex gap-2">
            <button onClick={() => setTpEnabled(!tpEnabled)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-semibold"
              style={{ background: tpEnabled ? 'rgba(16,185,129,0.12)' : c.surface2, color: tpEnabled ? '#10B981' : c.text2, border: `1px solid ${tpEnabled ? 'rgba(16,185,129,0.3)' : c.borderSolid}` }}>
              <Target size={14} />Take Profit
            </button>
            <button onClick={() => setSlEnabled(!slEnabled)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-xs font-semibold"
              style={{ background: slEnabled ? 'rgba(239,68,68,0.1)' : c.surface2, color: slEnabled ? '#EF4444' : c.text2, border: `1px solid ${slEnabled ? 'rgba(239,68,68,0.2)' : c.borderSolid}` }}>
              <Shield size={14} />Stop Loss
            </button>
          </div>

          {tpEnabled && (
            <div className="rounded-2xl px-4 py-2"
              style={{ background: c.surface, border: '1.5px solid rgba(16,185,129,0.3)' }}>
              <label style={{ color: '#10B981', fontSize: 12, display: 'block', paddingTop: 4 }}>Take Profit (USDT)</label>
              <input
                type="number" inputMode="decimal"
                placeholder={`> ${pair.price.toFixed(2)}`}
                value={tp}
                onChange={e => setTp(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, fontFamily: 'monospace', width: '100%' }}
              />
            </div>
          )}

          {slEnabled && (
            <div className="rounded-2xl px-4 py-2"
              style={{ background: c.surface, border: '1.5px solid rgba(239,68,68,0.3)' }}>
              <label style={{ color: '#EF4444', fontSize: 12, display: 'block', paddingTop: 4 }}>Stop Loss (USDT)</label>
              <input
                type="number" inputMode="decimal"
                placeholder={`< ${pair.price.toFixed(2)}`}
                value={sl}
                onChange={e => setSl(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, fontFamily: 'monospace', width: '100%' }}
              />
            </div>
          )}

          {/* Open button */}
          <button
            onClick={handleOpen}
            disabled={!canOpen}
            className="w-full rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{
              height: 52, borderRadius: 14,
              background: canOpen
                ? side === 'long'
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)'
                : c.surface2,
              color: canOpen ? '#fff' : c.text3,
              boxShadow: canOpen ? `0 4px 20px ${side === 'long' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` : 'none',
              fontSize: 16,
            }}>
            {canOpen ? `Mở ${leverage}x ${side === 'long' ? 'Long' : 'Short'}` : 'Nhập ký quỹ'}
          </button>

          {/* Risk warning */}
          <div className="flex items-start gap-2 px-3 py-3 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
            <p style={{ color: '#F59E0B', fontSize: 12, lineHeight: 1.5 }}>
              Giao dịch hợp đồng tương lai có rủi ro cao. Bạn có thể mất toàn bộ ký quỹ. Chỉ giao dịch số tiền bạn có thể chấp nhận mất.
            </p>
          </div>
        </div>
      )}

      {/* POSITIONS TAB */}
      {tab === 'positions' && (
        <div className="px-5 mt-3 flex flex-col gap-3">
          {MOCK_POSITIONS.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <TrendingUp size={32} color={c.text3} />
              </div>
              <p style={{ color: c.text3, fontSize: 14 }}>Chưa có vị thế nào</p>
            </div>
          ) : (
            MOCK_POSITIONS.map(pos => (
              <TrCard key={pos.id} className="p-4"
                accentBorder={pos.side === 'long' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-xs font-bold"
                      style={{ background: pos.side === 'long' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: pos.side === 'long' ? '#10B981' : '#EF4444' }}>
                      {pos.side === 'long' ? 'LONG' : 'SHORT'}
                    </span>
                    <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{pos.symbol}</span>
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6' }}>
                      {pos.leverage}x
                    </span>
                  </div>
                  <div className="text-right">
                    <p style={{ color: pos.pnl >= 0 ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                      {fmtSignedUsd(pos.pnl)}
                    </p>
                    <p style={{ color: pos.pnl >= 0 ? '#10B981' : '#EF4444', fontSize: 12 }}>
                      ROE {fmtPct(pos.roe)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: 'Kích thước', value: `${pos.size} ${pos.symbol.split('/')[0]}` },
                    { label: 'Ký quỹ', value: `$${pos.margin.toFixed(2)}` },
                    { label: 'Giá vào lệnh', value: `$${pos.entryPrice.toLocaleString()}` },
                    { label: 'Giá thanh lý', value: `$${pos.liquidPrice.toLocaleString()}`, color: '#EF4444' },
                  ].map(r => (
                    <div key={r.label} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: 10 }}>{r.label}</p>
                      <p style={{ color: (r as any).color ?? c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{r.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-3 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                    Thêm ký quỹ
                  </button>
                  <button className="flex-1 py-3 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
                    TP/SL
                  </button>
                  <button className="flex-1 py-3 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    Đóng
                  </button>
                </div>
              </TrCard>
            ))
          )}

          {/* Account summary */}
          <TrCard className="p-4">
            <p style={{ color: c.text2, fontSize: 13, marginBottom: 10 }}>Tài khoản Futures</p>
            {[
              { label: 'Số dư', value: '$5,000.00' },
              { label: 'Ký qu đang dùng', value: `$${MOCK_POSITIONS.reduce((s, p) => s + p.margin, 0).toFixed(2)}` },
              { label: 'Ký quỹ khả dụng', value: `$${(5000 - MOCK_POSITIONS.reduce((s, p) => s + p.margin, 0)).toFixed(2)}` },
              { label: 'PnL chưa thực hiện', value: `+$${MOCK_POSITIONS.reduce((s, p) => s + p.pnl, 0).toFixed(2)}`, color: '#10B981' },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text2, fontSize: 13 }}>{row.label}</span>
                <span style={{ color: (row as any).color ?? c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
              </div>
            ))}
          </TrCard>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="px-5 mt-3">
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
              <RefreshCw size={32} color={c.text3} />
            </div>
            <p style={{ color: c.text3, fontSize: 14 }}>Không có lệnh chờ</p>
            <button onClick={() => setTab('trade')}
              className="px-6 py-3 rounded-2xl text-sm font-semibold"
              style={{ background: '#3B82F6', color: '#fff' }}>
              Đặt lệnh mới
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}