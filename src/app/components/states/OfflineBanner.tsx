import React from 'react';
import { WifiOff, Clock, Wifi } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface OfflineBannerProps {
  /** "warn" = yellow, "error" = red, "info" = blue */
  variant?: 'warn' | 'error' | 'info';
  message?: string;
  showStaleHint?: boolean;
  /** Hiển thị trạng thái đang kết nối lại */
  isReconnecting?: boolean;
}

const VARIANT_STYLES = {
  warn: {
    bg: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.2)',
    color: '#F59E0B',
    iconColor: '#F59E0B',
  },
  error: {
    bg: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#EF4444',
    iconColor: '#EF4444',
  },
  info: {
    bg: 'rgba(59,130,246,0.08)',
    border: '1px solid rgba(59,130,246,0.2)',
    color: '#3B82F6',
    iconColor: '#3B82F6',
  },
};

export function OfflineBanner({
  variant = 'warn',
  message = 'Mất kết nối. Đang hiển thị dữ liệu gần nhất.',
  showStaleHint = false,
  isReconnecting = false,
}: OfflineBannerProps) {
  const c = useThemeColors();
  const s = isReconnecting ? VARIANT_STYLES['info'] : VARIANT_STYLES[variant];

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 mx-5 rounded-2xl"
      style={{ background: s.bg, border: s.border }}
    >
      {isReconnecting ? (
        <Wifi size={16} color={s.iconColor} className="shrink-0 animate-pulse" />
      ) : (
        <WifiOff size={16} color={s.iconColor} className="shrink-0" />
      )}
      <div className="flex-1">
        <p style={{ color: s.color, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
          {isReconnecting ? 'Đang kết nối lại...' : message}
        </p>
        {showStaleHint && !isReconnecting && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={10} color={c.text3} />
            <p style={{ color: c.text3, fontSize: 11 }}>
              Cập nhật lần cuối: 2 phút trước
            </p>
          </div>
        )}
        {isReconnecting && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.iconColor, animation: 'pulse 1.4s infinite 0s' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.iconColor, animation: 'pulse 1.4s infinite 0.2s' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.iconColor, animation: 'pulse 1.4s infinite 0.4s' }} />
            </div>
            <p style={{ color: c.text3, fontSize: 11 }}>
              Tự động thử lại sau vài giây
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Generic Banner (info / warn / error) ─── */
interface BannerProps {
  variant: 'info' | 'warn' | 'error';
  icon?: React.ReactNode;
  message: string;
  /** Optional secondary text */
  detail?: string;
  className?: string;
}

export function Banner({ variant, icon, message, detail, className }: BannerProps) {
  const c = useThemeColors();
  const s = VARIANT_STYLES[variant];
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-2.5 rounded-2xl ${className ?? ''}`}
      style={{ background: s.bg, border: s.border }}
    >
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1">
        <p style={{ color: s.color, fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
          {message}
        </p>
        {detail && (
          <p style={{ color: c.text3, fontSize: 11, marginTop: 2 }}>
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}