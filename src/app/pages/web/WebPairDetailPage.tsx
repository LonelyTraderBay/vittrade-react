import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Star, Share2, Bell, ChevronDown, TrendingUp, TrendingDown,
  Repeat, BarChart3, ArrowLeftRight, ExternalLink, Copy,
  CheckCircle, Globe, Clock, Activity, Layers, Shield,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { WEB_FONT, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { PriceAreaChart } from '../../components/trading/PriceAreaChart';
import { OrderBook } from '../../components/trading/OrderBook';
import { CRYPTO_PAIRS, generateRecentTrades } from '../../data/mockData';
import { fmtPrice, fmtCompact, fmtPct, fmtAbsPct } from '../../data/formatNumber';
import type { RecentTrade } from '../../data/mockData';

/**
 * ══════════════════════════════════════════════════════════
 *  WebPairDetailPage — Desktop Token Detail View
 * ══════════════════════════════════════════════════════════
 *
 *  ┌─────────────────────────────────────┬───────────────────┐
 *  │  Token Header + Price               │  Quick Actions    │
 *  ├─────────────────────────────────────┤  Buy / Sell       │
 *  │  Chart (flexible height)            │  Alert            │
 *  │  Timeframes | Indicators            │  DCA / Futures    │
 *  ├──────────────────┬──────────────────┤                   │
 *  │  Orderbook       │  Recent Trades   │  Key Stats        │
 *  ├──────────────────┴──────────────────┤                   │
 *  │  Market Info / Token Details        │  Related Pairs    │
 *  └─────────────────────────────────────┴───────────────────┘
 */

const TIMEFRAMES = ['15m', '1H', '4H', '1D', '1W', '1M'];

/* ─── Token Market Info ─── */
function MarketInfoPanel({ pair }: { pair: typeof CRYPTO_PAIRS[0] }) {
  const c = useThemeColors();

  const stats = [
    { label: 'Market Cap', value: fmtCompact(pair.marketCap, { prefix: '$' }) },
    { label: 'Volume 24h', value: fmtCompact(pair.volume24h, { prefix: '$' }) },
    { label: 'Vốn hóa FDV', value: fmtCompact(pair.marketCap * 1.15, { prefix: '$' }) },
    { label: 'Circulating Supply', value: `${fmtCompact(pair.marketCap / pair.price)} ${pair.baseAsset}` },
    { label: 'Highest 24h', value: `$${fmtPrice(pair.high24h)}` },
    { label: 'Lowest 24h', value: `$${fmtPrice(pair.low24h)}` },
    { label: 'ATH', value: pair.baseAsset === 'BTC' ? '$73,750.07' : pair.baseAsset === 'ETH' ? '$4,891.70' : `$${fmtPrice(pair.price * 1.8)}` },
    { label: 'From ATH', value: pair.baseAsset === 'BTC' ? '-8.4%' : pair.baseAsset === 'ETH' ? '-28.0%' : '-44.4%' },
  ];

  return (
    <div className="rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Thông tin thị trường</span>
      </div>
      <div className="grid grid-cols-2 gap-0">
        {stats.map((s, i) => (
          <div key={s.label} className="flex items-center justify-between px-5 py-2.5"
            style={{ borderBottom: i < stats.length - 2 ? `1px solid ${c.divider}` : 'none', borderRight: i % 2 === 0 ? `1px solid ${c.divider}` : 'none' }}>
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</span>
            <span style={{ color: s.color, fontSize: WEB_FONT.md, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── About Token ─── */
function AboutToken({ pair }: { pair: typeof CRYPTO_PAIRS[0] }) {
  const c = useThemeColors();
  const descriptions: Record<string, string> = {
    BTC: 'Bitcoin là đồng tiền điện tử đầu tiên và lớn nhất thế giới theo vốn hóa thị trường, ra đời năm 2009 bởi Satoshi Nakamoto. Bitcoin hoạt động như một hệ thống thanh toán ngang hàng phi tập trung, sử dụng cơ chế Proof-of-Work.',
    ETH: 'Ethereum là nền tảng blockchain hàng đầu cho smart contracts và ứng dụng phi tập trung (dApps). Được tạo bởi Vitalik Buterin năm 2015, Ethereum đã chuyển sang cơ chế Proof-of-Stake sau The Merge năm 2022.',
    SOL: 'Solana là blockchain Layer 1 hiệu suất cao, hỗ trợ hàng nghìn giao dịch mỗi giây với phí cực thấp. Solana sử dụng cơ chế Proof-of-History kết hợp Proof-of-Stake.',
    BNB: 'BNB (Binance Coin) là token tiện ích của hệ sinh thái Binance, sử dụng trên BNB Chain và sàn giao dịch Binance. BNB được dùng để thanh toán phí giao dịch, tham gia Launchpad.',
  };

  const links = [
    { label: 'Website', icon: Globe },
    { label: 'Explorer', icon: ExternalLink },
    { label: 'Whitepaper', icon: Layers },
    { label: 'GitHub', icon: Activity },
  ];

  return (
    <div className="rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
        <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Về {pair.baseAsset}</span>
      </div>
      <div className="px-5 py-4">
        <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.7 }}>
          {descriptions[pair.baseAsset] || `${pair.baseAsset} là một tài sản kỹ thuật số trên thị trường cryptocurrency. Xem thông tin chi tiết trên trang token info.`}
        </p>
        <div className="flex items-center gap-3 mt-4">
          {links.map(l => {
            const Icon = l.icon;
            return (
              <button key={l.label}
                className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.xs, color: c.text2, fontWeight: 500 }}>
                <Icon size={12} /> {l.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — WebPairDetailPage
   ═══════════════════════════════════════════════════════════ */
export function WebPairDetailPage() {
  const { pairId } = useParams();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();

  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const isPositive = pair.change24h >= 0;

  const [timeframe, setTimeframe] = useState('1H');
  const [isFavorite, setIsFavorite] = useState(pair.isFavorite);
  const [livePrice, setLivePrice] = useState(pair.price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>(() => generateRecentTrades(pair.price));

  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice(prev => {
        const delta = (Math.random() - 0.495) * prev * 0.001;
        const next = parseFloat((prev + delta).toFixed(2));
        setPriceFlash(next > prev ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 500);
        return next;
      });
      setRecentTrades(generateRecentTrades(pair.price));
    }, 2500);
    return () => clearInterval(id);
  }, [pair.price]);

  // Related pairs (same category)
  const relatedPairs = CRYPTO_PAIRS.filter(p => p.category === pair.category && p.id !== pair.id).slice(0, 4);

  return (
    <PageLayout>
      <Header variant="page" title={`${pair.baseAsset}/${pair.quoteAsset}`} back />
      <div className="flex gap-6 py-6 px-6" style={{ maxWidth: 1200 }}>
        {/* ─── Left: Main Content ─── */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {/* Token Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: pair.logoColor + '18', border: `1px solid ${pair.logoColor}30` }}>
                <span style={{ color: pair.logoColor, fontSize: 14, fontWeight: 700 }}>{pair.baseAsset.slice(0, 3)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>{pair.baseAsset}</span>
                  <span style={{ color: c.text3, fontSize: WEB_FONT.md }}>/{pair.quoteAsset}</span>
                  <span className="px-2 py-0.5 rounded text-xs"
                    style={{ background: c.hoverBg, color: c.text3 }}>{pair.category}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{
                    color: priceFlash === 'up' ? '#10B981' : priceFlash === 'down' ? '#EF4444' : c.text1,
                    fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.3s',
                  }}>${fmtPrice(livePrice)}</span>
                  <span className="rounded-lg px-2 py-1"
                    style={{
                      background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: isPositive ? '#10B981' : '#EF4444',
                      fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    }}>
                    {isPositive ? '▲' : '▼'} {fmtAbsPct(pair.change24h)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsFavorite(!isFavorite)}
                className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: `1px solid ${c.border}` }}>
                <Star size={14} fill={isFavorite ? '#F59E0B' : 'none'} color={isFavorite ? '#F59E0B' : c.text3} />
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>{isFavorite ? 'Đã thích' : 'Yêu thích'}</span>
              </button>
              <button className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: `1px solid ${c.border}` }}>
                <Share2 size={14} color={c.text3} />
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Chia sẻ</span>
              </button>
            </div>
          </div>

          {/* 24h Stats Bar */}
          <div className="flex items-center gap-6 rounded-xl px-5 py-3"
            style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            {[
              { label: '24h Cao', value: `$${fmtPrice(pair.high24h)}`, color: '#10B981' },
              { label: '24h Thấp', value: `$${fmtPrice(pair.low24h)}`, color: '#EF4444' },
              { label: 'Volume 24h', value: fmtCompact(pair.volume24h, { prefix: '$' }), color: c.text1 },
              { label: 'Market Cap', value: fmtCompact(pair.marketCap, { prefix: '$' }), color: c.text1 },
            ].map(s => (
              <div key={s.label} className="flex flex-col">
                <span style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>{s.label}</span>
                <span style={{ color: s.color, fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <div className="flex gap-1.5">
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    className="px-2.5 py-1 rounded-md"
                    style={{
                      background: timeframe === tf ? c.chipActiveBg : 'transparent',
                      color: timeframe === tf ? c.chipActiveText : c.text3,
                      fontSize: WEB_FONT.xs, fontWeight: timeframe === tf ? 700 : 500,
                    }}>{tf}</button>
                ))}
              </div>
              <button onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600 }}>Mở giao dịch →</button>
            </div>
            <div style={{ height: 360 }}>
              <PriceAreaChart basePrice={pair.price} isPositive={isPositive} timeframe={timeframe} />
            </div>
          </div>

          {/* Orderbook + Trades side by side */}
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Orderbook */}
            <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Sổ lệnh</span>
              </div>
              <OrderBook price={livePrice} change24h={pair.change24h} />
            </div>

            {/* Recent Trades */}
            <div className="rounded-xl overflow-hidden" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Giao dịch gần đây</span>
              </div>
              {/* Header */}
              <div className="grid items-center px-4 py-1.5"
                style={{ gridTemplateColumns: '1fr 1fr 80px', borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>Giá (USDT)</span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>Khối lượng</span>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, textAlign: 'right' }}>Thời gian</span>
              </div>
              <div className="overflow-y-auto scrollbar-none" style={{ maxHeight: 300 }}>
                {recentTrades.slice(0, 20).map((t, i) => (
                  <div key={`${t.id}-${i}`} className="grid items-center px-4 py-1.5"
                    style={{ gridTemplateColumns: '1fr 1fr 80px' }}>
                    <span style={{
                      color: t.side === 'buy' ? '#10B981' : '#EF4444',
                      fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums',
                    }}>{fmtPrice(t.price)}</span>
                    <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                      {t.amount.toFixed(4)}
                    </span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs, textAlign: 'right' }}>{t.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Info + About */}
          <MarketInfoPanel pair={pair} />
          <AboutToken pair={pair} />
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="flex flex-col gap-4" style={{ width: 320, flexShrink: 0 }}>
          {/* Trade actions */}
          <div className="rounded-xl p-5" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 12 }}>Giao dịch {pair.baseAsset}</p>
            <div className="flex gap-3 mb-3">
              <button onClick={() => navigate(`${prefix}/trade/${pairId}?side=buy`)}
                className="flex-1 h-11 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                MUA
              </button>
              <button onClick={() => navigate(`${prefix}/trade/${pairId}?side=sell`)}
                className="flex-1 h-11 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)', fontSize: WEB_FONT.md, fontWeight: 700 }}>
                BÁN
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => navigate(`${prefix}/markets/alerts`)}
                className="web-cmd-btn w-full h-9 rounded-lg flex items-center justify-center gap-2 transition-colors"
                style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.sm, fontWeight: 600, color: c.text2 }}>
                <Bell size={13} color="#F59E0B" /> Đặt cảnh báo giá
              </button>
              <div className="flex gap-2">
                <button onClick={() => navigate(`${prefix}/trade/convert`)}
                  className="web-cmd-btn flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.xs, fontWeight: 600, color: c.text2 }}>
                  <ArrowLeftRight size={12} color="#10B981" /> Convert
                </button>
                <button onClick={() => { sessionStorage.setItem('dca_preselect', pair.baseAsset); navigate(`${prefix}/dca`); }}
                  className="web-cmd-btn flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  style={{ border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)', fontSize: WEB_FONT.xs, fontWeight: 600, color: '#8B5CF6' }}>
                  <Repeat size={12} /> DCA
                </button>
              </div>
              <button onClick={() => navigate(`${prefix}/trade/${pair.id}/futures`)}
                className="web-cmd-btn w-full h-9 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                style={{ border: `1px solid ${c.border}`, fontSize: WEB_FONT.xs, fontWeight: 600, color: c.text2 }}>
                <BarChart3 size={12} color="#EF4444" /> Giao dịch Futures
              </button>
            </div>
          </div>

          {/* Key Stats */}
          <div className="rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Chỉ số chính</span>
            </div>
            {[
              { label: 'Giá hiện tại', value: `$${fmtPrice(livePrice)}` },
              { label: 'Thay đổi 24h', value: fmtPct(pair.change24h), color: isPositive ? '#10B981' : '#EF4444' },
              { label: '24h Cao', value: `$${fmtPrice(pair.high24h)}` },
              { label: '24h Thấp', value: `$${fmtPrice(pair.low24h)}` },
              { label: 'Volume 24h', value: fmtCompact(pair.volume24h, { prefix: '$' }) },
              { label: 'Market Cap', value: fmtCompact(pair.marketCap, { prefix: '$' }) },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center justify-between px-4 py-2"
                style={{ borderBottom: i < 5 ? `1px solid ${c.divider}` : 'none' }}>
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</span>
                <span style={{
                  color: s.color || c.text1,
                  fontSize: WEB_FONT.sm, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                }}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Related Pairs */}
          {relatedPairs.length > 0 && (
            <div className="rounded-xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="px-4 py-3" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>Cùng danh mục — {pair.category}</span>
              </div>
              {relatedPairs.map((p, i) => {
                const pos = p.change24h >= 0;
                return (
                  <button key={p.id} onClick={() => navigate(`${prefix}/pair/${p.id}`)}
                    className="web-cmd-btn flex items-center gap-3 px-4 py-2.5 w-full transition-colors"
                    style={{ borderBottom: i < relatedPairs.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: p.logoColor + '15' }}>
                      <span style={{ color: p.logoColor, fontSize: 10, fontWeight: 700 }}>{p.baseAsset.slice(0, 3)}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>{p.baseAsset}</span>
                      <span style={{ color: c.text3, fontSize: 10, marginLeft: 3 }}>/{p.quoteAsset}</span>
                    </div>
                    <div className="text-right">
                      <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontVariantNumeric: 'tabular-nums' }}>${fmtPrice(p.price)}</p>
                      <p style={{
                        color: pos ? '#10B981' : '#EF4444',
                        fontSize: WEB_FONT.xs, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      }}>{fmtPct(p.change24h)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Token info link */}
          <button onClick={() => navigate(`${prefix}/pair/${pair.id}/info`)}
            className="web-cmd-btn flex items-center justify-center gap-2 rounded-xl py-3 transition-colors"
            style={{ background: c.surface, border: `1px solid ${c.border}`, color: '#3B82F6', fontSize: WEB_FONT.base, fontWeight: 600 }}>
            <Layers size={14} /> Xem Token Info đầy đủ
          </button>
        </div>
      </div>
    </PageLayout>
  );
}