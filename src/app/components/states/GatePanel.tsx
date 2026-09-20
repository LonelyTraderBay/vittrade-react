import React from 'react';
import { ShieldCheck, KeyRound, LogIn, Lock } from 'lucide-react';
import { hexToRgba } from '../../utils/helpers/string';

type GateType = 'kyc' | '2fa' | 'session' | 'custom';

interface GatePanelProps {
  type: GateType;
  /** Override title */
  title?: string;
  /** Override subtitle */
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const GATE_CONFIG: Record<GateType, {
  icon: typeof ShieldCheck;
  title: string;
  subtitle: string;
  ctaLabel: string;
  color: string;
}> = {
  kyc: {
    icon: ShieldCheck,
    title: 'Cần xác minh danh tính',
    subtitle: 'Bạn cần hoàn tất KYC để sử dụng tính năng này. Quy trình xác minh chỉ mất vài phút.',
    ctaLabel: 'Đi tới KYC',
    color: '#F59E0B',
  },
  '2fa': {
    icon: KeyRound,
    title: 'Bật xác thực 2 lớp (2FA)',
    subtitle: 'Tính năng này yêu cầu 2FA để bảo vệ tài khoản. Hãy thiết lập 2FA trước khi tiếp tục.',
    ctaLabel: 'Thiết lập 2FA',
    color: '#3B82F6',
  },
  session: {
    icon: LogIn,
    title: 'Phiên đăng nhập đã hết hạn',
    subtitle: 'Vui lòng đăng nhập lại để tiếp tục sử dụng. Dữ liệu của bạn vẫn được bảo mật.',
    ctaLabel: 'Đăng nhập lại',
    color: '#EF4444',
  },
  custom: {
    icon: Lock,
    title: 'Không có quyền truy cập',
    subtitle: 'Bạn không đủ điều kiện để sử dụng tính năng này.',
    ctaLabel: 'Tìm hiểu thêm',
    color: '#8B95B3',
  },
};

import { useThemeColors } from '../../hooks/useThemeColors';

export function GatePanel({ type, title, message, actionLabel, onAction }: GatePanelProps) {
  const c = useThemeColors();
  const config = GATE_CONFIG[type];
  const Icon = config.icon;
  const displayTitle = title ?? config.title;
  const displaySub = message ?? config.subtitle;
  const displayCta = actionLabel ?? config.ctaLabel;

  return (
    <div className="flex flex-col items-center py-12 px-6 gap-5">
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: hexToRgba(config.color, 12),
          border: `1.5px solid ${hexToRgba(config.color, 33)}`,
        }}
      >
        <Icon size={36} color={config.color} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div className="text-center max-w-xs">
        <p style={{ color: c.text1, fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          {displayTitle}
        </p>
        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
          {displaySub}
        </p>
      </div>

      {/* CTA */}
      {onAction && (
        <button
          onClick={onAction}
          className="px-8 py-3.5 rounded-2xl font-semibold text-sm"
          style={{
            background: `linear-gradient(135deg, ${config.color} 0%, ${hexToRgba(config.color, 80)} 100%)`,
            color: '#fff',
            boxShadow: `0 4px 16px ${hexToRgba(config.color, 33)}`,
          }}
        >
          {displayCta}
        </button>
      )}

      {/* Security note */}
      <div className="flex items-center gap-1.5 mt-2">
        <Lock size={10} color={c.text3} />
        <span style={{ color: c.text3, fontSize: 11 }}>
          Thông tin được mã hóa và bảo mật
        </span>
      </div>
    </div>
  );
}