import React from 'react';
import { SkeletonList } from './SkeletonBlock';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Clock, RefreshCw } from 'lucide-react';

/**
 * ══════════════════════════════════════════════════════════
 *  RefreshableSkeletonList — Smart wrapper for loading states
 * ══════════════════════════════════════════════════════════
 *  Combines SkeletonList + isRefreshing fast shimmer +
 *  optional "last updated" timestamp display + refresh count.
 *
 *  Usage:
 *    <RefreshableSkeletonList
 *      isLoading={isLoading}
 *      isRefreshing={isRefreshing}
 *      rows={6}
 *      lastRefreshedLabel={lastRefreshedLabel}
 *      refreshCount={refreshCount}
 *    >
 *      {content}
 *    </RefreshableSkeletonList>
 */

interface RefreshableSkeletonListProps {
  /** Show skeleton when true */
  isLoading: boolean;
  /** Fast shimmer during pull-to-refresh reload */
  isRefreshing?: boolean;
  /** Number of skeleton rows (default: 6) */
  rows?: number;
  /** "Cập nhật lần cuối: X phút trước" — from useRefresh */
  lastRefreshedLabel?: string;
  /** Total refresh count in this session — from useRefresh */
  refreshCount?: number;
  /** Normal content when not loading */
  children: React.ReactNode;
  /** Optional empty state when content is absent */
  emptyState?: React.ReactNode;
  /** If true, show empty state instead of children */
  isEmpty?: boolean;
}

export function RefreshableSkeletonList({
  isLoading,
  isRefreshing,
  rows = 6,
  lastRefreshedLabel,
  refreshCount,
  children,
  emptyState,
  isEmpty,
}: RefreshableSkeletonListProps) {
  if (isLoading) {
    return <SkeletonList rows={rows} isRefreshing={isRefreshing} />;
  }

  if (isEmpty && emptyState) {
    return (
      <div className="contents">
        {emptyState}
        {lastRefreshedLabel && (
          <RefreshTimestamp label={lastRefreshedLabel} count={refreshCount} />
        )}
      </div>
    );
  }

  return (
    <div className="contents">
      {children}
      {lastRefreshedLabel && (
        <RefreshTimestamp label={lastRefreshedLabel} count={refreshCount} />
      )}
    </div>
  );
}

/* ─── Refresh Timestamp indicator ─── */
export function RefreshTimestamp({ label, count }: { label: string; count?: number }) {
  const c = useThemeColors();
  if (!label) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      <Clock size={10} color={c.text3} />
      <span style={{ color: c.text3, fontSize: 10, fontWeight: 500 }}>
        Cập nhật lần cuối: {label}
      </span>
      {count !== undefined && count > 0 && (
        <div className="contents">
          <span style={{ color: c.text3, fontSize: 10 }}>·</span>
          <div
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.12)' }}
          >
            <RefreshCw size={8} color="#3B82F6" strokeWidth={2.5} />
            <span style={{ color: '#3B82F6', fontSize: 9, fontWeight: 600 }}>
              {count}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
