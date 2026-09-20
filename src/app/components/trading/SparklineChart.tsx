import React, { memo } from 'react';
import { AreaChart, Area } from 'recharts';

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export const SparklineChart = memo(function SparklineChart({ data, isPositive, width = 70, height = 32 }: SparklineChartProps) {
  const chartData = data.map((v, i) => ({ v, i }));
  const color = isPositive ? '#10B981' : '#EF4444';
  const gradId = `sg-${isPositive ? 'pos' : 'neg'}`;

  return (
    <AreaChart width={width} height={height} data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
      <defs key="gradient-defs">
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        key="spark-area"
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={1.5}
        fill={`url(#${gradId})`}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  );
});