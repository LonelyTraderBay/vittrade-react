import React from 'react';
import { Outlet } from 'react-router';
import { StatusBar } from './StatusBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { DEVICE } from './MobileFrame';

export function AuthLayout() {
  const c = useThemeColors();
  return (
    <div className="relative flex flex-col overflow-hidden"
      style={{ width: '100%', height: '100%', background: c.bg, overscrollBehavior: 'none', transition: 'background var(--tr-duration-slow) ease' }}>
      <StatusBar />
      <div className="flex-1 overflow-y-auto scrollbar-none"
        style={{
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: DEVICE.HOME_INDICATOR,
        }}>
        <Outlet />
      </div>
    </div>
  );
}