import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { useThemeColors } from '../../hooks/useThemeColors';

interface ErrorStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function ErrorState({
  icon = <AlertTriangle size={36} color="#EF4444" strokeWidth={1.5} />,
  title = 'Có lỗi xảy ra',
  message = 'Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.',
  actionLabel = 'Thử lại',
  onAction,
  secondaryLabel,
  onSecondary,
}: ErrorStateProps) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center py-16 gap-4 px-8">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        {icon}
      </div>

      <div className="text-center">
        <p style={{ color: c.text1, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          {title}
        </p>
        <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
          style={{
            background: 'rgba(239,68,68,0.12)',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <RefreshCw size={16} />
          {actionLabel}
        </button>
      )}

      {onSecondary && (
        <button
          onClick={onSecondary}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
          style={{
            background: 'rgba(239,68,68,0.12)',
            color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  );
}