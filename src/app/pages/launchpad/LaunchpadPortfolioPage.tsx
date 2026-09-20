/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadPortfolioPage — My Participations (Phase 1)
 * ══════════════════════════════════════════════════════════════
 *  Pattern B — Page with Tabs
 *  Shows user's launchpad subscriptions, allocation status,
 *  vesting progress, and claim actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Briefcase, ChevronRight, Clock, CheckCircle, AlertCircle,
  Download, Rocket, Lock, Unlock,
} from 'lucide-react';
import { MOCK_SUBSCRIPTIONS, SUB_STATUS_LABELS, type Subscription } from './launchpadData';
import { SkeletonCard, EmptyState, ClaimTokensSheet, RefundConfirmSheet } from './LaunchpadComponents';

const PORTFOLIO_TABS = ['Tất cả', 'Đang chờ', 'Đã phân bổ', 'Đã nhận'] as const;
type PortfolioTab = typeof PORTFOLIO_TABS[number];

const TAB_FILTER: Record<PortfolioTab, string[] | null> = {
  'Tất cả': null,
  'Đang chờ': ['pending'],
  'Đã phân bổ': ['allocated', 'partially_allocated'],
  'Đã nhận': ['claimed', 'refunded'],
};

export function LaunchpadPortfolioPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [tab, setTab] = useState<PortfolioTab>('Tất cả');
  const [loading, setLoading] = useState(true);
  const [claimSub, setClaimSub] = useState<Subscription | null>(null);
  const [refundSub, setRefundSub] = useState<Subscription | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const statusFilter = TAB_FILTER[tab];
  const filtered = statusFilter
    ? MOCK_SUBSCRIPTIONS.filter(s => statusFilter.includes(s.status))
    : MOCK_SUBSCRIPTIONS;

  // Summary stats
  const totalInvested = MOCK_SUBSCRIPTIONS.reduce((s, sub) => s + sub.amount, 0);
  const totalAllocated = MOCK_SUBSCRIPTIONS.filter(s =>
    ['allocated', 'partially_allocated', 'claimed'].includes(s.status)
  ).length;
  const totalPending = MOCK_SUBSCRIPTIONS.filter(s => s.status === 'pending').length;

  return (
    <PageLayout>
      {claimSub && (
        <ClaimTokensSheet
          sub={claimSub}
          onClose={() => setClaimSub(null)}
          onSuccess={() => setClaimSub(null)}
        />
      )}
      {refundSub && (
        <RefundConfirmSheet
          sub={refundSub}
          onClose={() => setRefundSub(null)}
          onSuccess={() => setRefundSub(null)}
        />
      )}
      <Header title="Launchpad Portfolio" subtitle="Các dự án đã tham gia" back />

      <PageContent gap="default">
        {/* Summary card */}
        <TrCard variant="hero" className="p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 65%)' }} />

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(59,130,246,0.2)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}>
              <Briefcase size={22} color="#60A5FA" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tổng đã đầu tư</p>
              <p style={{ color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: 'monospace' }}>
                ${fmtAmount(totalInvested, 2)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            {[
              { label: 'Dự án', value: MOCK_SUBSCRIPTIONS.length.toString(), color: '#60A5FA' },
              { label: 'Đã phân bổ', value: totalAllocated.toString(), color: '#10B981' },
              { label: 'Đang chờ', value: totalPending.toString(), color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-xl p-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ color: s.color, fontSize: 16, fontWeight: 800 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Tabs */}
        <TabBar variant="pill" tabs={PORTFOLIO_TABS} active={tab} onChange={setTab} />

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={40} color={c.text3} />}
            title="Chưa có dự án nào"
            description={tab !== 'Tất cả'
              ? 'Không có dự án nào trong mục này.'
              : 'Bạn chưa tham gia dự án Launchpad nào. Khám phá ngay!'}
            action={{ label: 'Khám phá Launchpad', onClick: () => navigate(`${prefix}/launchpad`) }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(sub => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onClaim={() => setClaimSub(sub)}
                onRefund={() => setRefundSub(sub)}
              />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 px-1">
          <AlertCircle size={13} color={c.text3} className="shrink-0 mt-0.5" />
          <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
            Phân bổ thực tế phụ thuộc vào tổng số đăng ký. Token mở khóa theo lịch vesting của từng dự án.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   SubscriptionCard — individual participation entry
   ═══════════════════════════════════════════════════════════ */

function SubscriptionCard({ sub, onClaim, onRefund }: { sub: Subscription; onClaim: () => void; onRefund: () => void }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const statusInfo = SUB_STATUS_LABELS[sub.status] || SUB_STATUS_LABELS.pending;

  const vestingPercent = sub.vestingProgress;
  const hasClaimable = sub.status === 'allocated' || sub.status === 'partially_allocated';

  return (
    <TrCard hover>
      <button
        className="w-full text-left p-4"
        onClick={() => navigate(`${prefix}/launchpad/receipt/${sub.id}`, { state: { subscription: sub } })}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: sub.projectLogoColor + '22',
              border: `1.5px solid ${sub.projectLogoColor}44`,
              color: sub.projectLogoColor,
            }}>
            {sub.projectLogo}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{sub.projectName}</p>
            <p style={{ color: c.text3, fontSize: 11 }}>{sub.timestamp}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="px-2 py-0.5 rounded-md text-xs font-bold"
              style={{ background: `${statusInfo.color}15`, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10 }}>Đã đầu tư</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              ${fmtAmount(sub.amount, 2)}
            </p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 10 }}>Token phân bổ</p>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              {sub.tokensAllocated > 0 ? fmtAmount(sub.tokensAllocated, 0) : '—'} {sub.projectSymbol}
            </p>
          </div>
        </div>

        {/* Allocation ratio */}
        {sub.allocationRatio > 0 && sub.allocationRatio < 1 && (
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={12} color="#F59E0B" />
            <span style={{ color: '#F59E0B', fontSize: 11 }}>
              Phân bổ {Math.round(sub.allocationRatio * 100)}% — Hoàn lại: ${fmtAmount(sub.refundAmount, 2)}
            </span>
          </div>
        )}

        {/* Vesting progress */}
        {sub.tokensAllocated > 0 && (
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span style={{ color: c.text3, fontSize: 11 }}>Vesting</span>
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                {fmtAmount(sub.tokensClaimed, 0)} / {fmtAmount(sub.tokensAllocated, 0)} {sub.projectSymbol}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
              <div className="h-full rounded-full" style={{
                width: `${vestingPercent}%`,
                background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: c.text3, fontSize: 10 }}>{vestingPercent}% đã mở khóa</span>
              <span style={{ color: c.text3, fontSize: 10 }}>
                <Clock size={10} className="inline mr-0.5" />
                Tiếp theo: {sub.nextUnlockDate}
              </span>
            </div>
          </div>
        )}

        {/* Claim CTA */}
        {hasClaimable && (
          <button
            onClick={(e) => { e.stopPropagation(); onClaim(); }}
            className="flex items-center gap-2 mt-2 p-2.5 rounded-xl w-full text-left"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <Unlock size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600, flex: 1 }}>
              Có token sẵn sàng nhận
            </span>
            <ChevronRight size={14} color="#10B981" />
          </button>
        )}

        {/* Refund CTA */}
        {sub.refundAmount > 0 && sub.status === 'partially_allocated' && (
          <button
            onClick={(e) => { e.stopPropagation(); onRefund(); }}
            className="flex items-center gap-2 mt-2 p-2.5 rounded-xl w-full text-left"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
            <Download size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600, flex: 1 }}>
              Nhận hoàn ${fmtAmount(sub.refundAmount, 2)} USDT
            </span>
            <ChevronRight size={14} color="#3B82F6" />
          </button>
        )}
      </button>
    </TrCard>
  );
}