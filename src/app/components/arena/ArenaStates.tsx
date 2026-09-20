/**
 * ══════════════════════════════════════════════════════════
 *  Arena UI States Kit
 * ══════════════════════════════════════════════════════════
 *  Section 4 of 06E: Loading, Empty, Error, Offline/Stale,
 *  Draft, Under Review, Reported, Hidden
 *  
 *  Reusable across all Arena pages:
 *  ArenaHomePage, ArenaStudioPage, ArenaModeDetailPage,
 *  ArenaChallengeDetailPage, ArenaLeaderboardPage, MyArenaPage
 */

import React from 'react';
import {
  AlertTriangle, WifiOff, FileEdit, Shield, Flag,
  EyeOff, RefreshCw, Zap, Trophy, Sparkles,
  Clock, Search,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { OfflineBanner } from '../states/OfflineBanner';
import { SkeletonCard, SkeletonRow } from '../states/SkeletonBlock';
import { TrCard } from '../ui/TrCard';
import { φ } from '../../utils/golden';

/* ═══════════════════════════════════════════
   Arena Loading Skeleton
   ═══════════════════════════════════════════ */

interface ArenaSkeletonProps {
  /** Skeleton variant */
  variant?: 'home' | 'detail' | 'list' | 'studio';
}

export function ArenaLoadingSkeleton({ variant = 'list' }: ArenaSkeletonProps) {
  if (variant === 'home') {
    return (
      <div className="flex flex-col gap-4 px-5 pt-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }
  if (variant === 'detail') {
    return (
      <div className="flex flex-col gap-4 px-5 pt-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }
  if (variant === 'studio') {
    return (
      <div className="flex flex-col gap-4 px-5 pt-4">
        <SkeletonCard />
        <SkeletonRow /><SkeletonRow />
        <SkeletonCard />
      </div>
    );
  }
  // list
  return (
    <div className="flex flex-col gap-0 pt-2">
      <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Arena Empty States
   ═══════════════════════════════════════════ */

interface ArenaEmptyProps {
  onCta?: () => void;
}

export function ArenaEmptyRooms({ onCta }: ArenaEmptyProps) {
  return <EmptyState icon={Zap} title="Chưa có phòng nào" subtitle="Tạo challenge mới hoặc khám phá phòng đang mở" ctaLabel="Tạo challenge" onCta={onCta} />;
}

export function ArenaEmptyJoined({ onCta }: ArenaEmptyProps) {
  return <EmptyState icon={Trophy} title="Chưa tham gia challenge nào" subtitle="Khám phá các challenge đang mở và bắt đầu chơi" ctaLabel="Khám phá" onCta={onCta} />;
}

export function ArenaEmptySavedModes({ onCta }: ArenaEmptyProps) {
  return <EmptyState icon={Sparkles} title="Chưa lưu mode nào" subtitle="Lưu các mode yêu thích để dùng nhanh sau này" ctaLabel="Khám phá modes" onCta={onCta} />;
}

export function ArenaEmptyDrafts({ onCta }: ArenaEmptyProps) {
  return <EmptyState icon={FileEdit} title="Không có bản nháp" subtitle="Bản nháp challenge chưa hoàn thành sẽ hiển thị ở đây" ctaLabel="Tạo mới" onCta={onCta} />;
}

export function ArenaEmptyHistory() {
  return <EmptyState icon={Clock} title="Chưa có lịch sử" subtitle="Hoàn thành challenge để xem lịch sử ở đây" />;
}

export function ArenaEmptySearch() {
  return <EmptyState icon={Search} title="Không tìm thấy" subtitle="Thử từ khoá khác hoặc xoá bộ lọc" />;
}

/* ═══════════════════════════════════════════
   Arena Error State
   ═══════════════════════════════════════════ */

export function ArenaErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Có lỗi xảy ra"
      message="Không thể tải dữ liệu Arena. Vui lòng thử lại hoặc kiểm tra kết nối."
      actionLabel="Thử lại"
      onAction={onRetry}
    />
  );
}

/* ═══════════════════════════════════════════
   Arena Offline / Stale State
   ═══════════════════════════════════════════ */

export function ArenaOfflineBanner({ isReconnecting }: { isReconnecting?: boolean }) {
  return (
    <div className="px-5 mt-2 mb-3">
      <OfflineBanner
        variant="warn"
        message="Mất kết nối. Dữ liệu Arena có thể chưa cập nhật."
        showStaleHint
        isReconnecting={isReconnecting}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   Arena Content State Banners
   (Draft, Under Review, Reported, Hidden)
   ═══════════════════════════════════════════ */

export function ArenaDraftBanner({ className }: { className?: string }) {
  const c = useThemeColors();
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(148,163,184,0.3)">
      <FileEdit size={14} color="#94A3B8" className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>Bản nháp</p>
        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
          Challenge chưa được xuất bản. Chỉ bạn mới nhìn thấy.
        </p>
      </div>
    </TrCard>
  );
}

export function ArenaUnderReviewBanner({ className }: { className?: string }) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(245,158,11,0.25)">
      <Shield size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>Đang xem xét</p>
        <p style={{ color: '#F59E0B', fontSize: φ.xs, lineHeight: 1.5, opacity: 0.8 }}>
          Nội dung đang được đội ngũ kiểm duyệt xem xét. Kết quả có thể bị tạm giữ.
        </p>
      </div>
    </TrCard>
  );
}

export function ArenaReportedBanner({ className }: { className?: string }) {
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(239,68,68,0.25)">
      <Flag size={14} color="#EF4444" className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p style={{ color: '#EF4444', fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>Đã bị báo cáo</p>
        <p style={{ color: '#EF4444', fontSize: φ.xs, lineHeight: 1.5, opacity: 0.8 }}>
          Nội dung đã nhận báo cáo vi phạm. Đội ngũ sẽ xem xét trong 24h.
        </p>
      </div>
    </TrCard>
  );
}

export function ArenaHiddenBanner({ className }: { className?: string }) {
  const c = useThemeColors();
  return (
    <TrCard className={`p-3 flex items-start gap-2.5 ${className ?? ''}`}
      accentBorder="rgba(148,163,184,0.3)">
      <EyeOff size={14} color="#94A3B8" className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, marginBottom: 2 }}>Đã ẩn</p>
        <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5 }}>
          Nội dung này đã bị ẩn bởi đội ngũ kiểm duyệt do vi phạm quy tắc cộng đồng.
        </p>
      </div>
    </TrCard>
  );
}
