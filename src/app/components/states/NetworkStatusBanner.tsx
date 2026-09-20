import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { φ } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════
 *  NetworkStatusBanner — Auto-show/hide connectivity banner
 * ══════════════════════════════════════════════════════════
 *
 *  States:
 *  ✓  Online → hidden (no banner)
 *  ✓  Offline → red banner "Không có kết nối mạng"
 *  ✓  Reconnecting → amber banner "Đang kết nối lại..."
 *  ✓  Just recovered → green banner "Đã kết nối lại" (auto-hide after 3s)
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  <NetworkStatusBanner />   // Place in AppLayout, above content
 */

type BannerState = 'hidden' | 'offline' | 'reconnecting' | 'recovered';

const BANNER_CONFIG: Record<Exclude<BannerState, 'hidden'>, {
  bg: string;
  border: string;
  text: string;
  icon: typeof WifiOff;
  label: string;
  spinning?: boolean;
}> = {
  offline: {
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
    text: '#EF4444',
    icon: WifiOff,
    label: 'Không có kết nối mạng',
  },
  reconnecting: {
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    text: '#F59E0B',
    icon: RefreshCw,
    label: 'Đang kết nối lại...',
    spinning: true,
  },
  recovered: {
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    text: '#10B981',
    icon: Wifi,
    label: 'Đã kết nối lại',
  },
};

export function NetworkStatusBanner() {
  const { isOnline, isReconnecting } = useOnlineStatus();
  const [bannerState, setBannerState] = useState<BannerState>('hidden');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      if (isReconnecting) {
        setBannerState('reconnecting');
      } else {
        setBannerState('offline');
      }
    } else if (wasOffline) {
      setBannerState('recovered');
      const timer = setTimeout(() => {
        setBannerState('hidden');
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setBannerState('hidden');
    }
  }, [isOnline, isReconnecting, wasOffline]);

  if (bannerState === 'hidden') return null;

  const config = BANNER_CONFIG[bannerState];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 animate-fade-in-up"
      style={{
        height: 36,
        background: config.bg,
        borderBottom: `1px solid ${config.border}`,
      }}
    >
      <Icon
        size={14}
        color={config.text}
        className={config.spinning ? 'animate-spin' : ''}
        strokeWidth={2.2}
      />
      <span
        style={{
          color: config.text,
          fontSize: φ.xs,
          fontWeight: 600,
        }}
      >
        {config.label}
      </span>

      {bannerState === 'offline' && (
        <span style={{ color: config.text, fontSize: φ.xs, opacity: 0.7 }}>
          • Dữ liệu có thể không cập nhật
        </span>
      )}
    </div>
  );
}
