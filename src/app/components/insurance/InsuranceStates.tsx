import React from 'react';
import { WifiOff, AlertCircle, FileX, Loader } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';

/* ═══════════════════════════════════════════════════════════
   Insurance Fund — Loading, Error, Empty, Offline States (TIER 3.3)
   ═══════════════════════════════════════════════════════════ */

/* ─── Skeleton Components ─── */

export function FundStatsSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 rounded animate-pulse" style={{ background: c.surface2 }} />
        <div className="h-4 w-32 rounded animate-pulse" style={{ background: c.surface2 }} />
      </div>

      <div className="grid grid-cols-2" style={{ gap: φSpace[4] }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-3 w-20 rounded mb-2 animate-pulse" style={{ background: c.surface2 }} />
            <div className="h-7 w-24 rounded animate-pulse" style={{ background: c.surface2 }} />
          </div>
        ))}
      </div>
    </TrCard>
  );
}

export function ChartSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded animate-pulse" style={{ background: c.surface2 }} />
        <div className="h-4 w-40 rounded animate-pulse" style={{ background: c.surface2 }} />
      </div>
      <div className="h-64 rounded-xl animate-pulse" style={{ background: c.surface2 }} />
    </TrCard>
  );
}

export function ClaimCardSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 rounded animate-pulse" style={{ background: c.surface2 }} />
        <div className="h-5 w-20 rounded-full animate-pulse" style={{ background: c.surface2 }} />
      </div>
      <div className="h-3 w-32 rounded mb-2 animate-pulse" style={{ background: c.surface2 }} />
      <div className="h-6 w-28 rounded animate-pulse" style={{ background: c.surface2 }} />
    </TrCard>
  );
}

export function ClaimsListSkeleton() {
  return (
    <div className="flex flex-col" style={{ gap: φSpace[3] }}>
      {[1, 2, 3, 4].map(i => <ClaimCardSkeleton key={i} />)}
    </div>
  );
}

/* ─── Error State ─── */

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ title = 'Đã có lỗi', message, onRetry, retryLabel = 'Thử lại' }: ErrorStateProps) {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-6">
      <div className="flex flex-col items-center text-center" style={{ gap: φSpace[3] }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.08)' }}
        >
          <AlertCircle size={28} color="#EF4444" />
        </div>
        
        <div>
          <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 8 }}>
            {title}
          </p>
          <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {onRetry && (
          <CTAButton
            variant="secondary"
            onClick={onRetry}
            className="mt-2"
          >
            {retryLabel}
          </CTAButton>
        )}
      </div>
    </TrCard>
  );
}

/* ─── Offline State ─── */

interface OfflineStateProps {
  onRetry?: () => void;
}

export function OfflineState({ onRetry }: OfflineStateProps) {
  const c = useThemeColors();
  
  return (
    <div
      className="p-3 rounded-xl flex items-center gap-3"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      <WifiOff size={20} color="#EF4444" className="shrink-0" />
      <div className="flex-1">
        <p style={{ color: '#DC2626', fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
          Không có kết nối mạng
        </p>
        <p style={{ color: '#DC2626', fontSize: 11, lineHeight: 1.5, opacity: 0.8 }}>
          Kiểm tra kết nối và thử lại
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            color: '#EF4444',
            fontSize: φ.sm,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.12)',
          }}
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

/* ─── Empty States ─── */

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-8">
      <div className="flex flex-col items-center text-center" style={{ gap: φSpace[3] }}>
        {icon ? (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: c.surface2 }}
          >
            {icon}
          </div>
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: c.surface2 }}
          >
            <FileX size={32} color={c.text3} />
          </div>
        )}
        
        <div>
          <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginBottom: 8 }}>
            {title}
          </p>
          {description && (
            <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5 }}>
              {description}
            </p>
          )}
        </div>

        {action && (
          <CTAButton
            variant="primary"
            onClick={action.onClick}
            className="mt-2"
          >
            {action.label}
          </CTAButton>
        )}
      </div>
    </TrCard>
  );
}

/* ─── Loading Spinner ─── */

export function LoadingSpinner({ text = 'Đang tải...' }: { text?: string }) {
  const c = useThemeColors();
  
  return (
    <div className="flex flex-col items-center justify-center py-12" style={{ gap: φSpace[3] }}>
      <Loader size={32} color="#3B82F6" className="animate-spin" />
      <p style={{ color: c.text2, fontSize: φ.sm }}>
        {text}
      </p>
    </div>
  );
}

/* ─── Claim Expiry Warning Banner (TIER 3.2) ─── */

interface ClaimExpiryWarningProps {
  expiryDate: string; // ISO date string
  daysRemaining: number;
}

export function ClaimExpiryWarning({ expiryDate, daysRemaining }: ClaimExpiryWarningProps) {
  const c = useThemeColors();
  
  const isUrgent = daysRemaining <= 2;
  const color = isUrgent ? '#EF4444' : '#F59E0B';
  const bgColor = isUrgent ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';
  const borderColor = isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)';
  
  const formatExpiryDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  return (
    <div
      className="p-3 rounded-xl flex items-start gap-2"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <AlertCircle size={16} color={color} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <p style={{ color, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
          {isUrgent ? 'Claim sắp hết hạn!' : 'Lưu ý thời hạn claim'}
        </p>
        <p style={{ color, fontSize: 11, lineHeight: 1.5, opacity: 0.9, marginTop: 2 }}>
          Còn {daysRemaining} ngày để bổ sung tài liệu (hết hạn {formatExpiryDate(expiryDate)})
        </p>
      </div>
    </div>
  );
}
