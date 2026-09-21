import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Volume2,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Clock,
  Gauge,
  AlertTriangle,
  Target,
  Layers,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CRYPTO_PAIRS } from '../../data/mockData';
import { fmtPrice, fmtPct, fmtCompact, fmtUsd } from '../../data/formatNumber';
import { WEB_FULL_BLEED_HEIGHT } from '../../components/layout/webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WebMarketScannerPage — Real-time Market Screener
 * ══════════════════════════════════════════════════════════
 *
 *  Professional market scanner/screener tool:
 *  ● Real-time price movement scanning
 *  ● Volume spike detection
 *  ● Technical signal alerts (RSI, MACD, Bollinger)
 *  ● Custom filter builder
 *  ● Live updating with visual indicators
 *  ● Quick trade entry from scanner
 */

/* ─── Deterministic Scanner Signal Data ─── */
interface ScannerSignal {
  id: string;
  pair: string;
  baseAsset: string;
  logoColor: string;
  price: number;
  change1h: number;
  change24h: number;
  volume24h: number;
  volumeChange: number; // % change vs avg
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  bbPosition: 'upper' | 'lower' | 'middle'; // Bollinger band position
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  strength: number; // 0-100
  alerts: string[];
  lastUpdate: number; // seconds ago
}

const generateScannerData = (): ScannerSignal[] => {
  return [
    {
      id: 'btcusdt',
      pair: 'BTC/USDT',
      baseAsset: 'BTC',
      logoColor: '#F7931A',
      price: 67543.21,
      change1h: 0.45,
      change24h: 2.34,
      volume24h: 23456789000,
      volumeChange: 35,
      rsi: 62,
      macdSignal: 'bullish',
      bbPosition: 'upper',
      signal: 'buy',
      strength: 72,
      alerts: ['RSI thoát vùng quá bán', 'Volume tăng 35%'],
      lastUpdate: 3,
    },
    {
      id: 'solusdt',
      pair: 'SOL/USDT',
      baseAsset: 'SOL',
      logoColor: '#9945FF',
      price: 178.32,
      change1h: 1.82,
      change24h: 8.07,
      volume24h: 3456789000,
      volumeChange: 120,
      rsi: 78,
      macdSignal: 'bullish',
      bbPosition: 'upper',
      signal: 'strong_buy',
      strength: 88,
      alerts: ['Breakout khỏi kháng cự', 'Volume spike x2.2', 'MACD cắt lên'],
      lastUpdate: 1,
    },
    {
      id: 'ethusdt',
      pair: 'ETH/USDT',
      baseAsset: 'ETH',
      logoColor: '#627EEA',
      price: 3521.45,
      change1h: -0.32,
      change24h: -1.23,
      volume24h: 8765432000,
      volumeChange: -5,
      rsi: 45,
      macdSignal: 'bearish',
      bbPosition: 'middle',
      signal: 'neutral',
      strength: 48,
      alerts: ['Giá test hỗ trợ $3,500'],
      lastUpdate: 5,
    },
    {
      id: 'bnbusdt',
      pair: 'BNB/USDT',
      baseAsset: 'BNB',
      logoColor: '#F3BA2F',
      price: 412.87,
      change1h: 0.92,
      change24h: 3.61,
      volume24h: 1234567000,
      volumeChange: 45,
      rsi: 58,
      macdSignal: 'bullish',
      bbPosition: 'middle',
      signal: 'buy',
      strength: 65,
      alerts: ['Volume tăng đều', 'Giá vượt MA50'],
      lastUpdate: 8,
    },
    {
      id: 'maticusdt',
      pair: 'MATIC/USDT',
      baseAsset: 'MATIC',
      logoColor: '#8247E5',
      price: 0.8976,
      change1h: 1.45,
      change24h: 5.6,
      volume24h: 789012000,
      volumeChange: 85,
      rsi: 71,
      macdSignal: 'bullish',
      bbPosition: 'upper',
      signal: 'buy',
      strength: 74,
      alerts: ['Breakout pattern', 'Volume spike x1.8'],
      lastUpdate: 2,
    },
    {
      id: 'avaxusdt',
      pair: 'AVAX/USDT',
      baseAsset: 'AVAX',
      logoColor: '#E84142',
      price: 38.54,
      change1h: 0.68,
      change24h: 4.73,
      volume24h: 567890000,
      volumeChange: 25,
      rsi: 55,
      macdSignal: 'neutral',
      bbPosition: 'middle',
      signal: 'buy',
      strength: 60,
      alerts: [],
      lastUpdate: 12,
    },
    {
      id: 'linkusdt',
      pair: 'LINK/USDT',
      baseAsset: 'LINK',
      logoColor: '#2A5ADA',
      price: 14.23,
      change1h: -0.85,
      change24h: -5.76,
      volume24h: 345678000,
      volumeChange: 15,
      rsi: 28,
      macdSignal: 'bearish',
      bbPosition: 'lower',
      signal: 'strong_sell',
      strength: 22,
      alerts: ['RSI vùng quá bán', 'Giá dưới BB lower', 'MACD bearish cross'],
      lastUpdate: 4,
    },
    {
      id: 'dotusdt',
      pair: 'DOT/USDT',
      baseAsset: 'DOT',
      logoColor: '#E6007A',
      price: 7.832,
      change1h: -0.42,
      change24h: -3.55,
      volume24h: 432109000,
      volumeChange: -10,
      rsi: 35,
      macdSignal: 'bearish',
      bbPosition: 'lower',
      signal: 'sell',
      strength: 32,
      alerts: ['Xu hướng giảm tiếp tục'],
      lastUpdate: 7,
    },
    {
      id: 'xrpusdt',
      pair: 'XRP/USDT',
      baseAsset: 'XRP',
      logoColor: '#00AAE4',
      price: 0.6234,
      change1h: -0.12,
      change24h: -2.59,
      volume24h: 1876543000,
      volumeChange: 8,
      rsi: 42,
      macdSignal: 'neutral',
      bbPosition: 'middle',
      signal: 'neutral',
      strength: 45,
      alerts: [],
      lastUpdate: 15,
    },
    {
      id: 'adausdt',
      pair: 'ADA/USDT',
      baseAsset: 'ADA',
      logoColor: '#0033AD',
      price: 0.4521,
      change1h: 0.55,
      change24h: 3.22,
      volume24h: 654321000,
      volumeChange: 30,
      rsi: 56,
      macdSignal: 'bullish',
      bbPosition: 'middle',
      signal: 'buy',
      strength: 62,
      alerts: ['Volume tăng 30%'],
      lastUpdate: 6,
    },
  ];
};

