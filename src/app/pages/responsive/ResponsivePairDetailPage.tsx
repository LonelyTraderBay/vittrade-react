import { Star, Share2, AlertTriangle, ChevronDown, ChevronLeft, Bell, TrendingUp, Repeat } from 'lucide-react';
import { TrCard } from '../../components/ui/TrCard';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useGoBack } from '../../hooks/useGoBack';
import { fmtPrice, fmtCompact, fmtAbsPct } from '../../data/formatNumber';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CRYPTO_PAIRS, generateRecentTrades, RecentTrade } from '../../data/mockData';
import { PriceAreaChart } from '../../components/trading/PriceAreaChart';
import { OrderBook } from '../../components/trading/OrderBook';
import { Header } from '../../components/layout/Header';
import { useDCAAssetDetailButton } from '../../hooks/useFeatureFlag';
import { useDCAAnalytics } from '../../hooks/useDCAAnalytics';
import { usePairDetailBannerTest } from '../../hooks/useABTest';
import { usePairDetailToCreationFunnel } from '../../hooks/useFunnelTracking';
import { PageLayout } from '../../components/layout/PageLayout';

const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W', '1M'];
const INDICATOR_CHIPS = ['MA', 'EMA', 'BOLL', 'MACD', 'RSI', 'Vol'];

