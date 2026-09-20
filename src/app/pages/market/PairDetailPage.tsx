import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Star, Share2, AlertTriangle, ChevronDown, ChevronLeft, Repeat, ChevronRight, Layers } from 'lucide-react';
import { CRYPTO_PAIRS, generateRecentTrades, RecentTrade } from '../../data/mockData';
import { PriceAreaChart } from '../../components/trading/PriceAreaChart';
import { OrderBook } from '../../components/trading/OrderBook';
import { useHaptic } from '../../hooks/useHaptic';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useGoBack } from '../../hooks/useGoBack';
import { Header } from '../../components/layout/Header';
import { fmtPrice, fmtPct, fmtCompact, fmtAbsPct } from '../../data/formatNumber';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';
import { useDCAAssetDetailButton } from '../../hooks/useFeatureFlag';
import { useDCAAnalytics } from '../../hooks/useDCAAnalytics';
import { usePairDetailBannerTest } from '../../hooks/useABTest';
import { usePairDetailToCreationFunnel } from '../../hooks/useFunnelTracking';
import { PageLayout } from '../../components/layout/PageLayout';
import { Info } from 'lucide-react';

const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W', '1M'];
const INDICATOR_CHIPS = ['MA', 'EMA', 'BOLL', 'MACD', 'RSI', 'Vol'];