type ScannerFilter =
  'all' | 'strong_buy' | 'buy' | 'sell' | 'volume_spike' | 'oversold' | 'overbought';
type SortField = 'signal' | 'change24h' | 'volume' | 'rsi' | 'strength';

const SIGNAL_CONFIG = {
  strong_buy: { label: 'Mua mạnh', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  buy: { label: 'Mua', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  neutral: { label: 'Trung tính', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  sell: { label: 'Bán', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
  strong_sell: { label: 'Bán mạnh', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

export function WebMarketScannerPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefix = useRoutePrefix();

  const [data, setData] = useState<ScannerSignal[]>(generateScannerData);
  const [filter, setFilter] = useState<ScannerFilter>('all');
  const [sortField, setSortField] = useState<SortField>('strength');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const panelBg = isDark ? '#0F1117' : '#FFFFFF';
  const topBarBg = isDark ? '#13151D' : '#F8F9FA';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // Auto refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      setData((prev) =>
        prev.map((d) => ({
          ...d,
          price: d.price * (1 + (Math.random() - 0.498) * 0.002),
          change1h: d.change1h + (Math.random() - 0.5) * 0.1,
          lastUpdate: 0,
          rsi: Math.max(10, Math.min(90, d.rsi + (Math.random() - 0.5) * 2)),
          strength: Math.max(5, Math.min(95, d.strength + (Math.random() - 0.5) * 3)),
        })),
      );
      setLastRefresh(Date.now());
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // Tick lastUpdate counter
  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => prev.map((d) => ({ ...d, lastUpdate: d.lastUpdate + 1 })));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Filter + sort
  const filteredData = useMemo(() => {
    let result = data;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) => d.pair.toLowerCase().includes(q) || d.baseAsset.toLowerCase().includes(q),
      );
    }

    switch (filter) {
      case 'strong_buy':
        result = result.filter((d) => d.signal === 'strong_buy');
        break;
      case 'buy':
        result = result.filter((d) => d.signal === 'buy' || d.signal === 'strong_buy');
        break;
      case 'sell':
        result = result.filter((d) => d.signal === 'sell' || d.signal === 'strong_sell');
        break;
      case 'volume_spike':
        result = result.filter((d) => d.volumeChange > 50);
        break;
      case 'oversold':
        result = result.filter((d) => d.rsi < 30);
        break;
      case 'overbought':
        result = result.filter((d) => d.rsi > 70);
        break;
    }

    const signalWeight = { strong_buy: 5, buy: 4, neutral: 3, sell: 2, strong_sell: 1 };
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'signal':
          cmp = signalWeight[a.signal] - signalWeight[b.signal];
          break;
        case 'change24h':
          cmp = a.change24h - b.change24h;
          break;
        case 'volume':
          cmp = a.volumeChange - b.volumeChange;
          break;
        case 'rsi':
          cmp = a.rsi - b.rsi;
          break;
        case 'strength':
          cmp = a.strength - b.strength;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [data, filter, sortField, sortAsc, searchQuery]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const selectedSignal = selectedId ? data.find((d) => d.id === selectedId) : null;

  // Signal summary counts
  const buys = data.filter((d) => d.signal === 'strong_buy' || d.signal === 'buy').length;
  const sells = data.filter((d) => d.signal === 'strong_sell' || d.signal === 'sell').length;
  const neutrals = data.filter((d) => d.signal === 'neutral').length;
  const volSpikes = data.filter((d) => d.volumeChange > 50).length;

  return (
    <div className="flex flex-col" style={{ height: WEB_FULL_BLEED_HEIGHT }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3.5 shrink-0"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${prefix}/markets`)}
            className="w-9 h-9 rounded-lg flex items-center justify-center web-cmd-btn transition-colors"
          >
            <ArrowLeft size={18} color={c.text2} />
          </button>
          <div>
            <span style={{ color: c.text1, fontSize: 18, fontWeight: 700, display: 'block' }}>
              Market Scanner
            </span>
            <span style={{ color: c.text3, fontSize: 12 }}>
              Quét tín hiệu thị trường thời gian thực
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: autoRefresh ? 'rgba(16,185,129,0.08)' : inputBg }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: autoRefresh ? '#10B981' : c.text3,
                animation: autoRefresh ? 'livePulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span
              style={{ color: autoRefresh ? '#10B981' : c.text3, fontSize: 11, fontWeight: 600 }}
            >
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="web-cmd-btn flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors"
            style={{ border: `1px solid ${panelBorder}` }}
          >
            <RefreshCw
              size={14}
              color={autoRefresh ? '#10B981' : c.text3}
              className={autoRefresh ? '' : ''}
            />
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>
              {autoRefresh ? 'Tạm dừng' : 'Tiếp tục'}
            </span>
          </button>
        </div>
      </div>

      {/* Signal summary bar */}
      <div
        className="flex items-center gap-5 px-6 py-2.5"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
      >
        <div className="flex items-center gap-1.5">
          <Zap size={13} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 12, fontWeight: 700 }}>{buys} Mua</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={13} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>
            {neutrals} Trung tính
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown size={13} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 700 }}>{sells} Bán</span>
        </div>
        <div className="w-px h-5" style={{ background: panelBorder }} />
        <div className="flex items-center gap-1.5">
          <Volume2 size={13} color="#8B5CF6" />
          <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>
            {volSpikes} Volume spike
          </span>
        </div>
        <div className="flex-1" />

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 rounded-lg"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 38 }}
        >
          <Search size={14} color={c.text3} />
          <input
            type="text"
            placeholder="Tìm cặp giao dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none"
            style={{ color: c.text1, fontSize: 13, width: 180 }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div
        className="flex items-center gap-2 px-6 py-2.5"
        style={{ borderBottom: `1px solid ${panelBorder}` }}
      >
        {[
          { id: 'all' as const, label: 'Tất cả', icon: Layers },
          { id: 'strong_buy' as const, label: 'Mua mạnh', icon: Zap },
          { id: 'buy' as const, label: 'Mua', icon: TrendingUp },
          { id: 'sell' as const, label: 'Bán', icon: TrendingDown },
          { id: 'volume_spike' as const, label: 'Vol Spike', icon: Volume2 },
          { id: 'oversold' as const, label: 'Quá bán', icon: Target },
          { id: 'overbought' as const, label: 'Quá mua', icon: AlertTriangle },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: filter === f.id ? 'rgba(59,130,246,0.1)' : inputBg,
              border: `1px solid ${filter === f.id ? 'rgba(59,130,246,0.2)' : inputBorder}`,
              color: filter === f.id ? '#3B82F6' : c.text3,
              fontSize: 12,
              fontWeight: filter === f.id ? 700 : 500,
            }}
          >
            <f.icon size={11} /> {f.label}
          </button>
        ))}
      </div>

      {/* Main content: Scanner table + Detail panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Table */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ borderRight: selectedSignal ? `1px solid ${panelBorder}` : 'none' }}
        >
          {/* Table header */}
          <div
            className="grid items-center px-5 py-2.5 shrink-0"
            style={{
              gridTemplateColumns: '40px 160px 110px 80px 80px 100px 70px 90px 100px 68px',
              borderBottom: `1px solid ${panelBorder}`,
              background: topBarBg,
            }}
          >
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>#</span>
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Cặp</span>
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Giá</span>
            <button
              onClick={() => handleSort('change24h')}
              className="flex items-center gap-0.5"
              style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}
            >
              24h% {sortField === 'change24h' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('volume')}
              className="flex items-center gap-0.5"
              style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}
            >
              Vol Δ {sortField === 'volume' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('rsi')}
              className="flex items-center gap-0.5"
              style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}
            >
              RSI {sortField === 'rsi' && (sortAsc ? '↑' : '↓')}
            </button>
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>MACD</span>
            <button
              onClick={() => handleSort('strength')}
              className="flex items-center gap-0.5"
              style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}
            >
              Strength {sortField === 'strength' && (sortAsc ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('signal')}
              className="flex items-center gap-0.5"
              style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}
            >
              Tín hiệu {sortField === 'signal' && (sortAsc ? '↑' : '↓')}
            </button>
            <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Hành động</span>
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {filteredData.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span style={{ color: c.text3, fontSize: 13 }}>Không tìm thấy kết quả</span>
              </div>
            ) : (
              filteredData.map((d, i) => {
                const signalCfg = SIGNAL_CONFIG[d.signal];
                const isSelected = selectedId === d.id;
                return (
                  <div
                    key={d.id}
                    className="grid items-center px-5 py-2.5 web-cmd-btn transition-colors cursor-pointer"
                    style={{
                      gridTemplateColumns: '40px 160px 110px 80px 80px 100px 70px 90px 100px 68px',
                      borderBottom: `1px solid ${panelBorder}`,
                      background: isSelected
                        ? isDark
                          ? 'rgba(59,130,246,0.05)'
                          : 'rgba(59,130,246,0.03)'
                        : 'transparent',
                      minHeight: 44,
                    }}
                    onClick={() => setSelectedId(isSelected ? null : d.id)}
                  >
                    <span
                      style={{ color: c.text3, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: d.logoColor + '15' }}
                      >
                        <span style={{ color: d.logoColor, fontSize: 9, fontWeight: 700 }}>
                          {d.baseAsset.slice(0, 3)}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            color: c.text1,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'block',
                          }}
                        >
                          {d.pair}
                        </span>
                        <span style={{ color: c.text3, fontSize: 10 }}>{d.lastUpdate}s ago</span>
                      </div>
                    </div>
                    <span
                      style={{
                        color: c.text1,
                        fontSize: 12,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ${fmtPrice(d.price)}
                    </span>
                    <span
                      style={{
                        color: d.change24h >= 0 ? '#10B981' : '#EF4444',
                        fontSize: 12,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {d.change24h >= 0 ? '+' : ''}
                      {d.change24h.toFixed(2)}%
                    </span>
                    <span
                      style={{
                        color:
                          d.volumeChange > 50
                            ? '#8B5CF6'
                            : d.volumeChange > 0
                              ? c.text2
                              : '#EF4444',
                        fontSize: 12,
                        fontWeight: d.volumeChange > 50 ? 700 : 500,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {d.volumeChange > 0 ? '+' : ''}
                      {d.volumeChange}%
                    </span>
                    {/* RSI bar */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{ height: 4, background: inputBg }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.rsi}%`,
                            background: d.rsi > 70 ? '#EF4444' : d.rsi < 30 ? '#10B981' : '#F59E0B',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: d.rsi > 70 ? '#EF4444' : d.rsi < 30 ? '#10B981' : c.text2,
                          fontSize: 11,
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          width: 22,
                        }}
                      >
                        {d.rsi.toFixed(0)}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-center"
                      style={{
                        background:
                          d.macdSignal === 'bullish'
                            ? 'rgba(16,185,129,0.08)'
                            : d.macdSignal === 'bearish'
                              ? 'rgba(239,68,68,0.08)'
                              : inputBg,
                        color:
                          d.macdSignal === 'bullish'
                            ? '#10B981'
                            : d.macdSignal === 'bearish'
                              ? '#EF4444'
                              : c.text3,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {d.macdSignal === 'bullish' ? '▲' : d.macdSignal === 'bearish' ? '▼' : '—'}
                    </span>
                    {/* Strength gauge */}
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{ height: 4, background: inputBg }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.strength}%`,
                            background:
                              d.strength > 65 ? '#10B981' : d.strength > 40 ? '#F59E0B' : '#EF4444',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          color: c.text2,
                          fontSize: 10,
                          fontVariantNumeric: 'tabular-nums',
                          width: 18,
                        }}
                      >
                        {d.strength.toFixed(0)}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-center"
                      style={{
                        background: signalCfg.bg,
                        color: signalCfg.color,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {signalCfg.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`${prefix}/trade/${d.id}`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: 'rgba(59,130,246,0.08)',
                        color: '#3B82F6',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Trade
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Detail side panel */}
        {selectedSignal && (
          <div
            className="shrink-0 flex flex-col overflow-y-auto scrollbar-none"
            style={{ width: 340, background: panelBg }}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between shrink-0"
              style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: selectedSignal.logoColor + '15' }}
                >
                  <span style={{ color: selectedSignal.logoColor, fontSize: 10, fontWeight: 700 }}>
                    {selectedSignal.baseAsset.slice(0, 3)}
                  </span>
                </div>
                <div>
                  <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>
                    {selectedSignal.pair}
                  </span>
                  <span style={{ color: c.text3, fontSize: 11, display: 'block' }}>
                    Chi tiết tín hiệu
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: inputBg }}
              >
                <ArrowLeft size={12} color={c.text3} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3.5">
              {/* Price + Signal */}
              <div className="flex items-center justify-between">
                <span
                  style={{
                    color: c.text1,
                    fontSize: 22,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ${fmtPrice(selectedSignal.price)}
                </span>
                <span
                  className="px-2.5 py-1 rounded-lg"
                  style={{
                    background: SIGNAL_CONFIG[selectedSignal.signal].bg,
                    color: SIGNAL_CONFIG[selectedSignal.signal].color,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {SIGNAL_CONFIG[selectedSignal.signal].label}
                </span>
              </div>

              {/* Change stats */}
              <div className="grid gap-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="px-3 py-2.5 rounded-lg" style={{ background: inputBg }}>
                  <span style={{ color: c.text3, fontSize: 11, display: 'block' }}>1h Change</span>
                  <span
                    style={{
                      color: selectedSignal.change1h >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 14,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {selectedSignal.change1h >= 0 ? '+' : ''}
                    {selectedSignal.change1h.toFixed(2)}%
                  </span>
                </div>
                <div className="px-3 py-2.5 rounded-lg" style={{ background: inputBg }}>
                  <span style={{ color: c.text3, fontSize: 11, display: 'block' }}>24h Change</span>
                  <span
                    style={{
                      color: selectedSignal.change24h >= 0 ? '#10B981' : '#EF4444',
                      fontSize: 14,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {selectedSignal.change24h >= 0 ? '+' : ''}
                    {selectedSignal.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Technical indicators */}
              <div className="rounded-xl p-4" style={{ border: `1px solid ${panelBorder}` }}>
                <span
                  style={{
                    color: c.text1,
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'block',
                    marginBottom: 10,
                  }}
                >
                  Chỉ báo kỹ thuật
                </span>

                {/* RSI */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: c.text3, fontSize: 11 }}>RSI (14)</span>
                    <span
                      style={{
                        color:
                          selectedSignal.rsi > 70
                            ? '#EF4444'
                            : selectedSignal.rsi < 30
                              ? '#10B981'
                              : c.text2,
                        fontSize: 12,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {selectedSignal.rsi.toFixed(1)}
                    </span>
                  </div>
                  <div
                    className="relative rounded-full overflow-hidden"
                    style={{ height: 6, background: inputBg }}
                  >
                    <div
                      className="absolute h-full"
                      style={{
                        left: '30%',
                        width: '40%',
                        background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                      }}
                    />
                    <div
                      className="absolute h-full w-0.5"
                      style={{ left: '30%', background: '#10B981', opacity: 0.4 }}
                    />
                    <div
                      className="absolute h-full w-0.5"
                      style={{ left: '70%', background: '#EF4444', opacity: 0.4 }}
                    />
                    <div
                      className="absolute h-2 w-2 rounded-full -top-0.5"
                      style={{
                        left: `${selectedSignal.rsi}%`,
                        transform: 'translateX(-50%)',
                        background:
                          selectedSignal.rsi > 70
                            ? '#EF4444'
                            : selectedSignal.rsi < 30
                              ? '#10B981'
                              : '#F59E0B',
                        border: `1.5px solid ${panelBg}`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span style={{ color: '#10B981', fontSize: 9 }}>Quá bán</span>
                    <span style={{ color: '#EF4444', fontSize: 9 }}>Quá mua</span>
                  </div>
                </div>

                {/* MACD */}
                <div
                  className="flex justify-between py-2"
                  style={{ borderTop: `1px solid ${panelBorder}` }}
                >
                  <span style={{ color: c.text3, fontSize: 11 }}>MACD</span>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background:
                        selectedSignal.macdSignal === 'bullish'
                          ? 'rgba(16,185,129,0.1)'
                          : selectedSignal.macdSignal === 'bearish'
                            ? 'rgba(239,68,68,0.1)'
                            : inputBg,
                      color:
                        selectedSignal.macdSignal === 'bullish'
                          ? '#10B981'
                          : selectedSignal.macdSignal === 'bearish'
                            ? '#EF4444'
                            : c.text3,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {selectedSignal.macdSignal === 'bullish'
                      ? 'Bullish Cross'
                      : selectedSignal.macdSignal === 'bearish'
                        ? 'Bearish Cross'
                        : 'Neutral'}
                  </span>
                </div>

                {/* Bollinger */}
                <div
                  className="flex justify-between py-2"
                  style={{ borderTop: `1px solid ${panelBorder}` }}
                >
                  <span style={{ color: c.text3, fontSize: 11 }}>Bollinger Band</span>
                  <span
                    style={{
                      color:
                        selectedSignal.bbPosition === 'upper'
                          ? '#EF4444'
                          : selectedSignal.bbPosition === 'lower'
                            ? '#10B981'
                            : c.text2,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {selectedSignal.bbPosition === 'upper'
                      ? 'Upper Band'
                      : selectedSignal.bbPosition === 'lower'
                        ? 'Lower Band'
                        : 'Mid Band'}
                  </span>
                </div>

                {/* Volume */}
                <div
                  className="flex justify-between py-2"
                  style={{ borderTop: `1px solid ${panelBorder}` }}
                >
                  <span style={{ color: c.text3, fontSize: 11 }}>Volume 24h</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ color: c.text2, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {fmtCompact(selectedSignal.volume24h, { prefix: '$' })}
                    </span>
                    <span
                      style={{
                        color:
                          selectedSignal.volumeChange > 50
                            ? '#8B5CF6'
                            : selectedSignal.volumeChange > 0
                              ? '#10B981'
                              : '#EF4444',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      ({selectedSignal.volumeChange > 0 ? '+' : ''}
                      {selectedSignal.volumeChange}%)
                    </span>
                  </div>
                </div>

                {/* Signal strength */}
                <div className="mt-2 pt-2.5" style={{ borderTop: `1px solid ${panelBorder}` }}>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ color: c.text3, fontSize: 11 }}>Tổng hợp tín hiệu</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
                      {selectedSignal.strength.toFixed(0)}/100
                    </span>
                  </div>
                  <div
                    className="rounded-full overflow-hidden"
                    style={{ height: 8, background: inputBg }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedSignal.strength}%`,
                        background:
                          selectedSignal.strength > 65
                            ? 'linear-gradient(90deg, #10B981, #059669)'
                            : selectedSignal.strength > 40
                              ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                              : 'linear-gradient(90deg, #EF4444, #DC2626)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {selectedSignal.alerts.length > 0 && (
                <div
                  className="rounded-xl p-3.5"
                  style={{
                    background: 'rgba(245,158,11,0.04)',
                    border: '1px solid rgba(245,158,11,0.1)',
                  }}
                >
                  <span
                    style={{
                      color: '#F59E0B',
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Cảnh báo
                  </span>
                  {selectedSignal.alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <Bell size={10} color="#F59E0B" />
                      <span style={{ color: c.text2, fontSize: 11 }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate(`${prefix}/trade/${selectedSignal.id}?side=buy`)}
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <TrendingUp size={13} /> MUA
                </button>
                <button
                  onClick={() => navigate(`${prefix}/trade/${selectedSignal.id}?side=sell`)}
                  className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <TrendingDown size={13} /> BÁN
                </button>
              </div>
              <button
                onClick={() => navigate(`${prefix}/markets/${selectedSignal.id}`)}
                className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  background: inputBg,
                  border: `1px solid ${inputBorder}`,
                  color: c.text2,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Eye size={12} /> Xem chi tiết thị trường
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
