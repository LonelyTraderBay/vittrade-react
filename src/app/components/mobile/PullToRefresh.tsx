import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';

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
export function PullToRefreshIndicator({ pullDistance, isRefreshing, progress }: PullToRefreshIndicatorProps) {
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
          Th\u1ea3 \u0111\u1ec3 l\u00e0m m\u1edbi
        </span>
      )}
    </div>
  );
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}

/**
 * Enterprise Fintech — Pull-to-Refresh Container
 * Hiển thị spinner + progress khi user kéo xuống
 * Đặt ở top của scroll container
 */
export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const c = useThemeColors();

  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pullDistance > 0) return;
    setPullDistance(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const distance = currentY - pullDistance;
    if (distance > 0) {
      setPullDistance(distance);
      setProgress(distance / 100);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;
    if (progress >= 1) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setProgress(0);
  };

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} progress={progress} />
      <div className="mt-10">{children}</div>
    </div>
  );
}