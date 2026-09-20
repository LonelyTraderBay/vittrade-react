/**
 * ══════════════════════════════════════════════════════════════════
 *  FEE TIER DISPLAY — Sprint 2B: Dynamic Fee Tier
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Star } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtCompact, fmtPct } from '../../data/formatNumber';

export interface FeeTier {
  level: number;
  name: string;
  makerFee: number;
  takerFee: number;
  volume30d: number;
  requiredVolume: number;
  discount: number;
}

const FEE_TIERS: FeeTier[] = [
  { level: 0, name: 'Standard', makerFee: 0.10, takerFee: 0.10, volume30d: 0, requiredVolume: 0, discount: 0 },
  { level: 1, name: 'VIP 1', makerFee: 0.09, takerFee: 0.10, volume30d: 0, requiredVolume: 50000, discount: 10 },
  { level: 2, name: 'VIP 2', makerFee: 0.08, takerFee: 0.09, volume30d: 0, requiredVolume: 250000, discount: 15 },
  { level: 3, name: 'VIP 3', makerFee: 0.06, takerFee: 0.08, volume30d: 0, requiredVolume: 1000000, discount: 25 },
  { level: 4, name: 'VIP 4', makerFee: 0.04, takerFee: 0.06, volume30d: 0, requiredVolume: 5000000, discount: 40 },
  { level: 5, name: 'VIP 5', makerFee: 0.02, takerFee: 0.04, volume30d: 0, requiredVolume: 25000000, discount: 60 },
];

// Mock current user tier
const CURRENT_USER = {
  tier: 1,
  volume30d: 78500,
  holdingDiscount: 5, // Token holding discount
  referralDiscount: 0,
};

interface FeeTierDisplayProps {
  orderType: string; // 'market' | 'limit' | etc.
  total: number;
  className?: string;
}

export function FeeTierDisplay({ orderType, total, className = '' }: FeeTierDisplayProps) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);

  const currentTier = FEE_TIERS[CURRENT_USER.tier];
  const nextTier = FEE_TIERS[CURRENT_USER.tier + 1];
  const isLimitOrder = orderType === 'Giới hạn' || orderType === 'limit';
  const baseFeeRate = isLimitOrder ? currentTier.makerFee : currentTier.takerFee;
  const totalDiscount = CURRENT_USER.holdingDiscount + CURRENT_USER.referralDiscount;
  const effectiveFeeRate = baseFeeRate * (1 - totalDiscount / 100);
  const feeAmount = total * (effectiveFeeRate / 100);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main fee row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between py-1"
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: c.text3, fontSize: 12 }}>
            Phí ({isLimitOrder ? 'Maker' : 'Taker'})
          </span>
          <span className="px-1 py-0.5 rounded text-center"
            style={{
              background: 'rgba(245,158,11,0.1)',
              color: '#F59E0B',
              fontSize: 9, fontWeight: 700, lineHeight: 1,
            }}>
            {currentTier.name}
          </span>
          {totalDiscount > 0 && (
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
              -{totalDiscount}%
            </span>
          )}
          {expanded ? <ChevronUp size={10} color={c.text3} /> : <ChevronDown size={10} color={c.text3} />}
        </div>
        <div className="flex items-center gap-1">
          {totalDiscount > 0 && (
            <span style={{
              color: c.text3, fontSize: 11, textDecoration: 'line-through', fontFamily: 'monospace',
            }}>
              {baseFeeRate.toFixed(2)}%
            </span>
          )}
          <span style={{ color: c.text2, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
            {effectiveFeeRate.toFixed(3)}% ≈ ${feeAmount < 0.01 ? '<0.01' : feeAmount.toFixed(2)}
          </span>
        </div>
      </button>

      {/* Expanded tier info */}
      {expanded && (
        <div className="flex flex-col gap-2 rounded-xl p-3 mt-1"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          {/* Current tier */}
          <div className="flex items-center justify-between">
            <span style={{ color: c.text2, fontSize: 11 }}>Tier hiện tại</span>
            <div className="flex items-center gap-1">
              <Star size={10} color="#F59E0B" />
              <span style={{ color: '#F59E0B', fontSize: 12, fontWeight: 700 }}>{currentTier.name}</span>
            </div>
          </div>

          {/* Fee rates */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg p-2 text-center"
              style={{ background: isLimitOrder ? 'rgba(16,185,129,0.08)' : c.surface }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Maker</p>
              <p style={{
                color: isLimitOrder ? '#10B981' : c.text1,
                fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
              }}>
                {currentTier.makerFee.toFixed(2)}%
              </p>
            </div>
            <div className="flex-1 rounded-lg p-2 text-center"
              style={{ background: !isLimitOrder ? 'rgba(239,68,68,0.08)' : c.surface }}>
              <p style={{ color: c.text3, fontSize: 10 }}>Taker</p>
              <p style={{
                color: !isLimitOrder ? '#EF4444' : c.text1,
                fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
              }}>
                {currentTier.takerFee.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Volume 30d */}
          <div className="flex items-center justify-between">
            <span style={{ color: c.text3, fontSize: 11 }}>KL 30 ngày</span>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
              {fmtCompact(CURRENT_USER.volume30d, { prefix: '$' })}
            </span>
          </div>

          {/* Discounts */}
          {totalDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: 11 }}>Giảm phí (token)</span>
              <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                -{CURRENT_USER.holdingDiscount}%
              </span>
            </div>
          )}

          {/* Next tier progress */}
          {nextTier && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Tiếp theo: {nextTier.name}
                </span>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  {fmtCompact(nextTier.requiredVolume, { prefix: '$' })}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: c.surface3 }}>
                <div className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #F59E0B, #EAB308)',
                    width: `${Math.min((CURRENT_USER.volume30d / nextTier.requiredVolume) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Simple inline fee for confirmation sheets */
export function getEffectiveFee(orderType: string): { rate: number; label: string } {
  const currentTier = FEE_TIERS[CURRENT_USER.tier];
  const isLimitOrder = orderType === 'Giới hạn' || orderType === 'limit';
  const baseFeeRate = isLimitOrder ? currentTier.makerFee : currentTier.takerFee;
  const totalDiscount = CURRENT_USER.holdingDiscount + CURRENT_USER.referralDiscount;
  const effectiveFeeRate = baseFeeRate * (1 - totalDiscount / 100);
  return {
    rate: effectiveFeeRate / 100,
    label: `${effectiveFeeRate.toFixed(3)}% (${currentTier.name}${totalDiscount > 0 ? `, -${totalDiscount}%` : ''})`,
  };
}
