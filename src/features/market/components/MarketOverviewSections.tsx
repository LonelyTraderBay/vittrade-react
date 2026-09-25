import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import type { MarketMoverSummary, MarketSectorSummary } from '../model/market-types';

export function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const colors = useThemeColors();
  const gaugeColor = value <= 25 ? '#EF4444' : value <= 45 ? '#F59E0B' : '#10B981';
  const rotation = (value / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="120"
        height="68"
        viewBox="0 0 120 68"
        role="img"
        aria-label={`${label}: ${value}`}
      >
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={colors.divider}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`}
        />
        <line
          x1="60"
          y1="60"
          x2={60 + 35 * Math.cos((rotation * Math.PI) / 180)}
          y2={60 + 35 * Math.sin((rotation * Math.PI) / 180)}
          stroke={gaugeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="4" fill={gaugeColor} />
      </svg>
      <span style={{ color: gaugeColor, fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>
        {value}
      </span>
      <span style={{ color: gaugeColor, fontSize: 11, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  color: string;
}) {
  const colors = useThemeColors();
  const positive = (change ?? 0) >= 0;

  return (
    <TrCard className="flex-1 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: `${color}15` }}
        >
          <Icon size={14} color={color} />
        </span>
        <span style={{ color: colors.text3, fontSize: 11 }}>{label}</span>
      </div>
      <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
        {value}
      </p>
      {change !== undefined && (
        <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 600 }}>
          {positive ? '+' : ''}
          {fmtPct(change)}
        </p>
      )}
    </TrCard>
  );
}

export function MoverRow({ mover, onClick }: { mover: MarketMoverSummary; onClick: () => void }) {
  const colors = useThemeColors();
  const positive = mover.change24h >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 py-2 text-left"
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${mover.color}20` }}
      >
        <span style={{ color: mover.color, fontSize: 10, fontWeight: 700 }}>
          {mover.symbol.slice(0, 3)}
        </span>
      </span>
      <span style={{ color: colors.text1, fontSize: 12, fontWeight: 600, flex: 1 }}>
        {mover.symbol}
      </span>
      <span style={{ color: colors.text2, fontSize: 11, fontFamily: 'monospace' }}>
        {fmtPrice(mover.price)}
      </span>
      <span
        style={{
          color: positive ? '#10B981' : '#EF4444',
          background: positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 7px',
          borderRadius: 8,
        }}
      >
        {positive ? '+' : ''}
        {fmtPct(mover.change24h)}
      </span>
    </button>
  );
}

export function SectorRow({
  sector,
  onClick,
}: {
  sector: MarketSectorSummary;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  const positive = sector.change24h >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${sector.color}15` }}
      >
        <span aria-hidden>{sector.icon}</span>
      </span>
      <span style={{ color: colors.text1, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>{sector.nameVi}</span>
        <span style={{ display: 'block', color: colors.text3, fontSize: 10 }}>
          {sector.coinCount} coins
        </span>
      </span>
      <span className="text-right">
        <span
          style={{
            display: 'block',
            color: positive ? '#10B981' : '#EF4444',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'monospace',
          }}
        >
          {positive ? '+' : ''}
          {fmtPct(sector.change24h)}
        </span>
        <span style={{ display: 'block', color: colors.text3, fontSize: 10 }}>
          {fmtCompact(sector.totalMarketCap, { prefix: '$' })}
        </span>
      </span>
      <ChevronRight size={14} color={colors.text3} />
    </button>
  );
}
