/**
 * ══════════════════════════════════════════════════════════════
 *  PendingDepositsPage — P1: Deposit Confirmation Tracker
 * ══════════════════════════════════════════════════════════════
 *  Shows pending/incoming deposits with blockchain confirmation
 *  progress bars, estimated arrival, and live status updates.
 *  Pattern A — Standard Page
 *  Compliance: §8.4 Wallet, §7.4 Feedback
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { fmtAmount } from '../../data/formatNumber';
import { φ, φIcon } from '../../utils/golden';
import {
  Clock, CheckCircle, AlertTriangle, RefreshCw,
  ArrowDownLeft, ExternalLink, Inbox, Copy, Check,
} from 'lucide-react';

interface PendingDeposit {
  id: string;
  asset: string;
  amount: number;
  network: string;
  txHash: string;
  confirmations: number;
  requiredConfirmations: number;
  status: 'confirming' | 'processing' | 'credited' | 'failed';
  createdAt: string;
  estimatedArrival: string;
  fromAddress: string;
}

const MOCK_PENDING: PendingDeposit[] = [
  {
    id: 'pd001',
    asset: 'USDT',
    amount: 5000,
    network: 'TRC20',
    txHash: '0xa1b2c3d4e5f6...789abc',
    confirmations: 1,
    requiredConfirmations: 1,
    status: 'credited',
    createdAt: '11/03/2026 14:32',
    estimatedArrival: 'Đã xong',
    fromAddress: 'TQnK...Xyz12',
  },
  {
    id: 'pd002',
    asset: 'BTC',
    amount: 0.05,
    network: 'Bitcoin',
    txHash: 'bc1q...f8a2d3',
    confirmations: 1,
    requiredConfirmations: 2,
    status: 'confirming',
    createdAt: '11/03/2026 13:15',
    estimatedArrival: '~15 phút',
    fromAddress: 'bc1q...sW8k',
  },
  {
    id: 'pd003',
    asset: 'ETH',
    amount: 1.2,
    network: 'ERC20',
    txHash: '0x7e8f9a0b1c2d...e3f456',
    confirmations: 5,
    requiredConfirmations: 12,
    status: 'confirming',
    createdAt: '11/03/2026 12:40',
    estimatedArrival: '~7 phút',
    fromAddress: '0x742d...C29f',
  },
  {
    id: 'pd004',
    asset: 'USDT',
    amount: 200,
    network: 'ERC20',
    txHash: '0xdead...beef',
    confirmations: 0,
    requiredConfirmations: 12,
    status: 'failed',
    createdAt: '10/03/2026 09:00',
    estimatedArrival: 'Thất bại',
    fromAddress: '0x123...456',
  },
];

const STATUS_CONFIG = {
  confirming: { label: 'Đang xác nhận', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  processing: { label: 'Đang xử lý', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  credited: { label: 'Đã ghi nhận', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  failed: { label: 'Thất bại', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

function CopyHash({ text }: { text: string }) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg"
      style={{ background: c.hoverBg }}
    >
      {copied ? <Check size={11} color={c.success} /> : <Copy size={11} color={c.text3} />}
      <span style={{ color: copied ? c.success : c.text3, fontSize: 10 }}>{copied ? 'Đã chép' : 'Copy'}</span>
    </button>
  );
}

export function PendingDepositsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  // Simulate live confirmations incrementing
  const [deposits, setDeposits] = useState(MOCK_PENDING);
  useEffect(() => {
    const timer = setInterval(() => {
      setDeposits(prev => prev.map(d => {
        if (d.status === 'confirming' && d.confirmations < d.requiredConfirmations) {
          const newConf = Math.min(d.confirmations + 1, d.requiredConfirmations);
          return {
            ...d,
            confirmations: newConf,
            status: newConf >= d.requiredConfirmations ? 'credited' as const : 'confirming' as const,
            estimatedArrival: newConf >= d.requiredConfirmations ? 'Đã xong' : d.estimatedArrival,
          };
        }
        return d;
      }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const filtered = deposits.filter(d => {
    if (filter === 'pending') return d.status === 'confirming' || d.status === 'processing';
    if (filter === 'done') return d.status === 'credited' || d.status === 'failed';
    return true;
  });

  const pendingCount = deposits.filter(d => d.status === 'confirming' || d.status === 'processing').length;

  return (
    <PageLayout>
      <Header title="Nạp tiền đang chờ" back />

      <PageContent gap="default">
        {/* Summary banner */}
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: pendingCount > 0 ? c.warnAlpha15 : c.buyAlpha15 }}>
              {pendingCount > 0
                ? <Clock size={22} color={c.warn} />
                : <CheckCircle size={22} color={c.success} />
              }
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                {pendingCount > 0 ? `${pendingCount} giao dịch đang chờ xác nhận` : 'Tất cả nạp tiền đã hoàn tất'}
              </p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                {pendingCount > 0 ? 'Trang tự động cập nhật mỗi 5 giây' : 'Không có giao dịch nào đang chờ'}
              </p>
            </div>
            <button onClick={() => refresh()} className="p-2 rounded-xl" style={{ background: c.hoverBg }}>
              <RefreshCw size={16} color={c.text2} />
            </button>
          </div>
        </TrCard>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {([
            { id: 'all' as const, label: 'Tất cả' },
            { id: 'pending' as const, label: `Đang chờ (${pendingCount})` },
            { id: 'done' as const, label: 'Hoàn tất' },
          ]).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-xl"
              style={{
                background: filter === f.id ? c.chipActiveBg : c.chipBg,
                color: filter === f.id ? c.chipActiveText : c.chipText,
                border: `1px solid ${filter === f.id ? c.chipActiveBorder : c.chipBorder}`,
                fontSize: φ.xs,
                fontWeight: 600,
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Deposit cards */}
        <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
          <div className="flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                  <Inbox size={32} color={c.text3} />
                </div>
                <p style={{ color: c.text3, fontSize: φ.sm }}>Không có giao dịch nạp nào</p>
              </div>
            ) : filtered.map(dep => {
              const cfg = STATUS_CONFIG[dep.status];
              const progress = dep.requiredConfirmations > 0
                ? (dep.confirmations / dep.requiredConfirmations) * 100
                : 0;

              return (
                <TrCard key={dep.id} className="p-4">
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                      style={{ background: cfg.bg }}>
                      <ArrowDownLeft size={20} color={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                          Nạp {dep.asset}
                        </span>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700 }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.xs }}>{dep.createdAt}</p>
                    </div>
                    <span style={{
                      color: c.text1,
                      fontSize: φ.body,
                      fontWeight: 700,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
                    }}>
                      +{fmtAmount(dep.amount)}
                    </span>
                  </div>

                  {/* Confirmation progress bar */}
                  {(dep.status === 'confirming' || dep.status === 'processing') && (
                    <div className="mb-3">
                      <div className="flex justify-between mb-1.5">
                        <span style={{ color: c.text2, fontSize: 11 }}>Xác nhận blockchain</span>
                        <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700 }}>
                          {dep.confirmations}/{dep.requiredConfirmations}
                        </span>
                      </div>
                      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: c.surface2 }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(progress, 5)}%`,
                            background: progress >= 100
                              ? '#10B981'
                              : `linear-gradient(90deg, ${cfg.color}, ${cfg.color}CC)`,
                          }}
                        />
                      </div>
                      {/* Step indicators */}
                      <div className="flex justify-between mt-1">
                        {Array.from({ length: Math.min(dep.requiredConfirmations, 12) }).map((_, i) => {
                          const blockIdx = dep.requiredConfirmations > 12
                            ? Math.round((i / 11) * (dep.requiredConfirmations - 1))
                            : i;
                          const done = dep.confirmations > blockIdx;
                          return (
                            <div key={i} className="w-1.5 h-1.5 rounded-full"
                              style={{ background: done ? cfg.color : c.surface2 }} />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Credited checkmark */}
                  {dep.status === 'credited' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                      style={{ background: c.buyAlpha10 }}>
                      <CheckCircle size={14} color={c.success} />
                      <span style={{ color: c.success, fontSize: 12, fontWeight: 600 }}>
                        Đã ghi nhận vào ví — {dep.confirmations}/{dep.requiredConfirmations} xác nhận
                      </span>
                    </div>
                  )}

                  {/* Failed warning */}
                  {dep.status === 'failed' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                      style={{ background: c.sellAlpha10 }}>
                      <AlertTriangle size={14} color={c.error} />
                      <span style={{ color: c.error, fontSize: 12, fontWeight: 600 }}>
                        Giao dịch thất bại — liên hệ hỗ trợ nếu đã gửi tiền
                      </span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5" style={{ background: c.surface2 }}>
                    {[
                      { label: 'Mạng', value: dep.network },
                      { label: 'Thời gian dự kiến', value: dep.estimatedArrival },
                      { label: 'Từ địa chỉ', value: dep.fromAddress },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span style={{ color: c.text3, fontSize: 11 }}>{row.label}</span>
                        <span style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center">
                      <span style={{ color: c.text3, fontSize: 11 }}>TxHash</span>
                      <div className="flex items-center gap-1">
                        <span style={{ color: c.primary, fontSize: 11, fontFamily: 'monospace' }}>{dep.txHash}</span>
                        <CopyHash text={dep.txHash} />
                      </div>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>
        </PullToRefresh>

        {/* Info */}
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <AlertTriangle size={14} color={c.primary} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
            Số xác nhận cần thiết phụ thuộc vào mạng blockchain. Nạp dưới mức tối thiểu sẽ không được ghi nhận.
            Liên hệ hỗ trợ nếu giao dịch chưa xuất hiện sau 1 giờ.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}