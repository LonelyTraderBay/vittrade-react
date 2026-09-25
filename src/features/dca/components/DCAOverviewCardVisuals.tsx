import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

/* ─── Shimmer Skeleton ───────────────────────────────────── */

function ShimmerBlock({
  w,
  h,
  r = 8,
  className = '',
}: {
  w: string | number;
  h: number;
  r?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: typeof w === 'number' ? w : w,
        height: h,
        borderRadius: r,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
        backgroundSize: '200% 100%',
        animation: 'dcaShimmer 1.8s ease-in-out infinite',
      }}
    />
  );
}

export function SkeletonCard({ ghostBg }: { ghostBg: string }) {
  return (
    <div className="space-y-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <ShimmerBlock w={160} h={14} />
        <ShimmerBlock w={20} h={20} r={10} />
      </div>

      {/* Big value */}
      <ShimmerBlock w="75%" h={34} r={10} />

      {/* P&L badge */}
      <div className="flex items-center gap-2">
        <ShimmerBlock w={130} h={24} r={6} />
        <ShimmerBlock w={60} h={14} />
      </div>

      {/* 3-column metrics */}
      <div className="grid grid-cols-3 gap-2 mt-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl p-3 space-y-2" style={{ background: ghostBg }}>
            <div className="flex items-center gap-1.5">
              <ShimmerBlock w={24} h={24} r={12} />
              <ShimmerBlock w={50} h={10} />
            </div>
            <ShimmerBlock w="80%" h={22} r={6} />
            <ShimmerBlock w="60%" h={10} r={4} />
          </div>
        ))}
      </div>

      {/* Next execution row */}
      <div
        className="rounded-2xl px-3 py-2.5 flex items-center gap-2.5"
        style={{ background: ghostBg }}
      >
        <ShimmerBlock w={32} h={32} r={12} />
        <div className="space-y-1.5 flex-1">
          <ShimmerBlock w={80} h={10} />
          <ShimmerBlock w={140} h={14} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1.5 py-2 rounded-2xl"
            style={{ background: ghostBg }}
          >
            <ShimmerBlock w={34} h={34} r={12} />
            <ShimmerBlock w={30} h={10} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Mini Sparkline (animated draw-on-mount) ────────────── */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isProfit: boolean;
  onTap?: () => void;
}

export function Sparkline({ data, width = 100, height = 44, isProfit, onTap }: SparklineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const [mounted, setMounted] = useState(false);
  const animKey = useRef(0);

  /** Fingerprint of data so we can detect real changes */
  const dataFingerprint = useMemo(() => {
    if (data.length < 2) return '';
    return `${data.length}_${data[0]}_${data[data.length - 1]}_${data[Math.floor(data.length / 2)]}`;
  }, [data]);

  const path = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 2;
    const usableH = height - padY * 2;
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * width,
      y: padY + usableH - ((v - min) / range) * usableH,
    }));
    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
    }
    return d;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  const lastPointY = useMemo(() => {
    if (data.length < 2) return 0;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padY = 2;
    const usableH = height - padY * 2;
    return padY + usableH - ((data[data.length - 1] - min) / range) * usableH;
  }, [data, height]);

  /* ── Re-animate whenever data fingerprint changes ── */
  useEffect(() => {
    // Reset state for re-animation
    setMounted(false);
    animKey.current += 1;
    const currentKey = animKey.current;

    const el = pathRef.current;
    if (!el || !path) return;

    // Reset to hidden state first
    el.style.transition = 'none';
    const totalLength = el.getTotalLength();
    el.style.strokeDasharray = `${totalLength}`;
    el.style.strokeDashoffset = `${totalLength}`;

    // Force reflow so the reset state is applied
    el.getBoundingClientRect();

    // Start draw animation
    requestAnimationFrame(() => {
      if (animKey.current !== currentKey) return; // stale
      el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.strokeDashoffset = '0';
    });

    // Fade in area & dot after line partially draws
    const timer = setTimeout(() => {
      if (animKey.current !== currentKey) return;
      setMounted(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [path, dataFingerprint]);

  const strokeColor = isProfit ? '#10B981' : '#EF4444';
  const fillStart = isProfit ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)';
  const gradientId = isProfit ? 'dcaSparkUp' : 'dcaSparkDown';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
      className={`relative block rounded-lg transition-all ${onTap ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-default'}`}
      aria-label="Xem biểu đồ chi tiết"
      style={{ padding: 0, background: 'transparent', border: 'none' }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillStart} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Area fill — fades in */}
        {areaPath && (
          <path
            ref={areaRef}
            d={areaPath}
            fill={`url(#${gradientId})`}
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.6s ease-out',
            }}
          />
        )}

        {/* Line stroke — animated dashoffset */}
        {path && (
          <path
            ref={pathRef}
            d={path}
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* End dot — fades in with pulse ring */}
        {data.length >= 2 && (
          <g
            ref={dotRef}
            style={{
              opacity: mounted ? 1 : 0,
              transition: 'opacity 0.4s ease-out 0.8s',
            }}
          >
            <circle cx={width} cy={lastPointY} r={6} fill={strokeColor} opacity={0.3}>
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values="0.3;0.1;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={width} cy={lastPointY} r={3} fill={strokeColor} />
          </g>
        )}
      </svg>

      {onTap && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.3s ease-out 1s',
          }}
        >
          <Maximize2 className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
        </div>
      )}
    </button>
  );
}

/* ─── Tooltip Popover ────────────────────────────────────── */

interface TooltipPopoverProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function TooltipPopover({ open, onClose, children }: TooltipPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const c = useThemeColors();
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div ref={ref} className="absolute z-30 bottom-full left-0 right-0 mb-2">
      <div
        className="rounded-xl p-3 shadow-lg text-[12px] leading-[1.6]"
        style={{
          background: c.surface2,
          border: `1px solid ${c.border}`,
          color: c.text2,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>{children}</div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-px"
            style={{ color: c.text3 }}
            aria-label="Đóng"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
          style={{
            background: c.surface2,
            borderRight: `1px solid ${c.border}`,
            borderBottom: `1px solid ${c.border}`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Shimmer keyframes (injected once) ──────────────────── */

const SHIMMER_STYLE_ID = 'dca-shimmer-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(SHIMMER_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = SHIMMER_STYLE_ID;
  style.textContent = `
    @keyframes dcaShimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}
