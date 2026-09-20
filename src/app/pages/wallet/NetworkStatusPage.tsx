/**
 * ══════════════════════════════════════════════════════════════
 *  NetworkStatusPage — P3: Blockchain Network Health Monitor
 * ══════════════════════════════════════════════════════════════
 *  Shows real-time status of supported blockchain networks:
 *  congestion level, estimated confirmation time, gas/fee
 *  estimates, and deposit/withdraw availability.
 *  Pattern A — Standard Page
 *  Compliance: §16.4 Charts, §7.4 Feedback
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { φ, φIcon } from '../../utils/golden';
import {
  Wifi, WifiOff, AlertTriangle, CheckCircle, Clock,
  Zap, TrendingUp, RefreshCw, Activity, ChevronRight,
} from 'lucide-react';

type NetworkHealth = 'operational' | 'degraded' | 'congested' | 'down';

interface NetworkInfo {
  id: string;
  name: string;
  symbol: string;
  color: string;
  health: NetworkHealth;
  blockHeight: number;
  lastBlock: string;
  avgConfirmTime: string;
  txPending: number;
  gasFee: string;
  congestionPct: number;
  depositEnabled: boolean;
  withdrawEnabled: boolean;
  notes?: string;
}

const HEALTH_CONFIG: Record<NetworkHealth, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  operational: { label: 'Hoạt động tốt', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  degraded: { label: 'Chậm', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle },
  congested: { label: 'Tắc nghẽn', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertTriangle },
  down: { label: 'Bảo trì', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: WifiOff },
};

const MOCK_NETWORKS: NetworkInfo[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    color: '#F7931A',
    health: 'operational',
    blockHeight: 886543,
    lastBlock: '2 phút trước',
    avgConfirmTime: '~30 phút',
    txPending: 4521,
    gasFee: '12 sat/vB',
    congestionPct: 25,
    depositEnabled: true,
    withdrawEnabled: true,
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    health: 'operational',
    blockHeight: 19847231,
    lastBlock: '12 giây trước',
    avgConfirmTime: '~5 phút',
    txPending: 142350,
    gasFee: '28 Gwei',
    congestionPct: 42,
    depositEnabled: true,
    withdrawEnabled: true,
  },
  {
    id: 'trc20',
    name: 'TRON (TRC20)',
    symbol: 'TRX',
    color: '#FF0013',
    health: 'operational',
    blockHeight: 61234567,
    lastBlock: '3 giây trước',
    avgConfirmTime: '~3 phút',
    txPending: 8920,
    gasFee: '27 TRX',
    congestionPct: 15,
    depositEnabled: true,
    withdrawEnabled: true,
  },
  {
    id: 'bsc',
    name: 'BNB Chain (BEP20)',
    symbol: 'BNB',
    color: '#F3BA2F',
    health: 'degraded',
    blockHeight: 38912456,
    lastBlock: '6 giây trước',
    avgConfirmTime: '~8 phút',
    txPending: 52100,
    gasFee: '5 Gwei',
    congestionPct: 65,
    depositEnabled: true,
    withdrawEnabled: true,
    notes: 'Xác nhận chậm hơn bình thường do lưu lượng cao',
  },
  {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    color: '#9945FF',
    health: 'operational',
    blockHeight: 245678901,
    lastBlock: '400ms trước',
    avgConfirmTime: '~1 giây',
    txPending: 890,
    gasFee: '0.000005 SOL',
    congestionPct: 8,
    depositEnabled: true,
    withdrawEnabled: true,
  },
  {
    id: 'xrp',
    name: 'Ripple',
    symbol: 'XRP',
    color: '#23292F',
    health: 'operational',
    blockHeight: 87654321,
    lastBlock: '4 giây trước',
    avgConfirmTime: '~5 giây',
    txPending: 245,
    gasFee: '0.00001 XRP',
    congestionPct: 3,
    depositEnabled: true,
    withdrawEnabled: true,
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    color: '#8247E5',
    health: 'down',
    blockHeight: 56789012,
    lastBlock: '3 giờ trước',
    avgConfirmTime: 'N/A',
    txPending: 0,
    gasFee: 'N/A',
    congestionPct: 0,
    depositEnabled: false,
    withdrawEnabled: false,
    notes: 'Đang bảo trì hệ thống. Dự kiến hoàn tất: 15:00 UTC',
  },
];

function CongestionBar({ pct, color }: { pct: number; color: string }) {
  const c = useThemeColors();
  const barColor = pct > 70 ? '#EF4444' : pct > 40 ? '#F59E0B' : '#10B981';
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: c.surface2 }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(pct, 3)}%`, background: barColor }} />
    </div>
  );
}

export function NetworkStatusPage() {
  const c = useThemeColors();
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  // Simulate live block height updates
  const [networks, setNetworks] = useState(MOCK_NETWORKS);
  useEffect(() => {
    const timer = setInterval(() => {
      setNetworks(prev => prev.map(n => ({
        ...n,
        blockHeight: n.health !== 'down' ? n.blockHeight + Math.floor(Math.random() * 3) : n.blockHeight,
        txPending: n.health !== 'down' ? Math.max(0, n.txPending + Math.floor((Math.random() - 0.5) * 200)) : 0,
        congestionPct: n.health !== 'down'
          ? Math.max(0, Math.min(100, n.congestionPct + Math.floor((Math.random() - 0.5) * 5)))
          : 0,
      })));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const operationalCount = networks.filter(n => n.health === 'operational').length;
  const degradedCount = networks.filter(n => n.health === 'degraded' || n.health === 'congested').length;
  const downCount = networks.filter(n => n.health === 'down').length;

  return (
    <PageLayout>
      <Header title="Trạng thái mạng" back />

      <PageContent gap="default">
        {/* Global status summary */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: downCount > 0 ? 'rgba(239,68,68,0.15)' : degradedCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
              }}>
              {downCount > 0
                ? <AlertTriangle size={22} color="#EF4444" />
                : degradedCount > 0
                  ? <AlertTriangle size={22} color="#F59E0B" />
                  : <Wifi size={22} color="#10B981" />
              }
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                {downCount > 0
                  ? `${downCount} mạng đang bảo trì`
                  : degradedCount > 0
                    ? `${degradedCount} mạng đang chậm`
                    : 'Tất cả mạng hoạt động tốt'
                }
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                Cập nhật tự động mỗi 4 giây
              </p>
            </div>
            <button onClick={() => refresh()} className="p-2 rounded-xl" style={{ background: c.hoverBg }}>
              <RefreshCw size={16} color={c.text2} />
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Hoạt động', value: operationalCount, color: '#10B981' },
              { label: 'Chậm / Tắc', value: degradedCount, color: '#F59E0B' },
              { label: 'Bảo trì', value: downCount, color: '#EF4444' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center"
                style={{ background: c.portfolioBtnGhost }}>
                <p style={{ color: s.color, fontSize: 18, fontWeight: 700 }}>{s.value}</p>
                <p style={{ color: c.portfolioTextMuted, fontSize: 9 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Network cards */}
        <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
          <div className="flex flex-col gap-3">
            {networks.map(net => {
              const hcfg = HEALTH_CONFIG[net.health];
              const HealthIcon = hcfg.icon;

              return (
                <TrCard key={net.id} className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: `${net.color}18` }}>
                      <span style={{ color: net.color, fontSize: 11, fontWeight: 700 }}>{net.symbol}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{net.name}</span>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: hcfg.bg, color: hcfg.color, fontSize: 9, fontWeight: 700 }}>
                          {hcfg.label}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: 10 }}>Block #{net.blockHeight.toLocaleString()}</p>
                    </div>
                    <HealthIcon size={18} color={hcfg.color} />
                  </div>

                  {/* Congestion bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span style={{ color: c.text3, fontSize: 10 }}>Mức tải mạng</span>
                      <span style={{
                        color: net.congestionPct > 70 ? '#EF4444' : net.congestionPct > 40 ? '#F59E0B' : '#10B981',
                        fontSize: 10, fontWeight: 600,
                      }}>
                        {net.congestionPct}%
                      </span>
                    </div>
                    <CongestionBar pct={net.congestionPct} color={net.color} />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { icon: Clock, label: 'Xác nhận', value: net.avgConfirmTime },
                      { icon: Activity, label: 'TX đang chờ', value: net.txPending.toLocaleString() },
                      { icon: Zap, label: 'Gas / Phí', value: net.gasFee },
                      { icon: TrendingUp, label: 'Block mới', value: net.lastBlock },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-2 rounded-xl px-2.5 py-2"
                        style={{ background: c.surface2 }}>
                        <stat.icon size={12} color={c.text3} />
                        <div className="flex-1 min-w-0">
                          <p style={{ color: c.text3, fontSize: 9 }}>{stat.label}</p>
                          <p className="truncate" style={{ color: c.text1, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deposit / Withdraw availability */}
                  <div className="flex gap-2">
                    {[
                      { label: 'Nạp', enabled: net.depositEnabled },
                      { label: 'Rút', enabled: net.withdrawEnabled },
                    ].map(action => (
                      <div key={action.label} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl"
                        style={{
                          background: action.enabled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${action.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                        {action.enabled
                          ? <CheckCircle size={11} color="#10B981" />
                          : <WifiOff size={11} color="#EF4444" />
                        }
                        <span style={{
                          color: action.enabled ? '#10B981' : '#EF4444',
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {action.label} {action.enabled ? 'OK' : 'Tạm dừng'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {net.notes && (
                    <div className="flex items-start gap-2 mt-2.5 rounded-xl px-3 py-2"
                      style={{ background: 'rgba(245,158,11,0.06)' }}>
                      <AlertTriangle size={11} color="#F59E0B" className="shrink-0 mt-0.5" />
                      <p style={{ color: '#D97706', fontSize: 10, lineHeight: 1.5 }}>{net.notes}</p>
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PullToRefresh>

        {/* Legend */}
        <TrCard className="p-4">
          <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Chú thích trạng thái</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(HEALTH_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: cfg.bg }}>
                    <Icon size={10} color={cfg.color} />
                  </div>
                  <span style={{ color: c.text2, fontSize: 11 }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: c.primaryAlpha08, border: `1px solid ${c.primaryAlpha15}` }}>
          <AlertTriangle size={13} color={c.primary} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
            Dữ liệu trạng thái mạng được cập nhật tự động. Thời gian xác nhận thực tế có thể khác
            tùy thuộc vào phí gas và mức tải mạng tại thời điểm giao dịch.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}