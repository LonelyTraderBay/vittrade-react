import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle, CheckCircle2, Info, Shield, Clock,
  ChevronRight, Users, Lock,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { EmptyState } from '../../components/states/EmptyState';
import { SkeletonCard } from '../../components/states/SkeletonBlock';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import {
  getChallengeById, getRoomById, fmtPoints, MY_ARENA_STATS,
  privacyLabel, roomStatusLabel,
} from '../../data/arenaData';

/* ═══════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════ */

function JoinSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Checkbox Component (≥44pt tap target)
   ═══════════════════════════════════════════ */

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  const c = useThemeColors();
  return (
    <button
      onClick={onChange}
      className="flex items-start gap-3 w-full text-left active:opacity-70"
      style={{ minHeight: 44 }}
    >
      <div
        className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center"
        style={{
          background: checked ? '#8B5CF6' : 'transparent',
          border: checked ? '2px solid #8B5CF6' : `2px solid ${c.borderSolid}`,
        }}
      >
        {checked && <CheckCircle2 size={14} color="#fff" />}
      </div>
      <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════
   ArenaJoinPage
   ═══════════════════════════════════════════ */

export function ArenaJoinPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { hapticSelection } = useHaptic();
  const { isLoading, refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 300 });

  const [readRules, setReadRules] = useState(false);
  const [understandPoints, setUnderstandPoints] = useState(false);
  const [guess, setGuess] = useState('');

  const challenge = getChallengeById(challengeId || '');
  const room = !challenge ? getRoomById(challengeId || '') : null;

  if (!challenge && !room) {
    return (
      <PageLayout>
        <Header title="Tham gia" subtitle="Thử thách · Open Arena" back />
        <EmptyState icon={AlertTriangle} title="Không tìm thấy" subtitle="Challenge không tồn tại hoặc đã bị xoá" />
      </PageLayout>
    );
  }

  const entryPoints = challenge?.entryPoints ?? room?.entryPoints ?? 0;
  const title = challenge?.title ?? room?.title ?? '';
  const format = challenge?.format ?? room?.format ?? '';
  const privacy = challenge?.privacy ?? room?.privacy ?? 'public';
  const modeName = challenge?.modeName ?? room?.format ?? '';
  const endAt = challenge?.endAt ?? room?.endsAt ?? '';
  const creatorName = challenge?.creator.name ?? room?.creator.name ?? '';
  const creatorAvatar = challenge?.creator.avatar ?? room?.creator.avatar ?? '';
  const rules = challenge?.rules ?? ['Luật do người tạo quy định', 'Entry points bị trừ khi tham gia'];
  const slotsTotal = challenge?.slotsTotal ?? room?.slotsTotal ?? 0;
  const slotsFilled = challenge?.slotsFilled ?? room?.slotsFilled ?? 0;

  const pr = privacyLabel(privacy);
  const balance = MY_ARENA_STATS.currentBalance;
  const hasEnough = balance >= entryPoints;
  const allConfirmed = readRules && understandPoints;
  const isClosestGuess = format === 'Closest Guess';
  const canJoin = hasEnough && allConfirmed && (!isClosestGuess || !!guess);

  // Time left
  const endDate = endAt ? new Date(endAt) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const handleJoin = () => {
    hapticSelection();
    actionToast.success(TOAST.ARENA.CHALLENGE_JOINED);
    navigate(`${prefix}/arena/challenge/${challengeId}`, { replace: true });
  };

  const handleDecline = () => {
    hapticSelection();
    actionToast.success(TOAST.ARENA.CHALLENGE_DECLINED);
    navigate(-1);
  };

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <Header title="Tham gia challenge" subtitle="Đăng ký · Open Arena" back />

      {isLoading ? <JoinSkeleton /> : (
        <PageContent gap="default">

          {/* ─── Challenge Summary ─── */}
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 4 }}>{title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>{modeName}</span>
              <span style={{ color: c.text3, fontSize: φ.xs }}>·</span>
              <span style={{ color: c.text3, fontSize: φ.xs }}>{format}</span>
            </div>
          </TrCard>

          {/* ─── Room Info ─── */}
          <TrCard className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Quyền riêng tư</span>
                <span className="flex items-center gap-1" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {pr.icon} {pr.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Người tham gia</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {slotsFilled}/{slotsTotal}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Kết thúc</span>
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                </span>
              </div>
            </div>
          </TrCard>

          {/* ─── Creator / Host Info ─── */}
          <TrCard className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: c.surface2, fontSize: 20 }}>
              {creatorAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }}>{creatorName}</p>
              <p style={{ color: c.text3, fontSize: φ.xs }}>Người tạo challenge</p>
            </div>
          </TrCard>

          {/* ─── Rule Summary ─── */}
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, marginBottom: 8 }}>Tóm tắt luật</p>
            <div className="flex flex-col gap-2">
              {rules.slice(0, 4).map((rule, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                  <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>{rule}</span>
                </div>
              ))}
              {rules.length > 4 && (
                <p style={{ color: c.text3, fontSize: φ.xs }}>+{rules.length - 4} luật khác</p>
              )}
            </div>
          </TrCard>

          {/* ─── Balance / Entry Points Breakdown ─── */}
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: c.text2, fontSize: φ.sm }}>Số dư Arena Points</span>
              <span style={{ color: hasEnough ? '#10B981' : '#EF4444', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(balance)} pts
              </span>
            </div>
            <div className="flex items-center justify-between mb-3" style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
              <span style={{ color: c.text2, fontSize: φ.sm }}>Entry Points</span>
              <span style={{ color: '#F59E0B', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                -{fmtPoints(entryPoints)} pts
              </span>
            </div>
            <div className="flex items-center justify-between" style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Sau khi tham gia</span>
              <span style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(balance - entryPoints)} pts
              </span>
            </div>
          </TrCard>

          {/* ─── Input (for Closest Guess format) ─── */}
          {isClosestGuess && (
            <TrCard className="p-4">
              <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600, marginBottom: 8 }}>
                Nhập dự đoán của bạn
              </p>
              <input
                type="number"
                value={guess}
                onChange={e => setGuess(e.target.value)}
                placeholder="VD: 68500"
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.searchBg, border: `1.5px solid ${c.searchBorder}`,
                  color: c.text1, fontSize: φ.base, fontFamily: 'monospace',
                  outline: 'none', minHeight: 48,
                }}
              />
              <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 4 }}>
                Giá BTC/USDT bạn dự đoán
              </p>
            </TrCard>
          )}

          {/* ─── Insufficient Balance Warning ─── */}
          {!hasEnough && (
            <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(239,68,68,0.3)">
              <AlertTriangle size={14} color="#EF4444" className="shrink-0 mt-0.5" />
              <p style={{ color: '#EF4444', fontSize: φ.xs, lineHeight: 1.5 }}>
                Số dư không đủ. Bạn cần thêm {fmtPoints(entryPoints - balance)} Arena Points.
              </p>
            </TrCard>
          )}

          {/* ─── Disclaimer ─── */}
          <TrCard className="p-3 flex items-start gap-2">
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
              Entry points sẽ bị trừ ngay khi tham gia. Nếu hủy trước deadline, bạn được hoàn 50%. Arena Points không có giá trị tiền tệ.
            </p>
          </TrCard>

          {/* ─── Void/Cancel Policy Link ─── */}
          <button
            onClick={() => { navigate(`${prefix}/arena/safety`); hapticSelection(); }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
            style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 600, minHeight: 36 }}
          >
            <Shield size={12} />
            Xem chính sách hủy/void
            <ChevronRight size={10} />
          </button>

          {/* ─── Checkbox Acknowledgements ─── */}
          <div className="flex flex-col gap-2">
            <Checkbox
              checked={readRules}
              onChange={() => { setReadRules(!readRules); hapticSelection(); }}
              label="Tôi đã đọc luật chơi và hiểu các điều kiện của challenge này"
            />
            <Checkbox
              checked={understandPoints}
              onChange={() => { setUnderstandPoints(!understandPoints); hapticSelection(); }}
              label="Tôi hiểu đây là Arena Points — không phải tài sản tài chính và không thể rút ra ngoài"
            />
          </div>

          {/* ─── CTAs ─── */}
          <div className="flex flex-col gap-3 mt-2">
            <CTAButton
              onClick={handleJoin}
              disabled={!canJoin}
            >
              Xác nhận tham gia · {fmtPoints(entryPoints)} pts
            </CTAButton>

            <button
              onClick={handleDecline}
              className="w-full py-3.5 rounded-2xl active:opacity-70"
              style={{
                background: c.chipBg, border: `1.5px solid ${c.chipBorder}`,
                color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 44,
              }}
            >
              Từ chối
            </button>
          </div>

        </PageContent>
      )}
    </PullToRefresh>
  );
}