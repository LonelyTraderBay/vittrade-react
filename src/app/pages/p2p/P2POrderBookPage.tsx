import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtVnd, fmtAmount, fmtCompact } from '../../data/formatNumber';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   P2P Order Book - Depth Chart & Market Ticker
   ═══════════════════════════════════════════════════════════ */

type Asset = 'USDT' | 'BTC' | 'ETH' | 'BNB' | 'SOL';

interface OrderBookEntry {
  price: number;
  volume: number;
  total: number;
  orders: number;
}

interface MarketStats {
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  trades24h: number;
}

// Mock order book data generator
function generateOrderBook(basePrice: number, spread: number): { bids: OrderBookEntry[], asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let totalBid = 0;
  let totalAsk = 0;
  
  // Generate 15 bid levels (buy orders)
  for (let i = 0; i < 15; i++) {
    const price = basePrice - spread - (i * spread * 0.3);
    const volume = Math.random() * 500 + 50;
    totalBid += volume;
    bids.push({ 
      price, 
      volume, 
      total: totalBid,
      orders: Math.floor(Math.random() * 8) + 1,
    });
  }
  
  // Generate 15 ask levels (sell orders)
  for (let i = 0; i < 15; i++) {
    const price = basePrice + spread + (i * spread * 0.3);
    const volume = Math.random() * 500 + 50;
    totalAsk += volume;
    asks.push({ 
      price, 
      volume, 
      total: totalAsk,
      orders: Math.floor(Math.random() * 8) + 1,
    });
  }
  
  return { bids, asks };
}

const MARKET_PRICES: Record<Asset, number> = {
  USDT: 25_300,
  BTC: 1_715_000_000,
  ETH: 89_000_000,
  BNB: 15_200_000,
  SOL: 4_800_000,
};

const MARKET_STATS: Record<Asset, MarketStats> = {
  USDT: { lastPrice: 25_300, change24h: 0.8, high24h: 25_450, low24h: 25_180, volume24h: 2_450_000_000, trades24h: 1_243 },
  BTC: { lastPrice: 1_715_000_000, change24h: -2.3, high24h: 1_755_000_000, low24h: 1_698_000_000, volume24h: 85_000_000_000, trades24h: 892 },
  ETH: { lastPrice: 89_000_000, change24h: 3.5, high24h: 91_200_000, low24h: 86_500_000, volume24h: 12_500_000_000, trades24h: 654 },
  BNB: { lastPrice: 15_200_000, change24h: 1.2, high24h: 15_450_000, low24h: 15_050_000, volume24h: 4_200_000_000, trades24h: 421 },
  SOL: { lastPrice: 4_800_000, change24h: -1.5, high24h: 4_920_000, low24h: 4_750_000, volume24h: 1_850_000_000, trades24h: 387 },
};

