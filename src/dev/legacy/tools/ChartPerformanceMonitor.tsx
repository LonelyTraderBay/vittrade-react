/**
 * ══════════════════════════════════════════════════════════════════
 *  CHART PERFORMANCE MONITOR
 * ══════════════════════════════════════════════════════════════════
 *  Dev tool for monitoring chart render performance
 *
 *  Usage:
 *  <ChartPerformanceMonitor enabled={isDev}>
 *    <MiniChart ... />
 *  </ChartPerformanceMonitor>
 */

import React, { useEffect, useRef, useState } from 'react';

interface ChartPerformanceMonitorProps {
  enabled?: boolean;
  children: React.ReactNode;
  threshold?: number; // Performance warning threshold in ms
}

export function ChartPerformanceMonitor({
  enabled = false,
  children,
  threshold = 100,
}: ChartPerformanceMonitorProps) {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [mountTime, setMountTime] = useState<number | null>(null);
  const mountStartRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    mountStartRef.current = performance.now();

    return () => {
      const duration = performance.now() - mountStartRef.current;
      setMountTime(duration);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();

    // Measure after render
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
    });
  });

  if (!enabled) {
    return <>{children}</>;
  }

  const isSlowMount = mountTime !== null && mountTime > threshold;
  const isSlowRender = renderTime !== null && renderTime > threshold;

  return (
    <div className="relative">
      {children}

      {/* Performance Overlay */}
      <div
        className="absolute top-0 right-0 px-2 py-1 rounded-bl-lg text-xs font-mono"
        style={{
          background: isSlowMount || isSlowRender ? '#EF4444' : '#10B981',
          color: '#FFFFFF',
          opacity: 0.8,
          fontSize: 10,
          zIndex: 1000,
        }}
      >
        <div>Mount: {mountTime?.toFixed(1) ?? '—'}ms</div>
        <div>Render: {renderTime?.toFixed(1) ?? '—'}ms</div>
      </div>
    </div>
  );
}
