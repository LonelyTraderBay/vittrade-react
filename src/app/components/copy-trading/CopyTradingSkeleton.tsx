/**
 * ══════════════════════════════════════════════════════════════
 *  CopyTradingSkeleton — Loading States for Copy Trading
 * ══════════════════════════════════════════════════════════════
 * 
 * Skeleton screens for:
 * - Provider list
 * - Provider detail page
 * - Charts and metrics
 */

import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../ui/TrCard';

/**
 * Skeleton for trader card in listing page
 */
export function TraderCardSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar skeleton */}
        <div 
          className="w-12 h-12 rounded-full animate-pulse"
          style={{ background: c.surface2 }}
        />
        
        <div className="flex-1">
          {/* Name */}
          <div 
            className="h-4 w-32 rounded animate-pulse mb-2"
            style={{ background: c.surface2 }}
          />
          {/* Tags */}
          <div className="flex gap-1.5">
            <div className="h-5 w-16 rounded animate-pulse" style={{ background: c.surface2 }} />
            <div className="h-5 w-20 rounded animate-pulse" style={{ background: c.surface2 }} />
            <div className="h-5 w-24 rounded animate-pulse" style={{ background: c.surface2 }} />
          </div>
        </div>
        
        {/* ROI skeleton */}
        <div className="text-right">
          <div className="h-6 w-20 rounded animate-pulse mb-1" style={{ background: c.surface2 }} />
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.surface2 }} />
        </div>
      </div>
      
      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-2.5 mt-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-3 w-12 rounded animate-pulse mb-1" style={{ background: c.surface2 }} />
            <div className="h-4 w-16 rounded animate-pulse" style={{ background: c.surface2 }} />
          </div>
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="mt-3">
        <div className="h-3 w-24 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
        <div className="flex items-end gap-1 h-6">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div 
              key={i}
              className="flex-1 rounded-sm animate-pulse"
              style={{ 
                background: c.surface2,
                height: `${20 + (i * 10)}%`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* CTA skeleton */}
      <div className="h-10 w-full rounded-xl animate-pulse mt-3" style={{ background: c.surface2 }} />
    </TrCard>
  );
}

/**
 * Skeleton for hero card
 */
export function HeroCardSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-[14px] animate-pulse" style={{ background: c.surface2 }} />
        <div className="flex-1">
          <div className="h-4 w-24 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
          <div className="h-3 w-32 rounded animate-pulse" style={{ background: c.surface2 }} />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-3 w-16 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
            <div className="h-6 w-20 rounded animate-pulse" style={{ background: c.surface2 }} />
          </div>
        ))}
      </div>
    </TrCard>
  );
}

/**
 * Skeleton for chart section
 */
export function ChartSkeleton({ height = 200 }: { height?: number }) {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-4">
      <div className="h-4 w-32 rounded animate-pulse mb-4" style={{ background: c.surface2 }} />
      <div 
        className="w-full rounded-lg animate-pulse"
        style={{ background: c.surface2, height }}
      />
    </TrCard>
  );
}

/**
 * Skeleton for metric card
 */
export function MetricCardSkeleton() {
  const c = useThemeColors();
  
  return (
    <TrCard className="p-4">
      <div className="h-3 w-20 rounded animate-pulse mb-3" style={{ background: c.surface2 }} />
      <div className="h-8 w-24 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
      <div className="h-3 w-16 rounded animate-pulse" style={{ background: c.surface2 }} />
    </TrCard>
  );
}

/**
 * Full page skeleton for provider detail
 */
export function ProviderDetailSkeleton() {
  const c = useThemeColors();
  
  return (
    <div className="flex flex-col gap-5">
      {/* Provider header card */}
      <TrCard className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-full animate-pulse" style={{ background: c.surface2 }} />
          <div className="flex-1">
            <div className="h-5 w-32 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
            <div className="h-3 w-48 rounded animate-pulse" style={{ background: c.surface2 }} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="h-3 w-16 rounded animate-pulse mb-2" style={{ background: c.surface2 }} />
              <div className="h-5 w-20 rounded animate-pulse" style={{ background: c.surface2 }} />
            </div>
          ))}
        </div>
      </TrCard>
      
      {/* Chart skeleton */}
      <ChartSkeleton height={240} />
      
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      
      {/* More charts */}
      <ChartSkeleton height={180} />
      <ChartSkeleton height={200} />
    </div>
  );
}
