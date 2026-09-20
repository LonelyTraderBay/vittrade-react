/**
 * ══════════════════════════════════════════════════════════════
 *  Launchpad — Shared Components (Phase 1 + Phase 2 + Phase 3)
 * ══════════════════════════════════════════════════════════════
 *  Phase 1: SubscribeSheet, SkeletonCard, EmptyState, CountdownTimer,
 *           EligibilityBanner, RiskDisclosure, CopyButton, ErrorState
 *  Phase 2: KYCGateSheet, VipAllocationCard, ClaimTokensSheet,
 *           RefundConfirmSheet
 *  Phase 3: WhitelistApplicationSheet, NotificationPrefsSheet,
 *           AdvancedFilterSheet, ShareReceiptCard
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtAmount } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  X, CheckCircle, AlertCircle, Clock, Shield, AlertTriangle,
  ChevronRight, Copy, Lock, Star, Unlock,
  ArrowRight, Award, Download, RefreshCw, Zap,
  Bell, Filter, SlidersHorizontal, Share2,
  Twitter, Send, Rocket, TrendingUp,
  Search,
} from 'lucide-react';
import type { LaunchProject, Subscription, VipTier, UserLaunchpadState, FilterCriteria, NotifPreference } from './launchpadData';
import {
  truncateAddress, getVipTier, VIP_TIERS, MOCK_USER,
  TYPE_LABELS, STATUS_LABELS, AVAILABLE_CHAINS, SORT_OPTIONS,
  DEFAULT_FILTER, DEFAULT_NOTIF_PREFS,
} from './launchpadData';

/* ─── Shared: Bottom Sheet Shell ─── */
function SheetShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2 sticky top-0 z-10" style={{ background: c.surface }}>
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: Checkbox helper ─── */
function Checkbox({ checked, onChange, color, label }: {
  checked: boolean; onChange: (v: boolean) => void; color: string; label: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <button onClick={() => onChange(!checked)} className="flex items-start gap-2 text-left">
      <div className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5"
        style={{
          borderColor: checked ? color : c.borderSolid,
          background: checked ? color : 'transparent',
          transition: 'all 150ms ease',
        }}>
        {checked && <CheckCircle size={13} color="#fff" />}
      </div>
      <span style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   CountdownTimer — live dd:hh:mm:ss
   ═══════════════════════════════════════════════════════════ */

export function CountdownTimer({ targetDate, label, color = '#F59E0B' }: {
  targetDate: string; label: string; color?: string;
}) {
  const c = useThemeColors();
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });

  const parse = useCallback(() => {
    const p = targetDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!p) return new Date();
    return new Date(+p[3], +p[2] - 1, +p[1], +p[4], +p[5]);
  }, [targetDate]);

  useEffect(() => {
    const tick = () => {
      const diff = parse().getTime() - Date.now();
      if (diff <= 0) { setRemaining({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [parse]);

  if (remaining.expired) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle size={14} color="#10B981" />
        <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Đã kết thúc</span>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const blocks = [
    { v: remaining.d, l: 'D' }, { v: remaining.h, l: 'H' },
    { v: remaining.m, l: 'M' }, { v: remaining.s, l: 'S' },
  ];

  return (
    <div>
      <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>{label}</p>
      <div className="flex gap-1.5">
        {blocks.map(b => (
          <div key={b.l} className="rounded-lg px-2 py-1 text-center" style={{
            background: `${color}12`, border: `1px solid ${color}25`, minWidth: 36,
          }}>
            <span style={{ color, fontSize: 16, fontWeight: 800, fontFamily: 'monospace' }}>{pad(b.v)}</span>
            <span style={{ color: c.text3, fontSize: 9, display: 'block' }}>{b.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EligibilityBanner — KYC / Whitelist / Restriction gate
   ═══════════════════════════════════════════════════════════ */

export function EligibilityBanner({ project, userKycLevel = MOCK_USER.kycLevel, userWhitelisted = false }: {
  project: LaunchProject; userKycLevel?: number; userWhitelisted?: boolean;
}) {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const issues: { icon: React.ReactNode; text: string; action: string; onClick?: () => void }[] = [];

  if (project.kyc && userKycLevel < project.kycLevel) {
    issues.push({
      icon: <Shield size={14} color="#F59E0B" />,
      text: `Yêu cầu KYC cấp ${project.kycLevel} — hiện tại bạn ở cấp ${userKycLevel}`,
      action: 'Hoàn tất KYC',
      onClick: () => navigate(`${prefix}/profile/kyc`),
    });
  }
  if (project.whitelist && !userWhitelisted) {
    issues.push({
      icon: <Lock size={14} color="#F59E0B" />,
      text: 'Yêu cầu Whitelist — bạn chưa được duyệt',
      action: 'Đăng ký Whitelist',
    });
  }
  if (project.restrictions.length > 0) {
    issues.push({
      icon: <AlertTriangle size={14} color="#EF4444" />,
      text: project.restrictions[0],
      action: '',
    });
  }

  if (issues.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}>
          {issue.icon}
          <span style={{ color: '#F59E0B', fontSize: 12, flex: 1 }}>{issue.text}</span>
          {issue.action && (
            <button onClick={issue.onClick} className="shrink-0 flex items-center gap-1"
              style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>
              {issue.action} <ChevronRight size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RiskDisclosure — expandable risk warnings
   ═══════════════════════════════════════════════════════════ */

export function RiskDisclosure() {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const risks = [
    'Token mới có thể mất giá sau listing — không đảm bảo lợi nhuận.',
    'Phân bổ theo tỷ lệ nếu oversubscribed — số thực tế có thể ít hơn đăng ký.',
    'Vesting lock — bạn không thể bán ngay 100% token sau TGE.',
    'Dự án có thể delay hoặc thất bại — nghiên cứu kỹ trước khi tham gia.',
    'Hiệu suất quá khứ của các dự án khác không đảm bảo kết quả tương lai.',
  ];
  return (
    <TrCard variant="inner" className="p-3">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-2">
        <AlertTriangle size={14} color="#F59E0B" />
        <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>
          Lưu ý rủi ro đầu tư
        </span>
        <ChevronRight size={14} color={c.text3}
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: expanded ? '1fr' : '0fr', transition: 'grid-template-rows 300ms ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <ul className="mt-2 flex flex-col gap-1.5">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: '#F59E0B', fontSize: 10, marginTop: 3 }}>●</span>
                <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 2: KYCGateSheet — Blocks subscribe when KYC insufficient
   ═══════════════════════════════════════════════════════════ */

export function KYCGateSheet({ project, userKycLevel, onClose }: {
  project: LaunchProject; userKycLevel: number; onClose: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Xác minh danh tính</h3>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      {/* Gate illustration */}
      <div className="flex flex-col items-center py-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'rgba(245,158,11,0.12)', border: '2px solid rgba(245,158,11,0.3)' }}>
          <Shield size={32} color="#F59E0B" />
        </div>
        <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Cần KYC Cấp {project.kycLevel} để tham gia
        </p>
        <p style={{ color: c.text2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
          Dự án {project.name} yêu cầu KYC cấp {project.kycLevel}. Hiện tại bạn đang ở cấp {userKycLevel}.
        </p>
      </div>

      {/* KYC level comparison */}
      <TrCard variant="inner" className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span style={{ color: c.text3, fontSize: 12 }}>Cấp hiện tại của bạn</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
            Cấp {userKycLevel}
          </span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span style={{ color: c.text3, fontSize: 12 }}>Cấp yêu cầu</span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            Cấp {project.kycLevel}
          </span>
        </div>
        {/* Steps to complete */}
        <div className="mt-2 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Để nâng cấp KYC:</p>
          {[
            'Chuẩn bị CMND/CCCD hoặc hộ chiếu còn hạn',
            'Chụp ảnh mặt trước và mặt sau rõ nét',
            'Chụp ảnh selfie với giấy tờ tùy thân',
            'Quá trình xác minh thường mất 5–15 phút',
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5">
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700, width: 14, shrink: 0 }}>{i + 1}.</span>
              <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{s}</span>
            </div>
          ))}
        </div>
      </TrCard>

      <CTAButton onClick={() => { onClose(); navigate(`${prefix}/profile/kyc`); }}>
        <Shield size={16} />
        Hoàn tất KYC Cấp {project.kycLevel}
      </CTAButton>

      <button onClick={onClose}
        className="w-full py-3 rounded-2xl flex items-center justify-center"
        style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 14, fontWeight: 600, borderRadius: 14 }}>
        Để sau
      </button>
    </SheetShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 2: VipAllocationCard — VIP tier benefits in subscribe
   ═══════════════════════════════════════════════════════════ */

export function VipAllocationCard({ userVipLevel, baseTokens, projectColor }: {
  userVipLevel: number; baseTokens: number; projectColor: string;
}) {
  const c = useThemeColors();
  const tier = getVipTier(userVipLevel);
  const boostedTokens = baseTokens * tier.allocationMultiplier;
  const bonusTokens = boostedTokens - baseTokens;

  if (tier.level === 0) return null;

  return (
    <div className="rounded-2xl p-3" style={{ background: `${tier.color}10`, border: `1px solid ${tier.color}25` }}>
      <div className="flex items-center gap-2 mb-2">
        <Award size={14} color={tier.color} />
        <span style={{ color: tier.color, fontSize: 12, fontWeight: 700 }}>
          {tier.badge} {tier.name} — Allocation x{tier.allocationMultiplier}
        </span>
      </div>
      <div className="flex justify-between">
        <span style={{ color: c.text3, fontSize: 11 }}>Phân bổ cơ sở</span>
        <span style={{ color: c.text2, fontSize: 11, fontFamily: 'monospace' }}>{fmtAmount(baseTokens, 0)}</span>
      </div>
      <div className="flex justify-between mt-1">
        <span style={{ color: tier.color, fontSize: 11, fontWeight: 600 }}>Bonus VIP x{tier.allocationMultiplier}</span>
        <span style={{ color: tier.color, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
          +{fmtAmount(bonusTokens, 0)}
        </span>
      </div>
      <div className="flex justify-between mt-1 pt-1.5" style={{ borderTop: `1px solid ${tier.color}20` }}>
        <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>Tổng dự kiến</span>
        <span style={{ color: '#10B981', fontSize: 12, fontWeight: 800, fontFamily: 'monospace' }}>
          {fmtAmount(boostedTokens, 0)}
        </span>
      </div>
      {tier.feeDiscount > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <Zap size={10} color={tier.color} />
          <span style={{ color: tier.color, fontSize: 10 }}>Giảm {tier.feeDiscount}% phí nền tảng</span>
        </div>
      )}
      {tier.priorityAccess && (
        <div className="flex items-center gap-1 mt-1">
          <Star size={10} color={tier.color} />
          <span style={{ color: tier.color, fontSize: 10 }}>Ưu tiên tham gia trước</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 2: VipTiersOverview — full tier table (for detail)
   ═══════════════════════════════════════════════════════════ */

export function VipTiersOverview({ currentLevel }: { currentLevel: number }) {
  const c = useThemeColors();
  return (
    <TrCard className="p-4">
      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
        <Award size={14} className="inline mr-1.5" color="#8B5CF6" />
        VIP Tier — Quyen loi Launchpad
      </p>
      <div className="flex flex-col gap-2">
        {VIP_TIERS.map(tier => {
          const isCurrent = tier.level === currentLevel;
          const isLocked = tier.level > currentLevel;
          return (
            <div key={tier.level} className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{
                background: isCurrent ? `${tier.color}12` : c.surface2,
                border: isCurrent ? `1.5px solid ${tier.color}40` : `1px solid transparent`,
                opacity: isLocked ? 0.6 : 1,
              }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
                style={{ background: `${tier.color}20`, color: tier.color, fontWeight: 800 }}>
                {tier.badge || tier.level}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{tier.name}</span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: tier.color, color: '#fff', fontSize: 9, fontWeight: 700 }}>
                      Ban
                    </span>
                  )}
                </div>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  x{tier.allocationMultiplier} allocation · Max x{tier.maxBuyMultiplier}
                </span>
              </div>
              <div className="text-right">
                <span style={{ color: tier.color, fontSize: 12, fontWeight: 700 }}>
                  {tier.feeDiscount > 0 ? `-${tier.feeDiscount}%` : '—'}
                </span>
                <span style={{ color: c.text3, fontSize: 9, display: 'block' }}>phi</span>
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ color: c.text3, fontSize: 10, marginTop: 8, lineHeight: 1.4 }}>
        VIP tier dựa trên tổng số dư và khối lượng giao dịch 30 ngày. Quyền lợi áp dụng tự động khi tham gia Launchpad.
      </p>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 2: ClaimTokensSheet — Claim unlocked vesting tokens
   ═══════════════════════════════════════════════════════════ */

export function ClaimTokensSheet({ sub, onClose, onSuccess }: {
  sub: Subscription; onClose: () => void; onSuccess: () => void;
}) {
  const c = useThemeColors();
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const claimableTokens = sub.tokensAllocated - sub.tokensClaimed;
  const claimablePercent = sub.tokensAllocated > 0
    ? Math.round(((sub.vestingProgress / 100) * sub.tokensAllocated - sub.tokensClaimed) / sub.tokensAllocated * 100)
    : 0;
  const actualClaimable = Math.max(0, Math.round((sub.vestingProgress / 100) * sub.tokensAllocated) - sub.tokensClaimed);

  const handleClaim = () => {
    if (!confirmed || actualClaimable <= 0) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 1500);
  };

  if (done) {
    return (
      <SheetShell onClose={() => { onClose(); onSuccess(); }}>
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Nhận thành công!</p>
          <p style={{ color: c.text2, fontSize: 13, textAlign: 'center' }}>
            {fmtAmount(actualClaimable, 0)} {sub.projectSymbol} đã được gửi vào ví của bạn.
          </p>
        </div>
        <CTAButton onClick={() => { onClose(); onSuccess(); }}>Đóng</CTAButton>
      </SheetShell>
    );
  }

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Nhận token</h3>
          <p style={{ color: c.text2, fontSize: 13 }}>{sub.projectName} ({sub.projectSymbol})</p>
        </div>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      {/* Vesting status */}
      <div className="rounded-2xl p-4 text-center" style={{ background: `${sub.projectLogoColor}11`, border: `1px solid ${sub.projectLogoColor}33` }}>
        <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Token sẵn sàng nhận</p>
        <p style={{ color: '#10B981', fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>
          {fmtAmount(actualClaimable, 0)}
        </p>
        <p style={{ color: c.text2, fontSize: 12, marginTop: 2 }}>{sub.projectSymbol}</p>
      </div>

      {/* Breakdown */}
      <TrCard variant="inner" className="p-4">
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Tổng phân bổ', value: `${fmtAmount(sub.tokensAllocated, 0)} ${sub.projectSymbol}` },
            { label: 'Đã mở khóa', value: `${sub.vestingProgress}%` },
            { label: 'Đã nhận trước đó', value: `${fmtAmount(sub.tokensClaimed, 0)} ${sub.projectSymbol}` },
            { label: 'Sẵn sàng nhận', value: `${fmtAmount(actualClaimable, 0)} ${sub.projectSymbol}`, highlight: true },
            { label: 'Mở khóa tiếp', value: sub.nextUnlockDate },
          ].map(r => (
            <div key={r.label} className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
              <span style={{
                color: (r as any).highlight ? '#10B981' : c.text1,
                fontSize: 12, fontWeight: (r as any).highlight ? 700 : 500, fontFamily: 'monospace',
              }}>{r.value}</span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Vesting bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span style={{ color: c.text3, fontSize: 11 }}>Tiến trình vesting</span>
          <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{sub.vestingProgress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderSolid }}>
          <div className="h-full rounded-full" style={{
            width: `${sub.vestingProgress}%`,
            background: `linear-gradient(90deg, ${sub.projectLogoColor}, ${sub.projectLogoColor}99)`,
          }} />
        </div>
      </div>

      {/* Confirm */}
      <Checkbox
        checked={confirmed}
        onChange={setConfirmed}
        color={sub.projectLogoColor}
        label="Tôi xác nhận muốn nhận token vào ví. Token sẽ chuyển ngay lập tức."
      />

      <CTAButton
        onClick={handleClaim}
        disabled={!confirmed || actualClaimable <= 0}
        loading={processing}
        bg={confirmed ? sub.projectLogoColor : undefined}
      >
        <Download size={16} />
        Nhan {fmtAmount(actualClaimable, 0)} {sub.projectSymbol}
      </CTAButton>

      {actualClaimable <= 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <Clock size={13} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontSize: 12 }}>
            Không có token sẵn sàng nhận. Lần mở khóa tiếp: {sub.nextUnlockDate}
          </span>
        </div>
      )}
    </SheetShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 2: RefundConfirmSheet — Claim refund for oversubscribed
   ═══════════════════════════════════════════════════════════ */

export function RefundConfirmSheet({ sub, onClose, onSuccess }: {
  sub: Subscription; onClose: () => void; onSuccess: () => void;
}) {
  const c = useThemeColors();
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleRefund = () => {
    if (!confirmed || sub.refundAmount <= 0) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 1500);
  };

  if (done) {
    return (
      <SheetShell onClose={() => { onClose(); onSuccess(); }}>
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Hoàn tiền thành công!</p>
          <p style={{ color: c.text2, fontSize: 13, textAlign: 'center' }}>
            ${fmtAmount(sub.refundAmount, 2)} USDT đã được hoàn vào ví của bạn.
          </p>
        </div>
        <CTAButton onClick={() => { onClose(); onSuccess(); }}>Đóng</CTAButton>
      </SheetShell>
    );
  }

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Nhận hoàn tiền</h3>
          <p style={{ color: c.text2, fontSize: 13 }}>{sub.projectName}</p>
        </div>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      {/* Refund amount */}
      <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>Số tiền hoàn lại</p>
        <p style={{ color: '#3B82F6', fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>
          ${fmtAmount(sub.refundAmount, 2)}
        </p>
        <p style={{ color: c.text2, fontSize: 12, marginTop: 2 }}>USDT</p>
      </div>

      {/* Explanation */}
      <TrCard variant="inner" className="p-4">
        <div className="flex flex-col gap-2.5">
          {[
            { label: 'Đã đăng ký', value: `${fmtAmount(sub.amount, 2)} USDT` },
            { label: 'Tỷ lệ phân bổ', value: `${Math.round(sub.allocationRatio * 100)}%` },
            { label: 'Thực tế phân bổ', value: `${fmtAmount(sub.amount * sub.allocationRatio, 2)} USDT` },
            { label: 'Hoàn lại', value: `${fmtAmount(sub.refundAmount, 2)} USDT`, highlight: true },
          ].map(r => (
            <div key={r.label} className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
              <span style={{
                color: (r as any).highlight ? '#3B82F6' : c.text1,
                fontSize: 12, fontWeight: (r as any).highlight ? 700 : 500, fontFamily: 'monospace',
              }}>{r.value}</span>
            </div>
          ))}
        </div>
      </TrCard>

      <div className="flex items-start gap-2 px-1">
        <AlertCircle size={13} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Số tiền hoàn do oversubscribed — tổng đăng ký vượt hard cap nên chỉ một phần USDT được phân bổ token. Phần còn lại được hoàn trả nguyên vẹn.
        </p>
      </div>

      <Checkbox
        checked={confirmed}
        onChange={setConfirmed}
        color="#3B82F6"
        label="Tôi xác nhận muốn nhận hoàn tiền vào ví USDT."
      />

      <CTAButton
        onClick={handleRefund}
        disabled={!confirmed || sub.refundAmount <= 0}
        loading={processing}
      >
        <RefreshCw size={16} />
        Nhận hoàn ${fmtAmount(sub.refundAmount, 2)} USDT
      </CTAButton>
    </SheetShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 3: WhitelistApplicationSheet — Apply for whitelist
   ═══════════════════════════════════════════════════════════ */

export function WhitelistApplicationSheet({ project, onClose, onSuccess }: {
  project: LaunchProject; onClose: () => void; onSuccess: () => void;
}) {
  const c = useThemeColors();
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = twitter.length > 2 && reason.length > 10;

  const handleApply = () => {
    if (!canSubmit) return;
    setProcessing(true);
    setTimeout(() => { setProcessing(false); setDone(true); }, 1500);
  };

  if (done) {
    return (
      <SheetShell onClose={() => { onClose(); onSuccess(); }}>
        <div className="flex flex-col items-center py-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle size={32} color="#10B981" />
          </div>
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Đăng ký thành công!</p>
          <p style={{ color: c.text2, fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
            Đơn đăng ký Whitelist đã được gửi. Bạn sẽ nhận thông báo khi được duyệt (thường 24–48h).
          </p>
        </div>
        <TrCard variant="inner" className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 11 }}>Dự án</span>
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{project.name}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: c.text3, fontSize: 11 }}>Trạng thái</span>
              <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>Đang chờ duyệt</span>
            </div>
          </div>
        </TrCard>
        <CTAButton onClick={() => { onClose(); onSuccess(); }}>Đóng</CTAButton>
      </SheetShell>
    );
  }

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Đăng ký Whitelist</h3>
          <p style={{ color: c.text2, fontSize: 13 }}>{project.name} ({project.symbol})</p>
        </div>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      <div className="rounded-2xl p-3 flex items-start gap-2.5"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <AlertCircle size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
          Whitelist giúp dự án chọn lọc người tham gia. Điền đầy đủ thông tin để tăng cơ hội được chấp nhận.
        </p>
      </div>

      <WlField label="Twitter handle" required c={c}>
        <WlInput placeholder="@username" value={twitter} onChange={setTwitter} c={c} color={project.logoColor} />
      </WlField>

      <WlField label="Telegram (tùy chọn)" c={c}>
        <WlInput placeholder="@username hoặc t.me/..." value={telegram} onChange={setTelegram} c={c} color={project.logoColor} />
      </WlField>

      <WlField label="Lý do muốn tham gia" required c={c}>
        <textarea placeholder="Tại sao bạn quan tâm đến dự án này? (ít nhất 10 ký tự)"
          value={reason} onChange={e => setReason(e.target.value.slice(0, 200))} rows={3}
          style={{
            background: c.surface2, border: `1.5px solid ${reason ? `${project.logoColor}44` : c.borderSolid}`,
            borderRadius: 14, padding: '12px 16px', color: c.text1, fontSize: 13,
            width: '100%', resize: 'none', outline: 'none', fontFamily: 'inherit',
          }} />
        <span style={{ color: c.text3, fontSize: 10, marginTop: 2, display: 'block' }}>{reason.length}/200</span>
      </WlField>

      <CTAButton onClick={handleApply} disabled={!canSubmit} loading={processing} bg={canSubmit ? project.logoColor : undefined}>
        <Star size={16} />
        Gửi đơn đăng ký Whitelist
      </CTAButton>
    </SheetShell>
  );
}

function WlField({ label, required, c, children }: { label: string; required?: boolean; c: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <label style={{ color: c.text2, fontSize: 13 }}>{label}</label>
        {required && <span style={{ color: '#EF4444', fontSize: 11 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function WlInput({ placeholder, value, onChange, c, color }: {
  placeholder: string; value: string; onChange: (v: string) => void; c: any; color: string;
}) {
  return (
    <div className="flex items-center px-4"
      style={{ background: c.surface2, border: `1.5px solid ${value ? `${color}44` : c.borderSolid}`, height: 48, borderRadius: 14 }}>
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 14, flex: 1 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 3: NotificationPrefsSheet — Per-project notifications
   ═══════════════════════════════════════════════════════════ */

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  rocket: <Rocket size={14} />, clock: <Clock size={14} />,
  'check-circle': <CheckCircle size={14} />, unlock: <Unlock size={14} />,
  bell: <Bell size={14} />, 'trending-up': <TrendingUp size={14} />,
};

export function NotificationPrefsSheet({ projectName, onClose }: {
  projectName: string; onClose: () => void;
}) {
  const c = useThemeColors();
  const [prefs, setPrefs] = useState(() => DEFAULT_NOTIF_PREFS.map(p => ({ ...p })));
  const [saved, setSaved] = useState(false);

  const toggle = (idx: number) => {
    setPrefs(prev => prev.map((p, i) => i === idx ? { ...p, enabled: !p.enabled } : p));
  };
  const enabledCount = prefs.filter(p => p.enabled).length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>Thông báo dự án</h3>
          <p style={{ color: c.text2, fontSize: 13 }}>{projectName}</p>
        </div>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      <div className="flex flex-col gap-1">
        {prefs.map((pref, idx) => (
          <button key={pref.type} onClick={() => toggle(idx)}
            className="flex items-center gap-3 p-3 rounded-xl w-full text-left"
            style={{
              background: pref.enabled ? 'rgba(59,130,246,0.06)' : 'transparent',
              border: `1px solid ${pref.enabled ? 'rgba(59,130,246,0.15)' : 'transparent'}`,
            }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: pref.enabled ? 'rgba(59,130,246,0.15)' : c.surface2, color: pref.enabled ? '#3B82F6' : c.text3 }}>
              {NOTIF_ICONS[pref.icon] || <Bell size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{pref.label}</p>
              <p style={{ color: c.text3, fontSize: 11 }}>{pref.description}</p>
            </div>
            <div className="w-11 h-6 rounded-full p-0.5 shrink-0"
              style={{ background: pref.enabled ? '#3B82F6' : c.borderSolid, transition: 'background 200ms' }}>
              <div className="w-5 h-5 rounded-full bg-white"
                style={{ transform: pref.enabled ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </button>
        ))}
      </div>

      <p style={{ color: c.text3, fontSize: 10, textAlign: 'center' }}>{enabledCount}/{prefs.length} thong bao dang bat</p>

      {saved ? (
        <div className="flex items-center justify-center gap-2 py-3">
          <CheckCircle size={16} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>Đã lưu!</span>
        </div>
      ) : (
        <CTAButton onClick={handleSave}><Bell size={16} />Lưu thiết lập thông báo</CTAButton>
      )}
    </SheetShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 3: AdvancedFilterSheet — Multi-criteria filter
   ═══════════════════════════════════════════════════════════ */

export function AdvancedFilterSheet({ filter, onApply, onClose }: {
  filter: FilterCriteria; onApply: (f: FilterCriteria) => void; onClose: () => void;
}) {
  const c = useThemeColors();
  const [f, setF] = useState<FilterCriteria>({ ...filter });

  const toggleArr = (key: 'types' | 'statuses' | 'chains', val: string) => {
    setF(prev => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  const activeCount = f.types.length + f.statuses.length + f.chains.length
    + (f.hasWhitelist !== null ? 1 : 0) + (f.auditPassed !== null ? 1 : 0)
    + (f.sortBy !== 'newest' ? 1 : 0);

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
          <SlidersHorizontal size={16} className="inline mr-2" />Bộ lọc nâng cao
        </h3>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 px-4"
        style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, height: 44, borderRadius: 14 }}>
        <Search size={16} color={c.text3} />
        <input type="text" placeholder="Tìm kiếm dự án, symbol, tag..."
          value={f.searchQuery} onChange={e => setF({ ...f, searchQuery: e.target.value })}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 13, flex: 1 }} />
        {f.searchQuery && <button onClick={() => setF({ ...f, searchQuery: '' })}><X size={14} color={c.text3} /></button>}
      </div>

      <FltSection label="Loại dự án" c={c}>
        {Object.entries(TYPE_LABELS).map(([k, { label, color }]) =>
          <FltChip key={k} label={label} active={f.types.includes(k)} color={color} onClick={() => toggleArr('types', k)} c={c} />
        )}
      </FltSection>

      <FltSection label="Trạng thái" c={c}>
        {Object.entries(STATUS_LABELS).map(([k, { label, color }]) =>
          <FltChip key={k} label={label} active={f.statuses.includes(k)} color={color} onClick={() => toggleArr('statuses', k)} c={c} />
        )}
      </FltSection>

      <FltSection label="Blockchain" c={c}>
        {AVAILABLE_CHAINS.map(ch =>
          <FltChip key={ch} label={ch} active={f.chains.includes(ch)} color="#8B5CF6" onClick={() => toggleArr('chains', ch)} c={c} />
        )}
      </FltSection>

      <FltSection label="Điều kiện" c={c}>
        <div className="flex flex-col gap-2 w-full">
          <FltBool label="Whitelist" value={f.hasWhitelist} onChange={v => setF({ ...f, hasWhitelist: v })} c={c} />
          <FltBool label="Audit passed" value={f.auditPassed} onChange={v => setF({ ...f, auditPassed: v })} c={c} />
        </div>
      </FltSection>

      <FltSection label="Sắp xếp theo" c={c}>
        {SORT_OPTIONS.map(opt =>
          <FltChip key={opt.key} label={opt.label} active={f.sortBy === opt.key} color="#3B82F6" onClick={() => setF({ ...f, sortBy: opt.key })} c={c} />
        )}
      </FltSection>

      <div className="flex gap-3">
        <button onClick={() => setF({ ...DEFAULT_FILTER, searchQuery: f.searchQuery })}
          className="flex-1 py-3 rounded-2xl flex items-center justify-center gap-1.5"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 13, fontWeight: 600, borderRadius: 14 }}>
          <RefreshCw size={14} />Xóa bộ lọc
        </button>
        <div className="flex-1">
          <CTAButton onClick={() => { onApply(f); onClose(); }}>
            <Filter size={14} />Áp dụng {activeCount > 0 ? `(${activeCount})` : ''}
          </CTAButton>
        </div>
      </div>
    </SheetShell>
  );
}

function FltSection({ label, c, children }: { label: string; c: any; children: React.ReactNode }) {
  return <div><p style={{ color: c.text2, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</p><div className="flex flex-wrap gap-1.5">{children}</div></div>;
}

function FltChip({ label, active, color, onClick, c }: { label: string; active: boolean; color: string; onClick: () => void; c: any }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: active ? `${color}18` : c.chipBg, color: active ? color : c.chipText, border: `1px solid ${active ? `${color}40` : c.chipBorder}` }}>
      {label}
    </button>
  );
}

function FltBool({ label, value, onChange, c }: { label: string; value: boolean | null; onChange: (v: boolean | null) => void; c: any }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: c.text2, fontSize: 12 }}>{label}</span>
      <div className="flex gap-1">
        {([{ v: null, l: 'Tất cả' }, { v: true, l: 'Có' }, { v: false, l: 'Không' }] as const).map(opt => (
          <button key={String(opt.v)} onClick={() => onChange(opt.v)}
            className="px-2.5 py-1 rounded-lg text-xs"
            style={{ background: value === opt.v ? 'rgba(59,130,246,0.15)' : c.surface2, color: value === opt.v ? '#3B82F6' : c.text3, fontWeight: value === opt.v ? 700 : 400, border: `1px solid ${value === opt.v ? 'rgba(59,130,246,0.3)' : 'transparent'}` }}>
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Phase 3: ShareReceiptCard — Social sharing for receipts
   ═══════════════════════════════════════════════════════════ */

export function ShareReceiptCard({ sub }: { sub: Subscription }) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);

  const shareText = `Tôi vừa đăng ký dự án ${sub.projectName} ($${sub.projectSymbol}) trên VitLaunch! ${fmtAmount(sub.tokensExpected, 0)} token dự kiến.`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/launchpad` : '';

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TrCard className="p-4">
      <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
        <Share2 size={14} className="inline mr-1.5" color="#8B5CF6" />Chia sẻ
      </p>

      {/* Preview card */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: `linear-gradient(135deg, ${sub.projectLogoColor}15 0%, ${sub.projectLogoColor}05 100%)`, border: `1px solid ${sub.projectLogoColor}25` }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
            style={{ background: sub.projectLogoColor + '22', color: sub.projectLogoColor, border: `1.5px solid ${sub.projectLogoColor}44` }}>
            {sub.projectLogo}
          </div>
          <div>
            <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{sub.projectName}</p>
            <p style={{ color: c.text3, fontSize: 10 }}>via VitLaunch</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-lg p-2" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 9 }}>Đăng ký</p>
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>${fmtAmount(sub.amount, 0)}</p>
          </div>
          <div className="flex-1 rounded-lg p-2" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 9 }}>Token dự kiến</p>
            <p style={{ color: '#10B981', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{fmtAmount(sub.tokensExpected, 0)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener')}
          className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          style={{ background: '#1DA1F2', color: '#fff', fontSize: 12, fontWeight: 600 }}>
          <Twitter size={14} />Twitter
        </button>
        <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')}
          className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          style={{ background: '#0088cc', color: '#fff', fontSize: 12, fontWeight: 600 }}>
          <Send size={14} />Telegram
        </button>
        <button onClick={handleCopyLink}
          className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 12, fontWeight: 600 }}>
          {copied ? <CheckCircle size={14} color="#10B981" /> : <Copy size={14} />}
          {copied ? 'Đã sao' : 'Copy'}
        </button>
      </div>

      <p style={{ color: c.text3, fontSize: 9, textAlign: 'center', marginTop: 8 }}>
        Chia sẻ không chứa thông tin tài chính. Hiệu suất quá khứ không đảm bảo kết quả tương lai.
      </p>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   SubscribeSheet — 2-step: Input → Review → Confirm
   (Enhanced Phase 2: VIP tier + KYC gate integration)
   ═══════════════════════════════════════════════════════════ */

export function SubscribeSheet({ project, onClose, onSuccess }: {
  project: LaunchProject; onClose: () => void; onSuccess: (sub: Omit<Subscription, 'id'>) => void;
}) {
  const c = useThemeColors();
  const user = MOCK_USER;
  const tier = getVipTier(user.vipLevel);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [amount, setAmount] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [riskAgreed, setRiskAgreed] = useState(false);

  const amountNum = parseFloat(amount || '0');
  const effectiveMaxBuy = Math.round(project.maxBuy * tier.maxBuyMultiplier);
  const tokensReceived = amountNum / project.price;
  const baseFee = amountNum * (project.platformFee / 100);
  const fee = baseFee * (1 - tier.feeDiscount / 100);
  const canProceed = amountNum >= project.minBuy && amountNum <= effectiveMaxBuy;
  const canConfirm = canProceed && agreed && riskAgreed;

  const estimatedRatio = project.progress >= 100
    ? Math.min(1, parseFloat(project.hardCap.replace(/[^0-9.]/g, '')) / project.subscribed)
    : 1;
  const estimatedTokens = tokensReceived * estimatedRatio;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onSuccess({
      projectId: project.id,
      projectName: project.name,
      projectSymbol: project.symbol,
      projectLogo: project.logo,
      projectLogoColor: project.logoColor,
      amount: amountNum,
      tokensExpected: Math.round(tokensReceived),
      tokensAllocated: 0,
      status: 'pending',
      allocationRatio: 0,
      timestamp: new Date().toLocaleString('vi-VN'),
      refundAmount: 0,
      vestingProgress: 0,
      tokensClaimed: 0,
      nextUnlockDate: project.listingDate,
      txHash: `0x${Math.random().toString(16).slice(2, 14)}`,
    });
  };

  return (
    <SheetShell onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 700 }}>
            {step === 'input' ? 'Đăng ký tham gia' : 'Xem lại đơn đăng ký'}
          </h3>
          <p style={{ color: c.text2, fontSize: 13 }}>{project.name} ({project.symbol})</p>
        </div>
        <button onClick={onClose} className="p-1"><X size={20} color={c.text2} /></button>
      </div>

      {step === 'input' ? (
        <>
          {/* Price info */}
          <div className="rounded-2xl p-4 text-center"
            style={{ background: `${project.logoColor}11`, border: `1px solid ${project.logoColor}33` }}>
            <p style={{ color: c.text3, fontSize: 12 }}>Giá token</p>
            <p style={{ color: project.logoColor, fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}>
              ${project.price} {project.priceUnit}
            </p>
            <div className="flex justify-center gap-4 mt-2">
              <p style={{ color: c.text2, fontSize: 12 }}>Min: ${project.minBuy}</p>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Max: ${effectiveMaxBuy}
                {tier.level > 0 && <span style={{ color: tier.color, fontSize: 10 }}> (VIP x{tier.maxBuyMultiplier})</span>}
              </p>
            </div>
          </div>

          {/* VIP allocation preview */}
          {tier.level > 0 && amountNum > 0 && canProceed && (
            <VipAllocationCard
              userVipLevel={user.vipLevel}
              baseTokens={tokensReceived}
              projectColor={project.logoColor}
            />
          )}

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ color: c.text2, fontSize: 13 }}>Số tiền ({project.priceUnit})</label>
              <span style={{ color: c.text3, fontSize: 11 }}>
                Số dư: {fmtAmount(user.usdtBalance, 2)} USDT
              </span>
            </div>
            <div className="flex items-center gap-3 px-4"
              style={{
                background: c.surface2,
                border: `1.5px solid ${amountNum > 0 && !canProceed ? '#EF4444' : `${project.logoColor}44`}`,
                height: 52, borderRadius: 14,
              }}>
              <input type="number" inputMode="decimal"
                placeholder={`${project.minBuy} – ${effectiveMaxBuy}`}
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: 16, flex: 1, fontFamily: 'monospace' }}
              />
              <span style={{ color: c.text2, fontSize: 13 }}>{project.priceUnit}</span>
            </div>
            {amountNum > 0 && amountNum < project.minBuy && (
              <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>Số tiền tối thiểu là ${project.minBuy}</p>
            )}
            {amountNum > effectiveMaxBuy && (
              <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>Số tiền tối đa là ${effectiveMaxBuy}</p>
            )}
            {amountNum > user.usdtBalance && (
              <p style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>Số dư không đủ</p>
            )}
          </div>

          {/* Preview */}
          {amountNum > 0 && canProceed && (
            <div className="rounded-2xl p-3 flex justify-between" style={{ background: c.surface2 }}>
              <span style={{ color: c.text2, fontSize: 13 }}>Dự kiến nhận</span>
              <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtAmount(tokensReceived, 0)} {project.symbol}
              </span>
            </div>
          )}

          {project.progress > 80 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={13} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 12 }}>
                Đã đăng ký {project.progress}% — Phân bổ theo tỷ lệ nếu vượt hard cap
              </span>
            </div>
          )}

          <CTAButton
            onClick={() => { if (canProceed) setStep('review'); }}
            disabled={!canProceed || amountNum > user.usdtBalance}
            bg={canProceed ? project.logoColor : undefined}
          >
            Xem lại đơn đăng ký
          </CTAButton>
        </>
      ) : (
        <>
          {/* Review summary */}
          <TrCard variant="inner" className="p-4">
            <div className="flex flex-col gap-3">
              {[
                { label: 'Dự án', value: `${project.name} (${project.symbol})` },
                { label: 'Loại', value: project.type.toUpperCase() },
                { label: 'Giá token', value: `$${project.price} ${project.priceUnit}`, mono: true },
                { label: 'Số tiền', value: `${fmtAmount(amountNum, 2)} ${project.priceUnit}`, mono: true, highlight: true },
                { label: 'Phí', value: fee > 0 ? `${fmtAmount(fee, 2)} ${project.priceUnit}` : 'Miễn phí', mono: true },
                ...(tier.level > 0 ? [{ label: 'VIP Tier', value: `${tier.badge} ${tier.name} (x${tier.allocationMultiplier})` }] : []),
                { label: 'Dự kiến nhận', value: `${fmtAmount(tokensReceived, 0)} ${project.symbol}`, mono: true, highlight: true },
                ...(project.progress > 80 ? [{
                  label: 'Ước tính phân bổ', mono: true,
                  value: `~${fmtAmount(estimatedTokens, 0)} ${project.symbol} (${Math.round(estimatedRatio * 100)}%)`,
                }] : []),
                { label: 'Vesting', value: `${project.vesting[0]?.percent || 0}% TGE` },
                { label: 'Chuỗi', value: project.chain },
                { label: 'Listing', value: project.listingDate },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start">
                  <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
                  <span style={{
                    color: (row as any).highlight ? c.text1 : c.text2,
                    fontSize: 12,
                    fontWeight: (row as any).highlight ? 700 : 400,
                    fontFamily: (row as any).mono ? 'monospace' : 'inherit',
                    textAlign: 'right', maxWidth: '60%',
                  }}>{row.value}</span>
                </div>
              ))}
            </div>
          </TrCard>

          <RiskDisclosure />

          <div className="flex flex-col gap-3">
            <Checkbox checked={agreed} onChange={setAgreed} color={project.logoColor}
              label={<>Tôi chấp nhận <span style={{ color: '#3B82F6' }}>điều khoản</span> và hiểu rủi ro.</>} />
            <Checkbox checked={riskAgreed} onChange={setRiskAgreed} color={project.logoColor}
              label="Tôi hiểu token có thể mất giá và vesting lock áp dụng." />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('input')} className="flex-1 rounded-2xl"
              style={{ height: 48, borderRadius: 14, background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}`, fontSize: 14, fontWeight: 600 }}>
              Quay lại
            </button>
            <div className="flex-1">
              <CTAButton onClick={handleConfirm} disabled={!canConfirm}
                bg={canConfirm ? project.logoColor : undefined} style={{ height: 48 }}>
                Xác nhận đăng ký
              </CTAButton>
            </div>
          </div>
        </>
      )}
    </SheetShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   SkeletonCard / EmptyState / ErrorState / CopyButton
   ═══════════════════════════════════════════════════════════ */

export function SkeletonCard() {
  const c = useThemeColors();
  const shimmer = {
    background: `linear-gradient(90deg, ${c.surface2} 25%, ${c.border} 50%, ${c.surface2} 75%)`,
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite',
  };
  return (
    <TrCard>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl" style={shimmer} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 rounded-lg w-3/4" style={shimmer} />
            <div className="h-3 rounded-lg w-1/2" style={shimmer} />
          </div>
        </div>
        <div className="h-3 rounded-lg w-full mb-2" style={shimmer} />
        <div className="h-3 rounded-lg w-5/6 mb-3" style={shimmer} />
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="rounded-xl h-14" style={shimmer} />)}
        </div>
        <div className="h-10 rounded-2xl" style={shimmer} />
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </TrCard>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description: string; action?: { label: string; onClick: () => void };
}) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</p>
      <p style={{ color: c.text3, fontSize: 13, lineHeight: 1.5, maxWidth: 260 }}>{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 px-6 py-2.5 rounded-xl"
          style={{ background: c.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>{action.label}</button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.1)' }}>
        <AlertCircle size={24} color="#EF4444" />
      </div>
      <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Không tải được dữ liệu</p>
      <p style={{ color: c.text3, fontSize: 13, lineHeight: 1.5, maxWidth: 260 }}>Vui lòng kiểm tra kết nối mạng và thử lại.</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 px-6 py-2.5 rounded-xl"
          style={{ background: c.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>Thử lại</button>
      )}
    </div>
  );
}

export function CopyButton({ text, display }: { text: string; display?: string }) {
  const c = useThemeColors();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5">
      <span style={{ color: c.text2, fontSize: 12, fontFamily: 'monospace' }}>{display || truncateAddress(text)}</span>
      {copied ? <CheckCircle size={12} color="#10B981" /> : <Copy size={12} color={c.text3} />}
    </button>
  );
}