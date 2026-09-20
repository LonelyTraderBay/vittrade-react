import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ArrowDownUp, TrendingUp, TrendingDown, Clock, ExternalLink, Repeat } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { USER_ASSETS, TRANSACTIONS, CRYPTO_PAIRS } from '../../data/mockData';
import { fmtAmount, fmtUsd, fmtPct, fmtPrice } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { useHaptic } from '../../hooks/useHaptic';

// Analytics & Feature Flags
import { useDCAAnalytics } from '../../hooks/useDCAAnalytics';
import { useDCAAssetDetailButton } from '../../hooks/useFeatureFlag';
import { useAssetToCreationFunnel } from '../../hooks/useFunnelTracking';

function generateAssetChart(basePrice: number): { time: string; price: number }[] {
  const data = [];
  let p = basePrice * 0.9;
  for (let i = 30; i >= 0; i--) {
    p += (Math.random() - 0.45) * basePrice * 0.015;
    p = Math.max(basePrice * 0.8, Math.min(basePrice * 1.1, p));
    data.push({ time: `${30 - i}d`, price: parseFloat(p.toFixed(2)) });
  }
  return data;
}

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [period, setPeriod] = useState('1M');

  const asset = USER_ASSETS.find(a => a.id === assetId || a.symbol.toLowerCase() === assetId?.toLowerCase());
  const pair = CRYPTO_PAIRS.find(p => p.baseAsset === asset?.symbol);
  const assetTxs = TRANSACTIONS.filter(tx => tx.asset === asset?.symbol);
  const chartData = useMemo(() => generateAssetChart(pair?.price ?? 100), [pair?.price]);

  // Feature Flag: Check if DCA button should be shown
  const showDCAButton = useDCAAssetDetailButton();

  // Analytics: Track asset detail button
  const { trackAssetDetailButton } = useDCAAnalytics();

  // Funnel: Track asset to creation journey
  const {
    trackButtonImpression,
    trackButtonClick,
  } = useAssetToCreationFunnel();

  // Track button impression on mount (if shown)
  useEffect(() => {
    if (showDCAButton && asset) {
      trackButtonImpression();
      trackAssetDetailButton('impression', asset.symbol);
    }
  }, [showDCAButton, asset, trackButtonImpression, trackAssetDetailButton]);

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
        <div className="rounded-3xl p-5"
          style={{ background: `linear-gradient(135deg, ${asset.logoColor}15 0%, ${asset.logoColor}08 100%)`, border: `1px solid ${asset.logoColor}25` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: asset.logoColor + '22', border: `2px solid ${asset.logoColor}44` }}>
              <span style={{ color: asset.logoColor, fontSize: 14, fontWeight: 700 }}>{asset.symbol.slice(0, 3)}</span>
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
            <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 600 }}>
              {fmtPct(asset.change24h)}
            </span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Khả dụng</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{fmtAmount(asset.available)}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Trong lệnh</p>
              <p style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{fmtAmount(asset.inOrder)}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Đóng băng</p>
              <p style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{fmtAmount(asset.frozen)}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Giá hiện tại</p>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{pair ? fmtPrice(pair.price) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Nạp', icon: ArrowDownLeft, color: '#10B981', path: `${prefix}/wallet/deposit/${asset.symbol.toLowerCase()}` },
            { label: 'Rút', icon: ArrowUpRight, color: '#EF4444', path: `${prefix}/wallet/withdraw/${asset.symbol.toLowerCase()}` },
            { label: 'Chuyển', icon: ArrowDownUp, color: c.primary, path: `${prefix}/wallet/transfer` },
            ...(showDCAButton ? [{ label: 'DCA', icon: Repeat, color: '#8B5CF6', path: `${prefix}/dca`, isDCA: true, dcaCoin: asset.symbol }] : []),
          ].map(btn => (
            <TrCard key={btn.label} as="button" hover
              onClick={() => {
                hapticSelection();
                
                // Track DCA button click
                if ('isDCA' in btn && btn.isDCA) {
                  trackButtonClick();
                  trackAssetDetailButton('click', asset.symbol);
                }
                
                // DCA preselect via sessionStorage (avoids history pollution)
                if ('dcaCoin' in btn && btn.dcaCoin) {
                  sessionStorage.setItem('dca_preselect', btn.dcaCoin);
                }
                
                navigate(btn.path);
              }}
              className="flex flex-col items-center gap-1.5 py-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: btn.color + '15' }}>
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
                {['1W', '1M', '3M'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className="px-3 py-1 rounded-lg text-xs"
                    style={{
                      background: period === p ? c.chipActiveBg : 'transparent',
                      color: period === p ? c.chipActiveText : c.chipText,
                      fontWeight: 600,
                    }}>{p}</button>
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
                  contentStyle={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: c.text1 }}
                  formatter={(v: number) => [fmtUsd(v), 'Giá']}
                />
                <Area key="ad-area" type="monotone" dataKey="price" stroke={asset.logoColor} strokeWidth={2}
                  fill="url(#assetGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </TrCard>
        )}

        {/* Transaction history */}
        <div>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Lịch sử giao dịch</p>
          {assetTxs.length === 0 && (
            <TrCard className="py-8 text-center">
              <Clock size={32} color={c.text3} className="mx-auto mb-2" />
              <p style={{ color: c.text3, fontSize: 13 }}>Chưa có giao dịch nào</p>
            </TrCard>
          )}
          {assetTxs.map((tx, i) => {
            const isDeposit = tx.type === 'deposit' || tx.type === 'trade_buy' || tx.type === 'p2p_buy';
            return (
              <button key={tx.id} onClick={() => navigate(`${prefix}/wallet/transaction/${tx.id}`)}
                className="w-full flex items-center gap-3 py-3"
                style={{ borderBottom: i < assetTxs.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  {isDeposit ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}
                </div>
                <div className="flex-1 text-left">
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>
                    {tx.type === 'deposit' ? 'Nạp' : tx.type === 'withdraw' ? 'Rút' : tx.type === 'trade_buy' ? 'Mua' : tx.type === 'trade_sell' ? 'Bán' : tx.type === 'p2p_buy' ? 'P2P Mua' : 'P2P Bán'}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>{tx.createdAt.slice(0, 16)}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: isDeposit ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>
                    {isDeposit ? '+' : '-'}{fmtAmount(tx.amount)} {tx.asset}
                  </p>
                  <p style={{ color: tx.status === 'completed' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444', fontSize: 10 }}>
                    {tx.status === 'completed' ? 'Hoàn thành' : tx.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
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