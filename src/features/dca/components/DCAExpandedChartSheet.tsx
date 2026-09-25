import type { DCAOverview, DCAPortfolioHistoryPoint } from '../model/dca-types';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { BottomSheetV2 } from '@/shared/ui/BottomSheetV2';
import { DCAHistoryChart } from './DCAHistoryChart';

type ChartTimeframe = '7d' | '30d' | '90d' | 'all';
type TimeframePnL = {
  valueChange: number;
  percentChange: number;
  investedChange: number;
  isProfit: boolean;
} | null;

export function DCAExpandedChartSheet({
  isOpen,
  onClose,
  overview,
  chartTimeframe,
  setChartTimeframe,
  timeframeOptions,
  timeframeSubtitle,
  timeframePnL,
  portfolioHistory,
  filteredChartData,
}: {
  isOpen: boolean;
  onClose: () => void;
  overview: DCAOverview;
  chartTimeframe: ChartTimeframe;
  setChartTimeframe: (timeframe: ChartTimeframe) => void;
  timeframeOptions: { key: ChartTimeframe; label: string }[];
  timeframeSubtitle: string;
  timeframePnL: TimeframePnL;
  portfolioHistory: DCAPortfolioHistoryPoint[];
  filteredChartData: DCAPortfolioHistoryPoint[];
}) {
  const c = useThemeColors();
  return (
    <>
      {/* Expanded Chart Sheet (from sparkline tap) */}
      <BottomSheetV2 open={isOpen} onClose={onClose} title="Biểu đồ danh mục">
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px]" style={{ color: c.text3 }}>
                Giá trị hiện tại
              </p>
              <p
                className="text-[23px]"
                style={{
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.2,
                  color: c.text1,
                }}
              >
                {new Intl.NumberFormat('vi-VN').format(Math.round(overview.currentValue))} VND
              </p>
            </div>
            <div
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[14px]
                ${
                  overview.profitLoss >= 0
                    ? 'bg-[rgba(16,185,129,0.1)]'
                    : 'bg-[rgba(239,68,68,0.1)]'
                }
              `}
              style={{
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                color: overview.profitLoss >= 0 ? c.buy : c.sell,
              }}
            >
              {overview.profitLoss >= 0 ? '+' : ''}
              {overview.profitLossPercent.toFixed(1).replace('.', ',')}%
            </div>
          </div>

          {/* Timeframe selector */}
          <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: c.surface2 }}>
            {timeframeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setChartTimeframe(option.key)}
                className="flex-1 h-9 rounded-lg text-[13px] transition-all"
                style={{
                  fontWeight: chartTimeframe === option.key ? 600 : 400,
                  background: chartTimeframe === option.key ? c.surface : 'transparent',
                  color: chartTimeframe === option.key ? c.text1 : c.text2,
                  boxShadow: chartTimeframe === option.key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Timeframe P&L summary */}
          {timeframePnL && (
            <div className="rounded-xl p-4" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px]" style={{ color: c.text3 }}>
                  Biến động {timeframeSubtitle}
                </span>
                <div
                  className={`
                    inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px]
                    ${
                      timeframePnL.isProfit
                        ? 'bg-[rgba(16,185,129,0.1)]'
                        : 'bg-[rgba(239,68,68,0.1)]'
                    }
                  `}
                  style={{
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    color: timeframePnL.isProfit ? c.buy : c.sell,
                  }}
                >
                  {timeframePnL.isProfit ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {timeframePnL.isProfit ? '+' : ''}
                  {timeframePnL.percentChange.toFixed(2).replace('.', ',')}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: c.text3 }}>
                    Thay đổi giá trị
                  </p>
                  <p
                    className="text-[14px]"
                    style={{
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: timeframePnL.isProfit ? c.buy : c.sell,
                    }}
                  >
                    {timeframePnL.isProfit ? '+' : ''}
                    {new Intl.NumberFormat('vi-VN').format(
                      Math.round(timeframePnL.valueChange),
                    )}{' '}
                    VND
                  </p>
                </div>
                <div>
                  <p className="text-[11px] mb-0.5" style={{ color: c.text3 }}>
                    Đã nạp thêm
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: c.text1 }}
                  >
                    +
                    {new Intl.NumberFormat('vi-VN').format(Math.round(timeframePnL.investedChange))}{' '}
                    VND
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Full interactive chart */}
          {portfolioHistory.length > 0 ? (
            <DCAHistoryChart
              data={filteredChartData}
              height={280}
              subtitle={timeframeSubtitle}
              interactive
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-[14px]" style={{ color: c.text3 }}>
                Chưa có dữ liệu biểu đồ
              </p>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={() => onClose()}
            className="w-full h-12 rounded-xl text-[14px] transition-colors"
            style={{ fontWeight: 500, background: c.surface2, color: c.text1 }}
          >
            Đóng
          </button>
        </div>
      </BottomSheetV2>
    </>
  );
}
