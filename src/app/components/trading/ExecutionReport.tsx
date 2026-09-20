/**
 * ══════════════════════════════════════════════════════════════════
 *  EXECUTION REPORT — Phase 2: Execution Quality
 * ══════════════════════════════════════════════════════════════════
 *  Smart Order Routing Transparency
 *  - Multi-venue execution breakdown
 *  - Fill price vs expected price
 *  - Slippage calculation
 *  - Savings vs single-venue execution
 *  - Execution timeline
 *  - Quality score (A-F grade)
 */

import React from 'react';
import { CheckCircle, TrendingUp, TrendingDown, Clock, Award, ExternalLink, Activity } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { fmtPrice, fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface VenueFill {
  venue: string;
  venueLogo?: string;
  amount: number;
  price: number;
  fee: number;
  timestamp: string; // ISO date
}

export interface ExecutionReportData {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  
  // Order details
  requestedAmount: number;
  filledAmount: number;
  fills: VenueFill[];
  
  // Pricing
  expectedPrice: number; // Pre-execution estimate
  averageFillPrice: number;
  bestAvailablePrice: number; // Best single-venue price at time
  
  // Timing
  submittedAt: string;
  completedAt: string;
  executionTimeMs: number;
  
  // Quality metrics
  slippagePct: number;
  savingsVsSingleVenue: number;
  executionQuality: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface ExecutionReportProps {
  data: ExecutionReportData;
  onClose?: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════ */

function getQualityColor(grade: string): string {
  switch (grade) {
    case 'A': return '#10B981';
    case 'B': return '#3B82F6';
    case 'C': return '#F59E0B';
    case 'D': return '#EF4444';
    case 'F': return '#DC2626';
    default: return '#64748B';
  }
}

function getQualityLabel(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent';
    case 'B': return 'Good';
    case 'C': return 'Average';
    case 'D': return 'Below Average';
    case 'F': return 'Poor';
    default: return 'Unknown';
  }
}

function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/* ═══════════════════════════════════════════════════════════════
   EXECUTION REPORT COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export function ExecutionReport({ data, onClose }: ExecutionReportProps) {
  const c = useThemeColors();

  const fillPct = (data.filledAmount / data.requestedAmount) * 100;
  const isFullyFilled = fillPct >= 99.9;
  const isSlippageGood = Math.abs(data.slippagePct) < 0.5;
  const hasSavings = data.savingsVsSingleVenue > 0;

  // Total fees
  const totalFees = data.fills.reduce((sum, fill) => sum + fill.fee, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header - Success State */}
      <TrCard className="p-4" accentBorder="rgba(16,185,129,0.3)">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.12)' }}
          >
            <CheckCircle size={24} color="#10B981" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, marginBottom: 4 }}>
              Order {isFullyFilled ? 'Filled' : 'Partially Filled'}
            </p>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              #{data.orderId.slice(0, 12)}... • {data.symbol}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 2 }}>
              Fill Rate
            </p>
            <p style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: isFullyFilled ? '#10B981' : '#F59E0B' }}>
              {fmtPct(fillPct)}
            </p>
          </div>
        </div>
      </TrCard>

      {/* Execution Quality Score */}
      <TrCard className="p-4" accentBorder={`${getQualityColor(data.executionQuality)}40`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award size={18} color={getQualityColor(data.executionQuality)} />
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              Execution Quality
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
                color: getQualityColor(data.executionQuality),
                background: `${getQualityColor(data.executionQuality)}1F`,
              }}
            >
              {data.executionQuality}
            </span>
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              {getQualityLabel(data.executionQuality)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Slippage
            </p>
            <p style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: isSlippageGood ? '#10B981' : '#F59E0B',
            }}>
              {fmtPct(Math.abs(data.slippagePct))}
            </p>
          </div>
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Saved
            </p>
            <p style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: hasSavings ? '#10B981' : c.text2,
            }}>
              {hasSavings ? fmtUsd(data.savingsVsSingleVenue) : '—'}
            </p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4 }}>
              Time
            </p>
            <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              {formatExecutionTime(data.executionTimeMs)}
            </p>
          </div>
        </div>
      </TrCard>

      {/* Price Breakdown */}
      <TrCard className="p-4">
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
          Price Breakdown
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Expected Price
            </span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
              {fmtPrice(data.expectedPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Average Fill Price
            </span>
            <span style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtPrice(data.averageFillPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Best Available (Single Venue)
            </span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
              {fmtPrice(data.bestAvailablePrice)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.slippagePct >= 0 ? (
                <TrendingUp size={14} color={isSlippageGood ? '#10B981' : '#F59E0B'} />
              ) : (
                <TrendingDown size={14} color="#EF4444" />
              )}
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                Slippage vs Expected:
              </span>
            </div>
            <span style={{
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: isSlippageGood ? '#10B981' : data.slippagePct > 1 ? '#EF4444' : '#F59E0B',
            }}>
              {data.slippagePct >= 0 ? '+' : ''}{fmtPct(data.slippagePct)}
            </span>
          </div>
        </div>
      </TrCard>

      {/* Venue Breakdown */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
            Execution Venues ({data.fills.length})
          </span>
          <Activity size={14} color={c.text3} />
        </div>

        <div className="flex flex-col gap-2">
          {data.fills.map((fill, i) => {
            const fillValue = fill.amount * fill.price;
            const pctOfTotal = (fill.amount / data.filledAmount) * 100;

            return (
              <div
                key={i}
                className="p-3 rounded-xl"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {fill.venueLogo ? (
                      <img src={fill.venueLogo} alt={fill.venue} className="w-5 h-5 rounded" />
                    ) : (
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{ background: `${c.text3}22` }}
                      >
                        <span style={{ fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: c.text3 }}>
                          {fill.venue[0]}
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                      {fill.venue}
                    </span>
                  </div>
                  <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                    {fmtPct(pctOfTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Amount</p>
                    <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
                      {fmtAmount(fill.amount)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Price</p>
                    <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
                      {fmtPrice(fill.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Value</p>
                    <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
                      {fmtUsd(fillValue)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: c.divider }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pctOfTotal}%`,
                      background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* Order Summary */}
      <TrCard className="p-4">
        <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, marginBottom: 12 }}>
          Order Summary
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Requested</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
              {fmtAmount(data.requestedAmount)} {data.symbol.split('/')[0]}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Filled</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtAmount(data.filledAmount)} {data.symbol.split('/')[0]}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Total Value</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
              {fmtUsd(data.filledAmount * data.averageFillPrice)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Total Fees</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2, fontFamily: 'monospace' }}>
              {fmtUsd(totalFees)}
            </span>
          </div>
        </div>
      </TrCard>

      {/* Timing */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} color={c.text3} />
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
            Execution Timeline
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 2 }}>
              Submitted
            </p>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
              {new Date(data.submittedAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>
          <div className="flex-1 mx-3">
            <div className="h-px" style={{ background: c.divider }} />
          </div>
          <div className="text-center px-2">
            <p style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: '#3B82F6' }}>
              {formatExecutionTime(data.executionTimeMs)}
            </p>
          </div>
          <div className="flex-1 mx-3">
            <div className="h-px" style={{ background: c.divider }} />
          </div>
          <div className="text-right">
            <p style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 2 }}>
              Completed
            </p>
            <p style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
              {new Date(data.completedAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </div>
      </TrCard>

      {/* Savings Highlight */}
      {hasSavings && (
        <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-start gap-3">
            <TrendingUp size={18} color="#10B981" className="shrink-0 mt-1" />
            <div className="flex-1">
              <p style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#10B981', marginBottom: 4 }}>
                Saved {fmtUsd(data.savingsVsSingleVenue)} vs Best Single Venue
              </p>
              <p style={{ fontSize: FONT_SCALE.xs, color: c.text3, lineHeight: 1.5 }}>
                Smart order routing across {data.fills.length} venues secured better pricing than
                executing on any single exchange.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl min-h-12"
          style={{
            fontSize: FONT_SCALE.sm,
            fontWeight: FONT_WEIGHT.bold,
            color: '#fff',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          Close Report
        </button>
      )}
    </div>
  );
}