export function ResponsivePairDetailPage() {
  const { pairId } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { isDesktop } = useBreakpoint();
  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const dcaEnabled = useDCAAssetDetailButton();
  const dcaAnalytics = useDCAAnalytics();
  const pairDetailBannerTest = usePairDetailBannerTest();
  const pairDetailToCreationFunnel = usePairDetailToCreationFunnel();

  const [timeframe, setTimeframe] = useState('1H');
  const [activeView, setActiveView] = useState<'chart' | 'orderbook' | 'trades'>('chart');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA', 'Vol']);
  const [isFavorite, setIsFavorite] = useState(pair.isFavorite);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(() => generateRecentTrades(pair.price));
  const [price, setPrice] = useState(pair.price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPrice(prev => {
        const delta = (Math.random() - 0.495) * prev * 0.001;
        const next = parseFloat((prev + delta).toFixed(2));
        setPriceFlash(next > prev ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 600);
        return next;
      });
      setRecentTrades(generateRecentTrades(price));
    }, 2000);
    return () => clearInterval(id);
  }, [price]);

  const isPositive = pair.change24h >= 0;
  const fmtP = (v: number) => fmtPrice(v);

  const handleDCAClick = () => {
    dcaAnalytics.trackEvent('dca_pair_detail_click', {
      coin: pair.baseAsset,
      source: 'pair_detail',
      placement: pairDetailBannerTest.variant,
    });
    pairDetailToCreationFunnel.trackButtonClick();
    pairDetailBannerTest.onBannerClick();
    sessionStorage.setItem('dca_preselect', pair.baseAsset);
    navigate(`${routePrefix}/dca`);
  };

  /* ─── DCA Contextual Banner (reused) ─── */
  const dcaBanner = dcaEnabled ? (
    <button
      onClick={handleDCAClick}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.04) 100%)',
        border: '1px solid rgba(139,92,246,0.15)',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(167,139,250,0.10))' }}>
        <Repeat size={18} color="#8B5CF6" />
      </div>
      <div className="flex-1 text-left">
        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
          Mua định kỳ {pair.baseAsset}
        </p>
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
          Tự động mua theo lịch · Giảm rủi ro biến động
        </p>
      </div>
      <ChevronDown size={16} color="#8B5CF6" style={{ transform: 'rotate(-90deg)' }} />
    </button>
  ) : null;

  /* ─── Desktop Right Panel: Quick Actions ─── */
  const rightPanel = (
    <div className="flex flex-col gap-4" style={{ width: 340 }}>
      {/* Price summary card */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: pair.logoColor + '22' }}>
            <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
          </div>
          <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</span>
        </div>
        <span style={{
          color: priceFlash === 'up' ? '#10B981' : priceFlash === 'down' ? '#EF4444' : c.text1,
          fontSize: 28, fontWeight: 700, fontFamily: 'monospace', transition: 'color 0.3s',
        }}>
          {fmtP(price)}
        </span>
        <div className="flex items-center gap-2 mt-2">
          <span className="rounded-lg px-2 py-1 text-sm font-semibold"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: isPositive ? '#10B981' : '#EF4444',
            }}>
            {isPositive ? '▲' : '▼'} {fmtAbsPct(pair.change24h)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: '24h Cao', value: fmtP(pair.high24h), color: '#10B981' },
            { label: '24h Thấp', value: fmtP(pair.low24h), color: '#EF4444' },
            { label: 'KL 24h', value: fmtCompact(pair.volume24h), color: c.text2 },
          ].map(s => (
            <div key={s.label}>
              <span style={{ color: c.text3, fontSize: 11 }}>{s.label}</span>
              <br />
              <span style={{ color: s.color, fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Quick buy/sell */}
      <TrCard className="p-4">
        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Thống kê 24h</p>
        <div className="flex gap-3 mb-3">
          <button onClick={() => navigate(`${routePrefix}/trade/${pairId}?side=buy`)}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
            MUA
          </button>
          <button onClick={() => navigate(`${routePrefix}/trade/${pairId}?side=sell`)}
            className="flex-1 h-12 rounded-2xl flex items-center justify-center font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
            BAN
          </button>
        </div>
        <button onClick={() => navigate(`${routePrefix}/markets/alerts`)}
          className="w-full h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Bell size={14} /> Đặt cảnh báo giá
        </button>
      </TrCard>

      {/* DCA Banner — Desktop right panel */}
      {dcaBanner && (
        <TrCard className="p-4">
          {dcaBanner}
        </TrCard>
      )}

      {/* Favorite + Share */}
      <TrCard className="p-4 flex gap-3">
        <button onClick={() => setIsFavorite(!isFavorite)}
          className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ background: c.hoverBg, color: isFavorite ? '#F59E0B' : c.text2 }}>
          <Star size={14} fill={isFavorite ? '#F59E0B' : 'none'} />
          {isFavorite ? 'Đã thích' : 'Yêu thích'}
        </button>
        <button className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ background: c.hoverBg, color: c.text2 }}>
          <Share2 size={14} /> Chia sẻ
        </button>
      </TrCard>
    </div>
  );

  /* ─── Main content (chart/orderbook/trades) ─── */
  const mainContent = (
    <PageLayout style={{ flex: 1 }}>
      {/* Header + Breadcrumb */}
      <Header variant="custom" breadcrumb>
        <div className="flex items-center justify-between px-5"
          style={{
            height: 52,
            borderBottom: `1px solid ${c.divider}`,
            background: c.navBg,
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          }}>
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: c.hoverBg }}>
            <ChevronLeft size={20} color={c.text1} strokeWidth={2.2} />
          </button>
          <button className="flex items-center gap-2" onClick={() => navigate(`${routePrefix}/markets`)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: pair.logoColor + '22' }}>
              <span style={{ color: pair.logoColor, fontSize: 9, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
            </div>
            <span style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>{pair.symbol}</span>
            <ChevronDown size={16} color={c.text2} />
          </button>
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <div className="contents">
                <button onClick={() => setIsFavorite(!isFavorite)}>
                  <Star size={20} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : c.text3} />
                </button>
                <button><Share2 size={18} color={c.text3} /></button>
              </div>
            )}
          </div>
        </div>
      </Header>

      {/* Price Overview (mobile/tablet only) */}
      {!isDesktop && (
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-end gap-3 mb-1">
            <span style={{
              color: priceFlash === 'up' ? '#10B981' : priceFlash === 'down' ? '#EF4444' : c.text1,
              fontSize: 30, fontWeight: 700, fontFamily: 'monospace', transition: 'color 0.3s',
            }}>
              {fmtP(price)}
            </span>
            <span className="rounded-lg px-2 py-1 text-sm font-semibold"
              style={{
                background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: isPositive ? '#10B981' : '#EF4444',
              }}>
              {isPositive ? '▲' : '▼'} {fmtAbsPct(pair.change24h)}
            </span>
          </div>
          <div className="flex gap-4 text-xs">
            {[
              { label: '24h Cao', value: fmtP(pair.high24h), color: '#10B981' },
              { label: '24h Thấp', value: fmtP(pair.low24h), color: '#EF4444' },
              { label: 'KL 24h', value: fmtCompact(pair.volume24h), color: c.text2 },
            ].map(stat => (
              <div key={stat.label}>
                <span style={{ color: c.text3 }}>{stat.label}</span><br />
                <span style={{ color: stat.color, fontFamily: 'monospace', fontWeight: 600 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View tabs */}
      <div className="flex px-5 py-2 gap-2">
        {(['chart', 'orderbook', 'trades'] as const).map(v => (
          <button key={v} onClick={() => setActiveView(v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: activeView === v ? c.chipActiveBg : c.chipBg,
              color: activeView === v ? c.chipActiveText : c.chipText,
              border: `1px solid ${activeView === v ? c.chipActiveBorder : c.chipBorder}`,
            }}>
            {v === 'chart' ? '📈 Biểu đồ' : v === 'orderbook' ? '📊 Sổ lệnh' : '🔄 Giao dịch'}
          </button>
        ))}
      </div>

      {activeView === 'chart' && (
        <div className="contents">
          <div className="flex px-5 gap-1 mb-1">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{
                  background: timeframe === tf ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: timeframe === tf ? '#3B82F6' : c.text3,
                }}>
                {tf}
              </button>
            ))}
          </div>
          <div className="flex px-5 gap-1.5 mb-2 overflow-x-auto scrollbar-none">
            {INDICATOR_CHIPS.map(ind => (
              <button key={ind}
                onClick={() => setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold"
                style={{
                  background: activeIndicators.includes(ind) ? 'rgba(59,130,246,0.2)' : c.surface2,
                  color: activeIndicators.includes(ind) ? '#3B82F6' : c.text3,
                  border: `1px solid ${activeIndicators.includes(ind) ? 'rgba(59,130,246,0.4)' : c.borderSolid}`,
                }}>
                {ind}
              </button>
            ))}
          </div>
          <div className="px-2" style={{ height: isDesktop ? 340 : 220 }}>
            <PriceAreaChart basePrice={pair.price} isPositive={isPositive} timeframe={timeframe} />
          </div>
        </div>
      )}

      {activeView === 'orderbook' && (
        <div className="px-0">
          <OrderBook price={price} change24h={pair.change24h} />
        </div>
      )}

      {activeView === 'trades' && (
        <div>
          <div className="flex px-3 py-1.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text3, fontSize: 11, flex: 1 }}>Giá</span>
            <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right' }}>Khối lượng</span>
            <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right' }}>Thời gian</span>
          </div>
          {recentTrades.slice(0, 20).map(trade => (
            <div key={trade.id} className="flex items-center px-3 py-1.5"
              style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: trade.side === 'buy' ? '#10B981' : '#EF4444', fontSize: 13, flex: 1, fontFamily: 'monospace' }}>
                {fmtP(trade.price)}
              </span>
              <span style={{ color: c.text2, fontSize: 13, flex: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                {trade.amount.toFixed(4)}
              </span>
              <span style={{ color: c.text3, fontSize: 12, flex: 1, textAlign: 'right' }}>{trade.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* A/B Test: DCA Banner BEFORE Risk Warning (Variant B) — Mobile only */}
      {!isDesktop && pairDetailBannerTest.showBeforeRisk && dcaBanner && (
        <div className="mx-5 mb-3">
          {dcaBanner}
        </div>
      )}

      {/* Risk warning */}
      <div className="mx-5 my-3 flex items-start gap-2 rounded-xl px-3 py-2"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
        <p style={{ color: '#F59E0B', fontSize: 11, lineHeight: 1.5 }}>
          Giao dịch crypto có rủi ro cao. Chỉ đầu tư số tiền bạn có thể chịu mất.
        </p>
      </div>

      {/* A/B Test: DCA Banner AFTER Risk Warning (Control A) — Mobile only */}
      {!isDesktop && !pairDetailBannerTest.showBeforeRisk && dcaBanner && (
        <div className="mx-5 mb-3">
          {dcaBanner}
        </div>
      )}

      {/* Mobile CTA */}
      {!isDesktop && (
        <div className="px-5 pb-4 flex gap-3">
          <button onClick={() => navigate(`${routePrefix}/trade/${pairId}?side=buy`)}
            className="flex-1 rounded-2xl flex items-center justify-center font-semibold text-white text-base"
            style={{ height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            MUA
          </button>
          <button onClick={() => navigate(`${routePrefix}/trade/${pairId}?side=sell`)}
            className="flex-1 rounded-2xl flex items-center justify-center font-semibold text-white text-base"
            style={{ height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)' }}>
            BAN
          </button>
        </div>
      )}
    </PageLayout>
  );

  if (isDesktop) {
    return (
      <div className="flex gap-6 py-4">
        <div className="flex-1 min-w-0">{mainContent}</div>
        {rightPanel}
      </div>
    );
  }

  return mainContent;
}