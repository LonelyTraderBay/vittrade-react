/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadSwapAggregatorPage — Phase 4.11 (Feature 1/4)
 * ══════════════════════════════════════════════════════════════
 *  DEX price comparison, optimal route finding, slippage protection
 *  Pattern A — Standard Page with tabs
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import {
  ArrowLeftRight, TrendingDown, Shield, Zap, AlertCircle,
  ChevronDown, Info, ChevronRight, Repeat, ExternalLink,
} from 'lucide-react';

const TABS = ['So sánh', 'Lịch sử', 'Cài đặt'] as const;
type Tab = typeof TABS[number];

interface DEX {
  name: string;
  logo: string;
  price: number;
  priceImpact: number;
  gas: number;
  liquidity: number;
  route: string[];
  estimatedTime: string;
  security: 'high' | 'medium' | 'low';
}

interface SwapHistory {
  id: string;
  from: string;
  to: string;
  amount: number;
  dex: string;
  rate: number;
  timestamp: Date;
  txHash: string;
  status: 'success' | 'pending' | 'failed';
}

const MOCK_DEXES: DEX[] = [
  {
    name: 'Uniswap V3',
    logo: '🦄',
    price: 2456.32,
    priceImpact: 0.12,
    gas: 45,
    liquidity: 12500000,
    route: ['USDT', 'WETH', 'ARB'],
    estimatedTime: '~30s',
    security: 'high',
  },
  {
    name: 'PancakeSwap',
    logo: '🥞',
    price: 2454.18,
    priceImpact: 0.24,
    gas: 12,
    liquidity: 8900000,
    route: ['USDT', 'BNB', 'ARB'],
    estimatedTime: '~3s',
    security: 'high',
  },
  {
    name: 'SushiSwap',
    logo: '🍣',
    price: 2453.67,
    priceImpact: 0.31,
    gas: 38,
    liquidity: 5200000,
    route: ['USDT', 'ARB'],
    estimatedTime: '~20s',
    security: 'medium',
  },
  {
    name: 'Curve',
    logo: '🌀',
    price: 2452.89,
    priceImpact: 0.15,
    gas: 52,
    liquidity: 18000000,
    route: ['USDT', 'USDC', 'WETH', 'ARB'],
    estimatedTime: '~45s',
    security: 'high',
  },
  {
    name: 'Balancer',
    logo: '⚖️',
    price: 2450.12,
    priceImpact: 0.42,
    gas: 67,
    liquidity: 3400000,
    route: ['USDT', 'DAI', 'WETH', 'ARB'],
    estimatedTime: '~1m',
    security: 'medium',
  },
];

const MOCK_HISTORY: SwapHistory[] = [
  {
    id: 'sw_001',
    from: 'USDT',
    to: 'ARB',
    amount: 1000,
    dex: 'Uniswap V3',
    rate: 2456.32,
    timestamp: new Date(Date.now() - 3600000),
    txHash: '0xabc...def',
    status: 'success',
  },
  {
    id: 'sw_002',
    from: 'USDC',
    to: 'OP',
    amount: 500,
    dex: 'PancakeSwap',
    rate: 1.87,
    timestamp: new Date(Date.now() - 86400000),
    txHash: '0x123...456',
    status: 'success',
  },
  {
    id: 'sw_003',
    from: 'DAI',
    to: 'MATIC',
    amount: 250,
    dex: 'Curve',
    rate: 0.89,
    timestamp: new Date(Date.now() - 172800000),
    txHash: '0x789...abc',
    status: 'pending',
  },
];

export function LaunchpadSwapAggregatorPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('So sánh');
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('ARB');
  const [amount, setAmount] = useState('1000');
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRouteDetails, setShowRouteDetails] = useState<string | null>(null);

  const bestDex = MOCK_DEXES[0];
  const savingsVsWorst = ((bestDex.price - MOCK_DEXES[MOCK_DEXES.length - 1].price) / MOCK_DEXES[MOCK_DEXES.length - 1].price) * 100;

  return (
    <PageLayout>
      <Header title="Swap Aggregator" back />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <PageContent gap="default">
        {tab === 'So sánh' && (
          <>
            {/* Input Section */}
            <div
              className="rounded-2xl p-4"
              style={{ background: c.surface, border: `1px solid ${c.border}` }}
            >
              <p style={{ color: c.text2, fontSize: 12, marginBottom: 12 }}>Swap from</p>
              <div className="flex items-center gap-3 mb-4">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:opacity-90"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <span style={{ fontSize: 20 }}>💵</span>
                  <span style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{fromToken}</span>
                  <ChevronDown size={16} color={c.text3} />
                </button>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-right outline-none"
                  style={{ color: c.text1, fontSize: 18, fontWeight: 600 }}
                />
              </div>

              <div className="flex justify-center -my-2">
                <button
                  className="p-2 rounded-full hover:opacity-80 transition-opacity"
                  style={{ background: c.primary }}
                  onClick={() => {
                    const temp = fromToken;
                    setFromToken(toToken);
                    setToToken(temp);
                  }}
                >
                  <ArrowLeftRight size={16} color="#fff" />
                </button>
              </div>

              <p style={{ color: c.text2, fontSize: 12, marginBottom: 12, marginTop: 16 }}>Swap to</p>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:opacity-90"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <span style={{ fontSize: 20 }}>🟦</span>
                  <span style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{toToken}</span>
                  <ChevronDown size={16} color={c.text3} />
                </button>
                <div className="flex-1 text-right">
                  <p style={{ color: c.text1, fontSize: 18, fontWeight: 600 }}>
                    ~{(parseFloat(amount) / bestDex.price).toFixed(4)}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    @{bestDex.price.toFixed(2)} {fromToken}
                  </p>
                </div>
              </div>
            </div>

            {/* Best Route Alert */}
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <Zap size={18} color="#10B981" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  Best rate: {bestDex.name}
                </p>
                <p style={{ color: c.text2, fontSize: 12 }}>
                  Saving {savingsVsWorst.toFixed(2)}% vs worst route • Gas: ${bestDex.gas}
                </p>
              </div>
            </div>

            {/* DEX Comparison List */}
            <PageSection label="DEX so sánh" accentColor={c.primary}>
              {MOCK_DEXES.map((dex, idx) => (
                <div key={dex.name}>
                  <button
                    onClick={() => setShowRouteDetails(showRouteDetails === dex.name ? null : dex.name)}
                    className="w-full rounded-2xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
                    style={{
                      background: idx === 0 ? 'rgba(16,185,129,0.04)' : c.surface,
                      border: `1px solid ${idx === 0 ? 'rgba(16,185,129,0.15)' : c.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center justify-center"
                          style={{ width: 40, height: 40, borderRadius: 12, background: c.bg }}
                        >
                          <span style={{ fontSize: 20 }}>{dex.logo}</span>
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p style={{ color: c.text1, fontSize: 15, fontWeight: 600 }}>{dex.name}</p>
                            {idx === 0 && (
                              <span
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                style={{ background: '#10B981', color: '#fff' }}
                              >
                                BEST
                              </span>
                            )}
                          </div>
                          <p style={{ color: c.text3, fontSize: 11 }}>{dex.estimatedTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                          {(parseFloat(amount) / dex.price).toFixed(4)}
                        </p>
                        <p style={{ color: c.text3, fontSize: 11 }}>~${amount}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="text-left">
                        <p style={{ color: c.text3, fontSize: 10 }}>Price Impact</p>
                        <p
                          style={{
                            color: dex.priceImpact < 0.2 ? '#10B981' : dex.priceImpact < 0.3 ? '#F59E0B' : '#EF4444',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {dex.priceImpact.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p style={{ color: c.text3, fontSize: 10 }}>Gas Fee</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>${dex.gas}</p>
                      </div>
                      <div className="text-right">
                        <p style={{ color: c.text3, fontSize: 10 }}>Liquidity</p>
                        <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                          ${(dex.liquidity / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>

                    {showRouteDetails === dex.name && (
                      <div
                        className="mt-3 pt-3 rounded-xl p-3"
                        style={{ borderTop: `1px solid ${c.border}`, background: c.bg }}
                      >
                        <p style={{ color: c.text2, fontSize: 11, marginBottom: 8 }}>Route</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {dex.route.map((token, i) => (
                            <React.Fragment key={i}>
                              <span
                                className="px-2 py-1 rounded-lg"
                                style={{ background: c.surface, color: c.text1, fontSize: 11, fontWeight: 600 }}
                              >
                                {token}
                              </span>
                              {i < dex.route.length - 1 && <ChevronRight size={12} color={c.text3} />}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Shield
                            size={12}
                            color={dex.security === 'high' ? '#10B981' : '#F59E0B'}
                          />
                          <p style={{ color: c.text3, fontSize: 10 }}>
                            Security: {dex.security === 'high' ? 'High' : 'Medium'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center mt-2">
                      <ChevronDown
                        size={16}
                        color={c.text3}
                        className={showRouteDetails === dex.name ? 'rotate-180' : ''}
                        style={{ transition: 'transform 0.2s' }}
                      />
                    </div>
                  </button>
                </div>
              ))}
            </PageSection>

            {/* Warning */}
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <AlertCircle size={14} color="#F59E0B" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Giá chỉ mang tính chất tham khảo. Kiểm tra lại trước khi swap. Slippage: {slippageTolerance}%
              </p>
            </div>
          </>
        )}

        {tab === 'Lịch sử' && (
          <PageSection label="Giao dịch gần đây">
            {MOCK_HISTORY.map((swap) => (
              <button
                key={swap.id}
                onClick={() => {/* Navigate to tx detail */}}
                className="w-full rounded-2xl p-4 hover:opacity-90 transition-opacity active:scale-[0.98]"
                style={{ background: c.surface, border: `1px solid ${c.border}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
                        {swap.from} → {swap.to}
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                        style={{
                          background:
                            swap.status === 'success'
                              ? 'rgba(16,185,129,0.15)'
                              : swap.status === 'pending'
                              ? 'rgba(245,158,11,0.15)'
                              : 'rgba(239,68,68,0.15)',
                          color: swap.status === 'success' ? '#10B981' : swap.status === 'pending' ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {swap.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: c.text3, fontSize: 11 }}>{swap.dex}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{swap.amount} {swap.from}</p>
                    <p style={{ color: c.text3, fontSize: 11 }}>@{swap.rate.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${c.border}` }}>
                  <p style={{ color: c.text3, fontSize: 10 }}>
                    {swap.timestamp.toLocaleDateString()} {swap.timestamp.toLocaleTimeString()}
                  </p>
                  <div className="flex items-center gap-1">
                    <p style={{ color: c.text3, fontSize: 10 }}>{swap.txHash}</p>
                    <ExternalLink size={10} color={c.text3} />
                  </div>
                </div>
              </button>
            ))}
          </PageSection>
        )}

        {tab === 'Cài đặt' && (
          <>
            <PageSection label="Slippage & Gas">
              <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <div className="mb-4">
                  <label style={{ color: c.text2, fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Slippage Tolerance (%)
                  </label>
                  <div className="flex gap-2 mb-2">
                    {['0.1', '0.5', '1.0', '3.0'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSlippageTolerance(val)}
                        className="flex-1 py-2 rounded-xl transition-all"
                        style={{
                          background: slippageTolerance === val ? c.primary : c.bg,
                          color: slippageTolerance === val ? '#fff' : c.text1,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={slippageTolerance}
                    onChange={(e) => setSlippageTolerance(e.target.value)}
                    placeholder="Custom"
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14 }}
                  />
                </div>

                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
                  <div>
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Auto Refresh</p>
                    <p style={{ color: c.text3, fontSize: 11 }}>Cập nhật giá mỗi 10s</p>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="relative"
                    style={{ width: 48, height: 28, borderRadius: 14, background: autoRefresh ? c.primary : c.border }}
                  >
                    <div
                      className="absolute top-1 transition-all"
                      style={{
                        left: autoRefresh ? 22 : 2,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        background: '#fff',
                      }}
                    />
                  </button>
                </div>
              </div>
            </PageSection>

            <PageSection label="An toàn">
              <div
                className="rounded-xl p-3 flex items-start gap-2"
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <Info size={14} color="#3B82F6" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                  Luôn kiểm tra địa chỉ hợp đồng và chỉ swap trên các DEX uy tín. Không chia sẻ private key.
                </p>
              </div>
            </PageSection>
          </>
        )}
      </PageContent>

      {/* Floating CTA */}
      {tab === 'So sánh' && (
        <>
          <div style={{ height: 60 }} />
          <div
            className="fixed left-0 right-0 px-5 pb-8"
            style={{ bottom: 92, maxWidth: 480, margin: '0 auto' }}
          >
            <button
              onClick={() => {
                alert(`Swap ${amount} ${fromToken} for ${(parseFloat(amount) / bestDex.price).toFixed(4)} ${toToken} via ${bestDex.name}`);
              }}
              className="w-full rounded-[14px] flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                height: 48,
                background: c.primary,
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <Repeat size={18} />
              Swap với {bestDex.name}
            </button>
          </div>
        </>
      )}
    </PageLayout>
  );
}