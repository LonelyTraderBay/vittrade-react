import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Clock,
  Repeat,
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { fmtAmount, fmtUsd, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { TrCard } from '@/shared/ui/TrCard';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useMarketPairsQuery } from '@/features/market';
import {
  useWalletAssetsQuery,
  useWalletTransactionsQuery,
} from '@/features/wallet/model/wallet-queries';
import { normalizeCoinSymbol } from '@/shared/types/route-state';

export interface WalletAssetDetailIntegrations {
  showDCAButton?: boolean;
  onDCAImpression?: (symbol: string) => void;
  onDCAButtonClick?: (symbol: string) => void;
}

export function WalletAssetDetailPage({
  showDCAButton = false,
  onDCAImpression,
  onDCAButtonClick,
}: WalletAssetDetailIntegrations = {}) {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [period, setPeriod] = useState('1M');

  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets,
  } = useWalletAssetsQuery();
  const {
    data: marketData,
    isLoading: marketLoading,
    error: marketError,
    refetch: refetchMarket,
  } = useMarketPairsQuery({ search: assetId ?? '', limit: 20 });
  const asset = assetsData?.items.find(
    (a) => a.id === assetId || a.symbol.toLowerCase() === assetId?.toLowerCase(),
  );
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useWalletTransactionsQuery({ asset: asset?.symbol ?? assetId?.toUpperCase(), limit: 20 });
  const pair = marketData?.items.find((item) => item.baseAsset === asset?.symbol);
  const assetTxs = transactionsData?.items ?? [];
  const chartData =
    pair?.sparklineData.map((price, index) => ({ time: `${index + 1}`, price })) ?? [];

  // The app shell supplies DCA rollout and analytics through this integration seam.
  useEffect(() => {
    if (showDCAButton && asset) {
      onDCAImpression?.(asset.symbol);
    }
  }, [showDCAButton, asset, onDCAImpression]);

  if (assetsLoading || marketLoading || transactionsLoading) {
    return (
      <PageLayout>
        <Header title="Tài sản" subtitle="Chi tiết · Wallet" back />
        <PageContent>
          <div className="py-16 text-center" style={{ color: c.text2 }}>
            Đang tải dữ liệu tài sản…
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  if (assetsError || marketError || transactionsError) {
    return (
      <PageLayout>
        <Header title="Tài sản" subtitle="Chi tiết · Wallet" back />
        <PageContent>
          <ErrorState
            title="Không thể tải chi tiết tài sản"
            onAction={() => {
              void refetchAssets();
              void refetchMarket();
              void refetchTransactions();
            }}
          />
        </PageContent>
      </PageLayout>
    );
  }

  if (!asset) {
    return (
      <PageLayout>
        <Header title="Tài sản" subtitle="Chi tiết · Wallet" back />
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: c.text2 }}>Không tìm thấy tài sản</p>
        </div>
      </PageLayout>
    );
  }

  const isPositive = asset.change24h >= 0;

  return (
    <PageLayout>
      <Header title={asset.symbol} subtitle="Chi tiết · Wallet" back />

      <PageContent>
        {/* Asset header card */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: `linear-gradient(135deg, ${asset.logoColor}15 0%, ${asset.logoColor}08 100%)`,
            border: `1px solid ${asset.logoColor}25`,
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: asset.logoColor + '22',
                border: `2px solid ${asset.logoColor}44`,
              }}
            >
              <span style={{ color: asset.logoColor, fontSize: 14, fontWeight: 700 }}>
                {asset.symbol.slice(0, 3)}
              </span>
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>{asset.name}</p>
              <p style={{ color: c.text2, fontSize: 13 }}>{asset.symbol}</p>
            </div>
          </div>

          <p style={{ color: c.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtUsd(asset.usdValue)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span style={{ color: c.text2, fontSize: 13 }}>
              {fmtAmount(asset.balance)} {asset.symbol}
            </span>
            <span
              style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 600 }}
            >
              {fmtPct(asset.change24h)}
            </span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Khả dụng</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtAmount(asset.available)}
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Trong lệnh</p>
              <p
                style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}
              >
                {fmtAmount(asset.inOrder)}
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Đóng băng</p>
              <p
                style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}
              >
                {fmtAmount(asset.frozen)}
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Giá hiện tại</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                {pair ? fmtPrice(pair.price) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'Nạp',
              icon: ArrowDownLeft,
              color: '#10B981',
              path: `${prefix}/wallet/deposit/${asset.symbol.toLowerCase()}`,
            },
            {
              label: 'Rút',
              icon: ArrowUpRight,
              color: '#EF4444',
              path: `${prefix}/wallet/withdraw/${asset.symbol.toLowerCase()}`,
            },
            {
              label: 'Chuyển',
              icon: ArrowDownUp,
              color: c.primary,
              path: `${prefix}/wallet/transfer`,
            },
            ...(showDCAButton
              ? [
                  {
                    label: 'DCA',
                    icon: Repeat,
                    color: '#8B5CF6',
                    path: `${prefix}/dca`,
                    isDCA: true,
                    dcaCoin: asset.symbol,
                  },
                ]
              : []),
          ].map((btn) => (
            <TrCard
              key={btn.label}
              as="button"
              hover
              onClick={() => {
                hapticSelection();

                // Track DCA button click
                if ('isDCA' in btn && btn.isDCA) {
                  onDCAButtonClick?.(asset.symbol);
                }

                if ('dcaCoin' in btn && btn.dcaCoin) {
                  navigate(btn.path, {
                    state: { preselectedCoin: normalizeCoinSymbol(btn.dcaCoin) },
                  });
                  return;
                }

                navigate(btn.path);
              }}
              className="flex flex-col items-center gap-1.5 py-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: btn.color + '15' }}
              >
                <btn.icon size={20} color={btn.color} />
              </div>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{btn.label}</span>
            </TrCard>
          ))}
        </div>

        {/* Price chart */}
        {pair && (
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Biểu đồ giá</span>
              <div className="flex gap-1">
                {['1W', '1M', '3M'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-3 py-1 rounded-lg text-xs"
                    style={{
                      background: period === p ? c.chipActiveBg : 'transparent',
                      color: period === p ? c.chipActiveText : c.chipText,
                      fontWeight: 600,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs key="gradient-defs">
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={asset.logoColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={asset.logoColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis key="ad-x" dataKey="time" hide />
                <YAxis key="ad-y" hide domain={['auto', 'auto']} />
                <Tooltip
                  key="ad-tip"
                  contentStyle={{
                    background: c.surface2,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: c.text1 }}
                  formatter={(v: number) => [fmtUsd(v), 'Giá']}
                />
                <Area
                  key="ad-area"
                  type="monotone"
                  dataKey="price"
                  stroke={asset.logoColor}
                  strokeWidth={2}
                  fill="url(#assetGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TrCard>
        )}

        {/* Transaction history */}
        <div>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Lịch sử giao dịch
          </p>
          {assetTxs.length === 0 && (
            <TrCard className="py-8 text-center">
              <Clock size={32} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text3, fontSize: 13 }}>Chưa có giao dịch nào</p>
            </TrCard>
          )}
          {assetTxs.map((tx, i) => {
            const isDeposit =
              tx.type === 'deposit' || tx.type === 'trade_buy' || tx.type === 'p2p_buy';
            return (
              <button
                key={tx.id}
                onClick={() => navigate(`${prefix}/wallet/transaction/${tx.id}`)}
                className="w-full flex items-center gap-3 py-3"
                style={{
                  borderBottom: i < assetTxs.length - 1 ? `1px solid ${c.divider}` : 'none',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                >
                  {isDeposit ? (
                    <TrendingUp size={16} color="#10B981" />
                  ) : (
                    <TrendingDown size={16} color="#EF4444" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                    {tx.type === 'deposit'
                      ? 'Nạp'
                      : tx.type === 'withdraw'
                        ? 'Rút'
                        : tx.type === 'trade_buy'
                          ? 'Mua'
                          : tx.type === 'trade_sell'
                            ? 'Bán'
                            : tx.type === 'p2p_buy'
                              ? 'P2P Mua'
                              : 'P2P Bán'}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{tx.createdAt.slice(0, 16)}</p>
                </div>
                <div className="text-right">
                  <p
                    style={{
                      color: isDeposit ? '#10B981' : '#EF4444',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {isDeposit ? '+' : '-'}
                    {fmtAmount(tx.amount)} {tx.asset}
                  </p>
                  <p
                    style={{
                      color:
                        tx.status === 'completed'
                          ? '#10B981'
                          : tx.status === 'pending'
                            ? '#F59E0B'
                            : '#EF4444',
                      fontSize: 10,
                    }}
                  >
                    {tx.status === 'completed'
                      ? 'Hoàn thành'
                      : tx.status === 'pending'
                        ? 'Đang xử lý'
                        : 'Thất bại'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </PageContent>
    </PageLayout>
  );
}
