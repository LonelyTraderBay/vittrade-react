import { RefreshCw } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
}

/**
 * Enterprise Fintech — Pull-to-Refresh Indicator
 * Hiển thị spinner + progress khi user kéo xuống
 * Đặt ở top của scroll container
 */
export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
}: PullToRefreshIndicatorProps) {
  const c = useThemeColors();
  if (pullDistance <= 0 && !isRefreshing) return null;

  const opacity = Math.min(progress, 1);
  const rotation = progress * 360;
  const scale = 0.5 + progress * 0.5;

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        height: pullDistance,
        transition: isRefreshing ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: isRefreshing ? 'none' : 'transform 0.1s ease',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: isRefreshing ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
            border: `2px solid ${progress >= 1 ? '#3B82F6' : 'rgba(59,130,246,0.3)'}`,
            boxShadow: isRefreshing ? '0 0 16px rgba(59,130,246,0.2)' : 'none',
          }}
        >
          <RefreshCw
            size={18}
            color={progress >= 1 ? '#3B82F6' : c.text3}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease',
              animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
          />
        </div>
      </div>

      {/* Threshold reached hint */}
      {progress >= 1 && !isRefreshing && (
        <span
          className="absolute text-xs"
          style={{
            color: '#3B82F6',
            marginTop: 56,
            opacity: 0.8,
          }}
        >
          Thả để làm mới
        </span>
      )}
    </div>
  );
}
