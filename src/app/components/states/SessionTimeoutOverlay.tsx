import React from 'react';
import { Clock, Shield, RefreshCw } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════
 *  SessionTimeoutOverlay — Warning banner + timed-out modal
 * ══════════════════════════════════════════════════════════
 *
 *  Shows:
 *  1. Warning bar (60s countdown) before timeout
 *  2. Full-screen modal when session expires
 *
 *  Wire with useSessionTimeout in AppLayout.
 */

/* ─── Warning Bar (countdown) ─── */
interface SessionWarningBarProps {
  remainingSeconds: number;
  onExtend: () => void;
}

export function SessionWarningBar({ remainingSeconds, onExtend }: SessionWarningBarProps) {
  const c = useThemeColors();

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 animate-fade-in-up"
      style={{
        height: 44,
        background: 'rgba(245,158,11,0.12)',
        borderBottom: '1px solid rgba(245,158,11,0.25)',
      }}
    >
      <div className="flex items-center gap-2">
        <Clock size={14} color="#F59E0B" strokeWidth={2.2} />
        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>
          Phiên sẽ hết hạn trong {remainingSeconds}s
        </span>
      </div>
      <button
        onClick={onExtend}
        className="flex items-center gap-1 px-3 py-1 rounded-lg active:opacity-70"
        style={{
          background: 'rgba(245,158,11,0.15)',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        <RefreshCw size={11} color="#F59E0B" strokeWidth={2.5} />
        <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700 }}>
          Gia hạn
        </span>
      </button>
    </div>
  );
}

/* ─── Timed Out Modal ─── */
interface SessionTimedOutModalProps {
  open: boolean;
  onReauth: () => void;
}

export function SessionTimedOutModal({ open, onReauth }: SessionTimedOutModalProps) {
  const c = useThemeColors();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="w-full rounded-3xl p-6 flex flex-col items-center gap-5 animate-fade-in-up"
        style={{
          maxWidth: 360,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <Shield size={28} color="#F59E0B" />
        </div>

        {/* Text */}
        <div className="text-center">
          <p style={{ color: c.text1, fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Phiên đã hết thời gian
          </p>
          <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
            Vì lý do bảo mật, phiên làm việc đã tạm khóa sau thời gian không hoạt động. Xác thực lại để tiếp tục.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onReauth}
          className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold ripple"
          style={{
            height: 52,
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: φ.base,
            boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
          }}
        >
          <Shield size={18} />
          Xác thực lại
        </button>

        <p style={{ color: c.text3, fontSize: φ.xs, textAlign: 'center' }}>
          Dữ liệu và tài sản của bạn vẫn an toàn
        </p>
      </div>
    </div>
  );
}
