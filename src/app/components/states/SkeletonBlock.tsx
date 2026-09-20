import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

/* ─── Shimmer keyframes injected once ─── */
const shimmerStyle = `
@keyframes stateShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes stateShimmerFast {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function Shimmer({ className, style, fast }: { className?: string; style?: React.CSSProperties; fast?: boolean }) {
  const c = useThemeColors();
  return (
    <div
      className={className}
      style={{
        background: fast
          ? `linear-gradient(90deg, ${c.surface2} 20%, ${c.surface3} 32%, ${c.surface2} 55%)`
          : `linear-gradient(90deg, ${c.surface2} 25%, ${c.surface3} 37%, ${c.surface2} 63%)`,
        backgroundSize: '800px 100%',
        animation: fast
          ? 'stateShimmerFast 0.9s ease-in-out infinite'
          : 'stateShimmer 1.8s ease-in-out infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

/* ─── Skeleton: single list row ─── */
export function SkeletonRow({ fast }: { fast?: boolean }) {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-3 px-5 py-3"
      style={{ borderBottom: `1px solid ${c.border}` }}>
      <Shimmer fast={fast} style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
      <div className="flex-1 flex flex-col gap-2">
        <Shimmer fast={fast} style={{ width: '55%', height: 14 }} />
        <Shimmer fast={fast} style={{ width: '35%', height: 10 }} />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Shimmer fast={fast} style={{ width: 70, height: 14 }} />
        <Shimmer fast={fast} style={{ width: 48, height: 18, borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ─── Skeleton: card ─── */
export function SkeletonCard() {
  const c = useThemeColors();
  return (
    <div className="rounded-2xl p-4" style={{ background: c.surface, border: `1px solid ${c.borderSolid}` }}>
      <div className="flex items-center gap-3 mb-4">
        <Shimmer style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        <div className="flex-1 flex flex-col gap-2">
          <Shimmer style={{ width: '60%', height: 14 }} />
          <Shimmer style={{ width: '40%', height: 10 }} />
        </div>
        <Shimmer style={{ width: 56, height: 24, borderRadius: 8 }} />
      </div>
      <Shimmer style={{ width: '80%', height: 22, marginBottom: 12 }} />
      <div className="flex gap-2 mb-3">
        <Shimmer style={{ width: 60, height: 24, borderRadius: 8 }} />
        <Shimmer style={{ width: 48, height: 24, borderRadius: 8 }} />
        <Shimmer style={{ width: 54, height: 24, borderRadius: 8 }} />
      </div>
      <Shimmer style={{ width: '100%', height: 44, borderRadius: 16 }} />
    </div>
  );
}

/* ─── Skeleton: full list (N rows) ─── */
export function SkeletonList({ rows = 6, isRefreshing }: { rows?: number; isRefreshing?: boolean }) {
  return (
    <div className="contents">
      <style>{shimmerStyle}</style>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} fast={isRefreshing} />
        ))}
      </div>
    </div>
  );
}

/* ─── Skeleton: header + filter + list ─── */
export function SkeletonPageList({ title, rows = 6 }: { title?: string; rows?: number }) {
  const c = useThemeColors();
  return (
    <div className="contents">
      <style>{shimmerStyle}</style>
      <div className="flex flex-col">
        {/* Header area */}
        {title && (
          <div className="px-5 pt-4 pb-2">
            <Shimmer style={{ width: 140, height: 22, marginBottom: 12 }} />
          </div>
        )}
        {/* Filter tabs */}
        <div className="flex gap-2 px-5 py-3">
          {[72, 56, 64, 48].map((w, i) => (
            <Shimmer key={i} style={{ width: w, height: 28, borderRadius: 12 }} />
          ))}
        </div>
        {/* List */}
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
        {/* Disabled CTA */}
        <div className="px-5 mt-4">
          <div className="h-12 rounded-2xl" style={{ background: c.surface2, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}