export function P2POrderBookPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  
  const [selectedAsset, setSelectedAsset] = useState<Asset>('USDT');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const stats = MARKET_STATS[selectedAsset];
  const basePrice = MARKET_PRICES[selectedAsset];
  const spread = basePrice * 0.003; // 0.3% spread
  
  const { bids, asks } = useMemo(() => 
    generateOrderBook(basePrice, spread), 
    [selectedAsset]
  );
  
  const bestBid = bids[0];
  const bestAsk = asks[0];
  const spreadValue = bestAsk.price - bestBid.price;
  const spreadPercent = (spreadValue / bestBid.price) * 100;
  
  // Depth chart data
  const depthChartData = useMemo(() => {
    const bidData = bids.slice(0, 10).reverse().map(b => ({
      price: b.price,
      bidTotal: b.total,
      askTotal: 0,
      type: 'bid',
    }));
    const askData = asks.slice(0, 10).map(a => ({
      price: a.price,
      bidTotal: 0,
      askTotal: a.total,
      type: 'ask',
    }));
    return [...bidData, ...askData];
  }, [bids, asks]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 800));
    setIsRefreshing(false);
    toast.success('Đã cập nhật sổ lệnh');
  };
  
  const maxTotal = Math.max(...bids.map(b => b.total), ...asks.map(a => a.total));
  
  return (
    <PageLayout>
      <Header title="Sổ lệnh P2P" subtitle="Giao dịch · P2P" back />
      
      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {/* Asset Selector */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(['USDT', 'BTC', 'ETH', 'BNB', 'SOL'] as Asset[]).map(asset => {
            const assetStats = MARKET_STATS[asset];
            const isPositive = assetStats.change24h > 0;
            const selected = asset === selectedAsset;
            
            return (
              <button
                key={asset}
                onClick={() => { setSelectedAsset(asset); hapticSelection(); }}
                className="shrink-0 px-4 py-3 rounded-2xl flex flex-col items-start gap-1 min-w-[110px]"
                style={{
                  background: selected ? c.hoverBg : c.surface2,
                  border: `1.5px solid ${selected ? c.accent : c.borderSolid}`,
                }}
              >
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{asset}/VND</p>
                <p style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
                  {isPositive ? '+' : ''}{assetStats.change24h.toFixed(2)}%
                </p>
              </button>
            );
          })}
        </div>
        
        {/* Market Ticker */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{selectedAsset}/VND</p>
              <div className="px-2 py-0.5 rounded-full" style={{ background: stats.change24h > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                <div className="flex items-center gap-1">
                  {stats.change24h > 0 ? <ArrowUpRight size={10} color="#10B981" /> : <ArrowDownRight size={10} color="#EF4444" />}
                  <span style={{ color: stats.change24h > 0 ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: 700 }}>
                    {stats.change24h > 0 ? '+' : ''}{stats.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: c.surface2 }}
            >
              <RefreshCw size={14} color={c.text2} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Giá hiện tại', value: fmtVnd(stats.lastPrice), color: c.text1 },
              { label: '24h High', value: fmtVnd(stats.high24h), color: '#10B981' },
              { label: '24h Low', value: fmtVnd(stats.low24h), color: '#EF4444' },
              { label: 'Volume 24h', value: fmtCompact(stats.volume24h), color: c.text1 },
              { label: 'Lệnh 24h', value: stats.trades24h.toLocaleString(), color: c.text1 },
              { label: 'Spread', value: `${spreadPercent.toFixed(3)}%`, color: '#F59E0B' },
            ].map(row => (
              <div key={row.label}>
                <p style={{ color: c.text3, fontSize: 10, marginBottom: 2 }}>{row.label}</p>
                <p style={{ color: row.color, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>{row.value}</p>
              </div>
            ))}
          </div>
        </TrCard>
        
        {/* Depth Chart */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>Biểu đồ độ sâu</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: '#10B981' }} />
                <span style={{ color: c.text3, fontSize: 10 }}>Mua</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: '#EF4444' }} />
                <span style={{ color: c.text3, fontSize: 10 }}>Bán</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={depthChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <XAxis 
                key="ob-x"
                dataKey="price" 
                tick={{ fontSize: 9, fill: c.text3 }}
                tickFormatter={(val) => selectedAsset === 'USDT' ? `${(val / 1000).toFixed(1)}k` : `${(val / 1000000).toFixed(1)}M`}
              />
              <YAxis 
                key="ob-y"
                tick={{ fontSize: 9, fill: c.text3 }}
                tickFormatter={(val) => fmtCompact(val)}
              />
              <Tooltip
                key="ob-tip"
                contentStyle={{ 
                  background: c.surface, 
                  border: `1px solid ${c.borderSolid}`, 
                  borderRadius: 12,
                  fontSize: 11,
                }}
                labelFormatter={(val) => `Giá: ${fmtVnd(val)}`}
                formatter={(val: number) => [`${fmtAmount(val)} ${selectedAsset}`, '']}
              />
              <Bar key="ob-bid" dataKey="bidTotal" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar key="ob-ask" dataKey="askTotal" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </TrCard>
        
        {/* Best Bid/Ask */}
        <div className="grid grid-cols-2 gap-3">
          <TrCard className="p-3" accentBorder="rgba(16,185,129,0.3)" style={{ borderWidth: 1.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>BID CAO NHẤT</p>
            </div>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace', marginBottom: 4 }}>
              {fmtVnd(bestBid.price)}
            </p>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 10 }}>Volume</span>
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{fmtAmount(bestBid.volume)} {selectedAsset}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ color: c.text3, fontSize: 10 }}>Lệnh</span>
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{bestBid.orders}</span>
            </div>
          </TrCard>
          
          <TrCard className="p-3" accentBorder="rgba(239,68,68,0.3)" style={{ borderWidth: 1.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={14} color="#EF4444" />
              <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>ASK THẤP NHẤT</p>
            </div>
            <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace', marginBottom: 4 }}>
              {fmtVnd(bestAsk.price)}
            </p>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 10 }}>Volume</span>
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{fmtAmount(bestAsk.volume)} {selectedAsset}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ color: c.text3, fontSize: 10 }}>Lệnh</span>
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>{bestAsk.orders}</span>
            </div>
          </TrCard>
        </div>
        
        {/* Order Book Lists */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bids */}
          <TrCard className="p-3">
            <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>MUA (BID)</p>
            <div className="flex flex-col gap-1">
              {bids.slice(0, 10).map((bid, i) => {
                const widthPercent = (bid.total / maxTotal) * 100;
                return (
                  <div key={i} className="relative">
                    <div className="absolute right-0 top-0 h-full rounded" 
                      style={{ width: `${widthPercent}%`, background: 'rgba(16,185,129,0.08)' }} />
                    <div className="relative flex justify-between py-1 px-2">
                      <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                        {selectedAsset === 'USDT' ? (bid.price / 1000).toFixed(2) : (bid.price / 1000000).toFixed(3)}
                      </span>
                      <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                        {fmtAmount(bid.volume)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
          
          {/* Asks */}
          <TrCard className="p-3">
            <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: 0.3 }}>BÁN (ASK)</p>
            <div className="flex flex-col gap-1">
              {asks.slice(0, 10).map((ask, i) => {
                const widthPercent = (ask.total / maxTotal) * 100;
                return (
                  <div key={i} className="relative">
                    <div className="absolute right-0 top-0 h-full rounded" 
                      style={{ width: `${widthPercent}%`, background: 'rgba(239,68,68,0.08)' }} />
                    <div className="relative flex justify-between py-1 px-2">
                      <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                        {selectedAsset === 'USDT' ? (ask.price / 1000).toFixed(2) : (ask.price / 1000000).toFixed(3)}
                      </span>
                      <span style={{ color: c.text2, fontSize: 10, fontFamily: 'monospace' }}>
                        {fmtAmount(ask.volume)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
        </div>
        
        <div style={{ height: 16 }} />
      </div>
    </PageLayout>
  );
}