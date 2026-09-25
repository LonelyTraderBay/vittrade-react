import type { DCAPortfolioHistoryPoint } from '../model/dca-types';

const formatVNDFull = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.round(amount));
const formatDateFull = (date: Date): string =>
  date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ─── Crosshair Cursor ──────────────────────────────────── */

interface CrosshairCursorProps {
  points?: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
}

export function CrosshairCursor({
  points,
  width = 0,
  height = 0,
  top = 0,
  left = 0,
}: CrosshairCursorProps) {
  if (!points || points.length === 0) return null;

  const { x, y } = points[0];

  return (
    <g>
      {/* Vertical line */}
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={top + height}
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.6}
      />
      {/* Horizontal line */}
      <line
        x1={left}
        y1={y}
        x2={left + width}
        y2={y}
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.4}
      />
      {/* Active dot */}
      <circle
        cx={x}
        cy={y}
        r={5}
        fill="var(--accent-primary, var(--primary))"
        stroke="white"
        strokeWidth={2.5}
      />
      {/* Outer ring */}
      <circle
        cx={x}
        cy={y}
        r={9}
        fill="none"
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        opacity={0.25}
      />
    </g>
  );
}

/* ─── Crosshair Tooltip ──────────────────────────────────── */

type ChartHistoryPoint = Omit<DCAPortfolioHistoryPoint, 'date'> & { date: number };

interface CrosshairTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartHistoryPoint }>;
}

export function CrosshairTooltip({ active, payload }: CrosshairTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as DCAPortfolioHistoryPoint & {
    date: number;
  };
  const dateObj = new Date(data.date);
  const profitLoss = data.portfolioValue - data.totalInvested;
  const profitLossPercent = data.totalInvested > 0 ? (profitLoss / data.totalInvested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  return (
    <div
      className="bg-[var(--surface-1,var(--card))] border border-[var(--border-subtle,var(--border))] rounded-xl shadow-xl pointer-events-none"
      style={{ padding: '10px 12px', minWidth: 180 }}
    >
      <div
        className="text-[11px] text-[var(--text-tertiary,var(--tr-text-3))] mb-2 pb-1.5 border-b border-[var(--border-subtle,var(--border))]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatDateFull(dateObj)}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Giá trị
          </span>
          <span
            className="text-[13px] text-[var(--text-primary,var(--foreground))]"
            style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVNDFull(data.portfolioValue)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Đã đầu tư
          </span>
          <span
            className="text-[13px] text-[var(--text-primary,var(--foreground))]"
            style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVNDFull(data.totalInvested)}
          </span>
        </div>

        <div className="flex justify-between gap-4 pt-1 border-t border-[var(--border-subtle,var(--border))]">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Lãi/Lỗ
          </span>
          <span
            className={`text-[13px] ${
              isProfit
                ? 'text-[var(--semantic-success,var(--tr-buy))]'
                : 'text-[var(--semantic-error,var(--tr-sell))]'
            }`}
            style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {isProfit ? '+' : ''}
            {formatVNDFull(profitLoss)} ({isProfit ? '+' : ''}
            {profitLossPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {data.hasPurchase && (
        <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle,var(--border))] flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent-primary, var(--primary))' }}
          />
          <span
            className="text-[11px] text-[var(--accent-primary,var(--primary))]"
            style={{ fontWeight: 500 }}
          >
            Đã mua tại điểm này
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Purchase Dot ───────────────────────────────────────── */

interface PurchaseDotProps {
  cx?: number;
  cy?: number;
  payload?: DCAPortfolioHistoryPoint;
  index?: number;
}

export function PurchaseDot({ cx, cy, payload, index }: PurchaseDotProps) {
  if (!payload?.hasPurchase) return <circle key={`no-purchase-${index}`} r={0} />;

  return (
    <circle
      key={`purchase-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--accent-primary, var(--primary))"
      stroke="white"
      strokeWidth={2}
    />
  );
}