export function PairDetailPage() {
  const { pairId } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const { hapticSelection, hapticLight } = useHaptic();

  const [timeframe, setTimeframe] = useState('1H');
  const [activeView, setActiveView] = useState<'chart' | 'orderbook' | 'trades'>('chart');
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['MA', 'Vol']);
  const [isFavorite, setIsFavorite] = useState(pair.isFavorite);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(() => generateRecentTrades(pair.price));
  const [price, setPrice] = useState(pair.price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);

  // Simulate chart loading
  useEffect(() => {
    setIsChartLoading(true);
    const timer = setTimeout(() => setIsChartLoading(false), 500);
    return () => clearTimeout(timer);
  }, [timeframe, activeView]);

  // Simulate live price updates
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
  const fmt = (v: number) => fmtPrice(v);

  const c = useThemeColors();
  const routePrefix = useRoutePrefix();
  const actionToast = useActionToast();
  const dcaAssetDetailButton = useDCAAssetDetailButton();
  const dcaAnalytics = useDCAAnalytics();
  const { showBeforeRisk, onBannerClick, variant: bannerVariant } = usePairDetailBannerTest();
  const { trackButtonImpression, trackButtonClick } = usePairDetailToCreationFunnel();

  // Track banner impression on mount (once)
  useEffect(() => {
    if (dcaAssetDetailButton) {
      trackButtonImpression();
      dcaAnalytics.trackPairDetailBanner('impression', pair.baseAsset);
    }
  }, [dcaAssetDetailButton, pair.baseAsset]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDCABannerClick = useCallback(() => {
    // Track in all systems
    dcaAnalytics.trackEvent('dca_pair_detail_click', {
      coin: pair.baseAsset,
      source: 'pair_detail',
      placement: bannerVariant,
    });
    dcaAnalytics.trackPairDetailBanner('click', pair.baseAsset);
    trackButtonClick();
    onBannerClick();
    hapticLight();
    sessionStorage.setItem('dca_preselect', pair.baseAsset);
    navigate(`${routePrefix}/dca`);
  }, [pair.baseAsset, bannerVariant, dcaAnalytics, trackButtonClick, onBannerClick, hapticLight, navigate, routePrefix]);

  /* ─── Shared DCA Banner Element ─── */
  const dcaBannerElement = dcaAssetDetailButton ? (
    <button
      onClick={handleDCABannerClick}
      className="mx-5 mb-3 flex items-center gap-3 rounded-2xl px-4 py-4"
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
        <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.4 }}>
          Tự động mua theo lịch · Giảm rủi ro biến động
        </p>
      </div>
      <ChevronRight size={16} color="#8B5CF6" />
    </button>
  ) : null;

  return (
    <PageLayout>
      {/* Header + Breadcrumb */}
      <Header variant="custom" breadcrumb>
        <div className="flex items-center justify-between px-5"
          style={{ height: 52, borderBottom: `1px solid ${c.divider}`, background: c.navBg, backdropFilter: 'saturate(180%) blur(24px)', WebkitBackdropFilter: 'saturate(180%) blur(24px)' }}>
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl hover-ghost"
            style={{ background: c.hoverBg }}>
            <ChevronLeft size={20} color={c.text1} strokeWidth={2.2} />
          </button>

          <button className="flex items-center gap-2 hover-ghost" onClick={() => navigate(`${routePrefix}/markets`)}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: pair.logoColor + '22' }}>
              <span style={{ color: pair.logoColor, fontSize: 10, fontWeight: 700 }}>{pair.baseAsset.slice(0,3)}</span>
            </div>
            <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</span>
            <ChevronDown size={14} color={c.text2} />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => { setIsFavorite(!isFavorite); actionToast.info(isFavorite ? TOAST.FAVORITE.removed(pair.baseAsset) : TOAST.FAVORITE.added(pair.baseAsset)); }} aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}>
              <Star size={21} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : c.text3} />
            </button>
            <button aria-label="Chia sẻ" className="hover-ghost">
              <Share2 size={21} color={c.text3} />
            </button>
          </div>
        </div>
      </Header>

      {/* Price Overview */}
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <div className="flex items-end gap-3 mb-1">
          <span
            style={{
              color: priceFlash === 'up' ? '#10B981' : priceFlash === 'down' ? '#EF4444' : c.text1,
              fontSize: 34, fontWeight: 700, fontFamily: 'monospace',
              transition: 'color 0.3s',
            }}
          >
            {fmt(price)}
          </span>
          <span
            className="rounded-lg px-2 py-1 text-sm font-semibold"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: isPositive ? '#10B981' : '#EF4444',
            }}
          >
            {isPositive ? '▲' : '▼'} {fmtAbsPct(pair.change24h)}
          </span>
        </div>

        <div className="flex gap-4 text-xs">
          {[
            { label: '24h Cao', value: fmt(pair.high24h), color: '#10B981' },
            { label: '24h Thấp', value: fmt(pair.low24h), color: '#EF4444' },
            { label: 'KL 24h', value: `${fmtCompact(pair.volume24h)}B`, color: c.text2 },
          ].map(stat => (
            <div key={stat.label}>
              <span style={{ color: c.text3, fontSize: 10 }}>{stat.label}</span>
              <br />
              <span style={{ color: stat.color, fontFamily: 'monospace', fontWeight: 600 }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex px-5 py-2 gap-2">
        {(['chart', 'orderbook', 'trades'] as const).map(v => (
          <button key={v} onClick={() => { setActiveView(v); hapticSelection(); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover-chip"
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
          {/* Timeframe */}
          <div className="flex px-5 gap-1 mb-1">
            {TIMEFRAMES.map(tf => (
              <button key={tf} onClick={() => { setTimeframe(tf); hapticSelection(); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold min-h-9"
                style={{
                  background: timeframe === tf ? 'rgba(59,130,246,0.2)' : 'transparent',
                  color: timeframe === tf ? '#3B82F6' : c.text3,
                }}>
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator chips */}
          <div className="flex px-5 gap-2 mb-2 overflow-x-auto scrollbar-none">
            {INDICATOR_CHIPS.map(ind => (
              <button key={ind}
                onClick={() => setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind])}
                className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold min-h-9"
                style={{
                  background: activeIndicators.includes(ind) ? 'rgba(59,130,246,0.2)' : c.surface2,
                  color: activeIndicators.includes(ind) ? '#3B82F6' : c.text3,
                  border: `1px solid ${activeIndicators.includes(ind) ? 'rgba(59,130,246,0.4)' : c.borderSolid}`,
                }}>
                {ind}
              </button>
            ))}
            <button
              onClick={() => navigate(`${routePrefix}/trade/advanced-chart/${pair.id}`)}
              className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold min-h-9"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
              ⚡ Nâng cao
            </button>
          </div>

          {/* Chart */}
          <div className="px-2" style={{ height: 220 }}>
            {isChartLoading ? (
              <div className="w-full h-full rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.borderSolid} 37%, ${c.surface2} 63%)`,
                  backgroundSize: '800px 100%',
                  animation: 'stateShimmer 1.8s ease-in-out infinite',
                }}
              />
            ) : (
              <PriceAreaChart basePrice={pair.price} isPositive={isPositive} timeframe={timeframe} />
            )}
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
          <div className="flex px-3 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text3, fontSize: 10, flex: 1 }}>Giá</span>
            <span style={{ color: c.text3, fontSize: 10, flex: 1, textAlign: 'right' }}>Khối lượng</span>
            <span style={{ color: c.text3, fontSize: 10, flex: 1, textAlign: 'right' }}>Thời gian</span>
          </div>
          {recentTrades.slice(0, 20).map(trade => (
            <div key={trade.id} className="flex items-center px-3 py-2"
              style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: trade.side === 'buy' ? '#10B981' : '#EF4444', fontSize: 13, flex: 1, fontFamily: 'monospace' }}>
                {fmt(trade.price)}
              </span>
              <span style={{ color: c.text2, fontSize: 13, flex: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                {trade.amount.toFixed(4)}
              </span>
              <span style={{ color: c.text3, fontSize: 10, flex: 1, textAlign: 'right' }}>{trade.time}</span>
            </div>
          ))}
        </div>
      )}

      {/* A/B Test: DCA Banner BEFORE Risk Warning (Variant B) */}
      {showBeforeRisk && dcaBannerElement}

      {/* Risk warning */}
      <div className="mx-5 my-3 flex items-start gap-2 rounded-xl px-3 py-2"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-1" />
        <p style={{ color: '#F59E0B', fontSize: 10, lineHeight: 1.5 }}>
          Giao dịch crypto có rủi ro cao. Chỉ đầu tư số tiền bạn có thể chịu mất.
        </p>
      </div>

      {/* A/B Test: DCA Banner AFTER Risk Warning (Control A) */}
      {!showBeforeRisk && dcaBannerElement}

      {/* Token Info */}
      <button
        onClick={() => { navigate(`${routePrefix}/pair/${pairId}/info`); hapticLight(); }}
        className="mx-5 mb-3 flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.04) 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Info size={16} color="#3B82F6" />
        </div>
        <div className="flex-1 text-left">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
            Thông tin {pair.baseAsset}
          </p>
          <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.4 }}>
            Tokenomics · On-chain · Dự án
          </p>
        </div>
        <ChevronRight size={16} color="#3B82F6" />
      </button>

      {/* Market Depth */}
      <button
        onClick={() => { navigate(`${routePrefix}/pair/${pairId}/depth`); hapticLight(); }}
        className="mx-5 mb-3 flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(59,130,246,0.04) 100%)',
          border: '1px solid rgba(6,182,212,0.15)',
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(6,182,212,0.12)' }}>
          <Layers size={16} color="#06B6D4" />
        </div>
        <div className="flex-1 text-left">
          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
            Độ sâu thị trường
          </p>
          <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.4 }}>
            Depth chart · Whale alerts · Sổ lệnh
          </p>
        </div>
        <ChevronRight size={16} color="#06B6D4" />
      </button>

      {/* CTA */}
      <div className="px-5 pb-4 flex gap-3">
        <button
          onClick={() => { navigate(`${routePrefix}/trade/${pairId}?side=buy`); hapticSelection(); }}
          className="flex-1 rounded-2xl flex items-center justify-center font-semibold text-white text-base ripple btn-buy"
          style={{ height: 55, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
          MUA
        </button>
        <button
          onClick={() => { navigate(`${routePrefix}/trade/${pairId}?side=sell`); hapticSelection(); }}
          className="flex-1 rounded-2xl flex items-center justify-center font-semibold text-white text-base ripple btn-sell"
          style={{ height: 55, background: 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
          BÁN
        </button>
      </div>
    </PageLayout>
  );
}