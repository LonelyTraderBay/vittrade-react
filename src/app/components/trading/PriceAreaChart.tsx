import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { generateChartData } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';

interface PriceAreaChartProps {
  basePrice: number;
  isPositive: boolean;
  timeframe: string;
}

const TIMEFRAME_POINTS: Record<string, number> = {
  '15m': 24, '1H': 48, '4H': 48, '1D': 60, '1W': 56, '1M': 60,
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const c = useThemeColors();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
      <p style={{ color: c.text2, fontSize: 11 }}>{label}</p>
      <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>
        ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export function PriceAreaChart({ basePrice, isPositive, timeframe }: PriceAreaChartProps) {
  const c = useThemeColors();
  const points = TIMEFRAME_POINTS[timeframe] ?? 48;
  const data = useMemo(() => generateChartData(basePrice, points), [basePrice, points]);

  const color = isPositive ? '#10B981' : '#EF4444';
  const minVal = Math.min(...data.map(d => d.price));
  const maxVal = Math.max(...data.map(d => d.price));
  const mid = (minVal + maxVal) / 2;

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <defs key="gradient-defs">
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid key="pac-grid" strokeDasharray="3 3" stroke={c.divider} vertical={false} />
        <XAxis
          key="pac-x"
          dataKey="time"
          tick={{ fill: c.text3, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={Math.floor(points / 5)}
        />
        <YAxis
          key="pac-y"
          domain={[minVal * 0.999, maxVal * 1.001]}
          tick={{ fill: c.text3, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={60}
          tickFormatter={v => v > 100 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toFixed(4)}
        />
        <Tooltip key="pac-tip" content={<CustomTooltip />} />
        <ReferenceLine key="pac-ref" y={mid} stroke={c.divider} strokeDasharray="4 4" />
        <Area
          key="pac-area"
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.8}
          fill="url(#priceGrad)"
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: c.bg, strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}