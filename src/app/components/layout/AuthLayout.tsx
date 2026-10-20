import React from 'react';
import { Outlet } from 'react-router';
import { StatusBar } from './StatusBar';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { DEVICE } from './device-layout';

export function AuthLayout() {
  const c = useThemeColors();
  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        maxHeight: '100dvh',
        background: c.bg,
        overscrollBehavior: 'none',
        transition: 'background var(--tr-duration-slow) ease',
      }}
    >
      <StatusBar />
      <div
        className="min-h-0 flex-1 overflow-y-auto scrollbar-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: DEVICE.HOME_INDICATOR,
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}
