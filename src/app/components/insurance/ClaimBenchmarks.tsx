import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Clock, DollarSign, CheckCircle, Users, Sparkles, AlertTriangle } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { φ, φSpace } from '../../utils/golden';
import { fmtVnd } from '../../data/formatNumber';
import { TrCard } from '../ui/TrCard';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════
   ClaimBenchmarks — Compare user's claim to platform averages
   + Claim Success Prediction
   ═══════════════════════════════════════════════════════════ */

interface ClaimBenchmarksProps {
  /** User's claim amount */
  claimAmount: number;
  /** User's claim reason */
  claimReason: string;
  /** User's claim status */
  claimStatus: string;
  /** How long the claim has been processing (hours) */
  processingHours: number;
  /** Coverage percentage user receives */
  coveragePct: number;
  /** User's insurance tier for prediction */
  userTier?: 'basic' | 'verified' | 'pro' | 'elite';
  /** Number of evidence items attached */
  evidenceCount?: number;
  /** TIER 7.1: Merchant rating (1-5 scale) for enhanced prediction */
  merchantRating?: number;
  /** TIER 7.1: Merchant response time in minutes for enhanced prediction */
  merchantResponseTimeMinutes?: number;
}

/* ─── Platform Benchmark Data ─── */
const BENCHMARKS = {
  avgClaimAmount: 15_200_000,
  medianClaimAmount: 10_500_000,
  avgResolutionHours: 36,
  medianResolutionHours: 28,
  avgCoveragePct: 78,
  approvalRate: 78.5,
  totalClaimsProcessed: 847,
  avgEvidenceCount: 3.2,
  reasonDistribution: {
    fraud: 42,
    chargeback: 28,
    dispute_error: 18,
    other: 12,
  } as Record<string, number>,
  amountPercentiles: {
    p25: 5_000_000,
    p50: 10_500_000,
    p75: 22_000_000,
    p90: 45_000_000,
  },
  resolutionPercentiles: {
    p25: 12,
    p50: 28,
    p75: 48,
    p90: 72,
  },
};

/* ─── Approval rates by reason (historical) ─── */
const REASON_APPROVAL_RATES: Record<string, number> = {
  fraud: 82,
  chargeback: 71,
  dispute_error: 88,
  other: 62,
};

/* ─── Tier multipliers for prediction ─── */
const TIER_MULTIPLIERS: Record<string, number> = {
  basic: 0.7,
  verified: 0.9,
  pro: 1.05,
  elite: 1.15,
};

type Comparison = 'above' | 'below' | 'average';

function getComparison(value: number, avg: number, threshold: number = 0.15): Comparison {
  const diff = (value - avg) / avg;
  if (diff > threshold) return 'above';
  if (diff < -threshold) return 'below';
  return 'average';
}

function getComparisonConfig(comp: Comparison) {
  switch (comp) {
    case 'above':
      return { icon: TrendingUp, color: '#F59E0B', label: 'Cao hơn TB' };
    case 'below':
      return { icon: TrendingDown, color: '#10B981', label: 'Thấp hơn TB' };
    case 'average':
      return { icon: Minus, color: '#3B82F6', label: 'Gần trung bình' };
  }
}

function getAmountPercentile(amount: number): string {
  if (amount <= BENCHMARKS.amountPercentiles.p25) return 'Top 25% thấp nhất';
  if (amount <= BENCHMARKS.amountPercentiles.p50) return 'Dưới trung vị';
  if (amount <= BENCHMARKS.amountPercentiles.p75) return 'Trên trung vị';
  return 'Top 10% cao nhất';
}

function getSpeedPercentile(hours: number): string {
  if (hours <= BENCHMARKS.resolutionPercentiles.p25) return 'Nhanh hơn 75% claims';
  if (hours <= BENCHMARKS.resolutionPercentiles.p50) return 'Nhanh hơn 50% claims';
  if (hours <= BENCHMARKS.resolutionPercentiles.p75) return 'Chậm hơn 50% claims';
  return 'Chậm hơn 75% claims';
}

/* ═══════════════════════════════════════════════════════════
   Claim Success Prediction Engine
   ═══════════════════════════════════════════════════════════ */

interface PredictionResult {
  probability: number;
  confidence: 'high' | 'medium' | 'low';
  factors: PredictionFactor[];
  summary: string;
}

interface PredictionFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  detail: string;
}

function calculateSuccessPrediction(
  reason: string,
  tier: string,
  amount: number,
  evidenceCount: number,
  merchantRating?: number,
  merchantResponseTimeMinutes?: number,
): PredictionResult {
  const baseRate = REASON_APPROVAL_RATES[reason] || 65;
  const tierMult = TIER_MULTIPLIERS[tier] || 0.85;
  const tierAdjusted = baseRate * tierMult;

  let amountAdjust = 0;
  if (amount <= BENCHMARKS.amountPercentiles.p25) amountAdjust = 5;
  else if (amount <= BENCHMARKS.amountPercentiles.p50) amountAdjust = 2;
  else if (amount <= BENCHMARKS.amountPercentiles.p75) amountAdjust = -3;
  else amountAdjust = -7;

  let evidenceAdjust = 0;
  if (evidenceCount >= 4) evidenceAdjust = 6;
  else if (evidenceCount >= 3) evidenceAdjust = 3;
  else if (evidenceCount >= 2) evidenceAdjust = 1;
  else if (evidenceCount <= 1) evidenceAdjust = -5;

  let merchantRatingAdjust = 0;
  if (merchantRating !== undefined) {
    if (merchantRating >= 4) merchantRatingAdjust = 5;
    else if (merchantRating >= 3) merchantRatingAdjust = 2;
    else if (merchantRating >= 2) merchantRatingAdjust = -2;
    else if (merchantRating <= 1) merchantRatingAdjust = -5;
  }

  let merchantResponseTimeAdjust = 0;
  if (merchantResponseTimeMinutes !== undefined) {
    if (merchantResponseTimeMinutes <= 10) merchantResponseTimeAdjust = 5;
    else if (merchantResponseTimeMinutes <= 30) merchantResponseTimeAdjust = 2;
    else if (merchantResponseTimeMinutes <= 60) merchantResponseTimeAdjust = -2;
    else if (merchantResponseTimeMinutes > 60) merchantResponseTimeAdjust = -5;
  }

  const raw = tierAdjusted + amountAdjust + evidenceAdjust + merchantRatingAdjust + merchantResponseTimeAdjust;
  const probability = Math.min(95, Math.max(15, Math.round(raw)));

  const confidence: 'high' | 'medium' | 'low' =
    evidenceCount >= 3 && (REASON_APPROVAL_RATES[reason] !== undefined)
      ? 'high'
      : evidenceCount >= 2
        ? 'medium'
        : 'low';

  const factors: PredictionFactor[] = [];

  const reasonLabels: Record<string, string> = {
    fraud: 'Gian lận',
    chargeback: 'Chargeback',
    dispute_error: 'Lỗi dispute',
    other: 'Khác',
  };
  factors.push({
    label: `Lý do: ${reasonLabels[reason] || reason}`,
    impact: baseRate >= 80 ? 'positive' : baseRate >= 70 ? 'neutral' : 'negative',
    weight: Math.round(baseRate - BENCHMARKS.approvalRate),
    detail: `Tỷ lệ duyệt ${baseRate}% cho lý do này`,
  });

  const tierNames: Record<string, string> = {
    basic: 'Thường',
    verified: 'Xác minh',
    pro: 'Pro',
    elite: 'Elite',
  };
  factors.push({
    label: `Tier: ${tierNames[tier] || tier}`,
    impact: tierMult >= 1 ? 'positive' : tierMult >= 0.85 ? 'neutral' : 'negative',
    weight: Math.round((tierMult - 1) * baseRate),
    detail: tierMult >= 1 ? 'Tier cao tăng khả năng duyệt' : 'Nâng tier để tăng khả năng duyệt',
  });

  factors.push({
    label: 'Số tiền yêu cầu',
    impact: amountAdjust > 0 ? 'positive' : amountAdjust < 0 ? 'negative' : 'neutral',
    weight: amountAdjust,
    detail: amountAdjust >= 0
      ? 'Số tiền thấp hơn trung bình — ít bị soát xét'
      : 'Số tiền cao — cần bằng chứng kỹ hơn',
  });

  factors.push({
    label: `Bằng chứng (${evidenceCount} file)`,
    impact: evidenceAdjust > 0 ? 'positive' : evidenceAdjust < 0 ? 'negative' : 'neutral',
    weight: evidenceAdjust,
    detail: evidenceCount >= 3
      ? `Nhiều hơn TB nền tảng (${BENCHMARKS.avgEvidenceCount} file)`
      : `Nên bổ sung thêm (TB: ${BENCHMARKS.avgEvidenceCount} file)`,
  });

  if (merchantRating !== undefined) {
    factors.push({
      label: 'Xếp hạng doanh nghiệp',
      impact: merchantRatingAdjust > 0 ? 'positive' : merchantRatingAdjust < 0 ? 'negative' : 'neutral',
      weight: merchantRatingAdjust,
      detail: merchantRatingAdjust >= 0
        ? 'Xếp hạng cao — tin cậy hơn'
        : 'Xếp hạng thấp — cần nâng cấp doanh nghiệp',
    });
  }

  if (merchantResponseTimeMinutes !== undefined) {
    factors.push({
      label: 'Thời gian phản hồi doanh nghiệp',
      impact: merchantResponseTimeAdjust > 0 ? 'positive' : merchantResponseTimeAdjust < 0 ? 'negative' : 'neutral',
      weight: merchantResponseTimeAdjust,
      detail: merchantResponseTimeAdjust >= 0
        ? 'Phản hồi nhanh — tin cậy hơn'
        : 'Phản hồi chậm — cần nâng cấp doanh nghiệp',
    });
  }

  const summary = probability >= 80
    ? 'Khả năng duyệt cao — hồ sơ đầy đủ và phù hợp'
    : probability >= 65
      ? 'Khả năng duyệt khá — có thể bổ sung thêm bằng chứng'
      : probability >= 50
        ? 'Khả năng duyệt trung bình — nên bổ sung thông tin'
        : 'Khả năng duyệt thấp — cần nâng tier hoặc bổ sung bằng chứng';

  return { probability, confidence, factors, summary };
}

/* ─── Animated circular progress via CSS ─── */
function CircularProgress({ probability, color }: { probability: number; color: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (mounted ? probability / 100 : 0));

  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle
          cx={40} cy={40} r={r}
          fill="none"
          stroke="var(--surface2, #F1F5F9)"
          strokeWidth={6}
        />
        <circle
          cx={40} cy={40} r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          style={{
            color,
            fontSize: 22,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.4s ease 0.5s',
          }}
        >
          {probability}%
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export function ClaimBenchmarks({
  claimAmount,
  claimReason,
  claimStatus,
  processingHours,
  coveragePct,
  userTier = 'pro',
  evidenceCount = 3,
  merchantRating,
  merchantResponseTimeMinutes,
}: ClaimBenchmarksProps) {
  const c = useThemeColors();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const amountComp = getComparison(claimAmount, BENCHMARKS.avgClaimAmount);
  const speedComp = getComparison(processingHours, BENCHMARKS.avgResolutionHours);

  const amountCfg = getComparisonConfig(amountComp);
  const speedCfg = getComparisonConfig(speedComp);

  const amountPct = getAmountPercentile(claimAmount);
  const speedPct = getSpeedPercentile(processingHours);

  // Success prediction
  const prediction = calculateSuccessPrediction(claimReason, userTier, claimAmount, evidenceCount, merchantRating, merchantResponseTimeMinutes);
  const showPrediction = claimStatus === 'pending' || claimStatus === 'reviewing';

  const predictionColor = prediction.probability >= 75
    ? '#10B981'
    : prediction.probability >= 55
      ? '#F59E0B'
      : '#EF4444';

  const confidenceLabels: Record<string, string> = {
    high: 'Độ tin cậy cao',
    medium: 'Độ tin cậy trung bình',
    low: 'Độ tin cậy thấp',
  };

  return (
    <div className="flex flex-col" style={{ gap: φSpace[4] }}>
      {/* ═══ Success Prediction Card ═══ */}
      {showPrediction && (
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <TrCard className="p-5" style={{ border: `1.5px solid ${hexToRgba(predictionColor, 25)}` }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} color={predictionColor} />
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                  Dự đoán khả năng duyệt
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{ background: hexToRgba(predictionColor, 10) }}
              >
                <span style={{ color: predictionColor, fontSize: 10, fontWeight: 600 }}>
                  {confidenceLabels[prediction.confidence]}
                </span>
              </div>
            </div>

            {/* Circular progress + summary */}
            <div className="flex items-center gap-5 mb-4">
              <CircularProgress probability={prediction.probability} color={predictionColor} />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5, marginBottom: 4 }}>
                  {prediction.summary}
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  Dựa trên phân tích {BENCHMARKS.totalClaimsProcessed.toLocaleString('vi-VN')} claims tương tự trên nền tảng
                </p>
              </div>
            </div>

            {/* Prediction Factors */}
            <div className="flex flex-col gap-2">
              {prediction.factors.map((factor, idx) => {
                const factorColor = factor.impact === 'positive'
                  ? '#10B981'
                  : factor.impact === 'negative'
                    ? '#EF4444'
                    : '#6B7280';
                const FactorIcon = factor.impact === 'positive'
                  ? TrendingUp
                  : factor.impact === 'negative'
                    ? TrendingDown
                    : Minus;

                return (
                  <div
                    key={factor.label}
                    className="p-2.5 rounded-xl flex items-start gap-2.5"
                    style={{
                      background: c.surface2,
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
                      transition: `opacity 0.3s ease ${0.1 * idx + 0.4}s, transform 0.3s ease ${0.1 * idx + 0.4}s`,
                    }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: hexToRgba(factorColor, 12) }}
                    >
                      <FactorIcon size={12} color={factorColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span style={{ color: c.text1, fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
                          {factor.label}
                        </span>
                        <span style={{
                          color: factorColor,
                          fontSize: 10,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {factor.weight > 0 ? '+' : ''}{factor.weight}%
                        </span>
                      </div>
                      <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                        {factor.detail}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div
              className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(107,114,128,0.06)' }}
            >
              <AlertTriangle size={11} color={c.text3} className="shrink-0 mt-0.5" />
              <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                Dự đoán dựa trên dữ liệu lịch sử, không đảm bảo kết quả. Mỗi claim đều được xem xét độc lập.
              </span>
            </div>
          </TrCard>
        </div>
      )}

      {/* ═══ Original Benchmarks Card ═══ */}
      <TrCard className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} color="#8B5CF6" />
          <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
            So sánh với nền tảng
          </span>
        </div>
        <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 16, marginTop: -8 }}>
          So sánh claim của bạn với {BENCHMARKS.totalClaimsProcessed.toLocaleString('vi-VN')} claims đã xử lý
        </p>

        {/* Comparison metrics */}
        <div className="flex flex-col" style={{ gap: φSpace[4] }}>

          {/* Amount comparison */}
          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={14} color={c.text3} />
                <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Số tiền yêu cầu
                </span>
              </div>
              <div className="flex items-center gap-1">
                <amountCfg.icon size={12} color={amountCfg.color} />
                <span style={{ color: amountCfg.color, fontSize: 10, fontWeight: 700 }}>
                  {amountCfg.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-end justify-between mb-1">
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtVnd(claimAmount)} d
                  </span>
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    TB: {fmtVnd(BENCHMARKS.avgClaimAmount)} d
                  </span>
                </div>
                <div className="relative w-full rounded-full" style={{ height: 8, background: `${c.divider}` }}>
                  <div
                    className="absolute top-0 w-0.5 h-full"
                    style={{
                      left: `${Math.min(90, (BENCHMARKS.avgClaimAmount / BENCHMARKS.amountPercentiles.p90) * 100)}%`,
                      background: c.text3,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (claimAmount / BENCHMARKS.amountPercentiles.p90) * 100)}%`,
                      background: amountCfg.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            </div>
            <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>{amountPct}</span>
          </div>

          {/* Processing speed comparison */}
          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock size={14} color={c.text3} />
                <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Thời gian xử lý
                </span>
              </div>
              <div className="flex items-center gap-1">
                <speedCfg.icon size={12} color={speedCfg.color} />
                <span style={{ color: speedCfg.color, fontSize: 10, fontWeight: 700 }}>
                  {speedCfg.label}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between mb-1">
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {processingHours}h
              </span>
              <span style={{ color: c.text3, fontSize: 10 }}>
                TB: {BENCHMARKS.avgResolutionHours}h | Trung vị: {BENCHMARKS.medianResolutionHours}h
              </span>
            </div>
            <div className="relative w-full rounded-full" style={{ height: 8, background: `${c.divider}` }}>
              <div
                className="absolute top-0 w-0.5 h-full"
                style={{
                  left: `${Math.min(90, (BENCHMARKS.avgResolutionHours / BENCHMARKS.resolutionPercentiles.p90) * 100)}%`,
                  background: c.text3,
                }}
              />
              <div
                className="absolute top-0 h-full rounded-full"
                style={{
                  width: `${Math.min(100, (processingHours / BENCHMARKS.resolutionPercentiles.p90) * 100)}%`,
                  background: speedCfg.color,
                  opacity: 0.7,
                }}
              />
            </div>
            <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginTop: 4, display: 'inline-block' }}>
              {speedPct}
            </span>
          </div>

          {/* Coverage comparison */}
          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} color={c.text3} />
                <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                  Tỷ lệ bảo hiểm
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span style={{
                    color: coveragePct >= BENCHMARKS.avgCoveragePct ? '#10B981' : '#F59E0B',
                    fontSize: φ.base,
                    fontWeight: 700,
                  }}>
                    {coveragePct}%
                  </span>
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    TB nền tảng: {BENCHMARKS.avgCoveragePct}%
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: c.divider }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${coveragePct}%`,
                      background: coveragePct >= BENCHMARKS.avgCoveragePct
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                    }}
                  />
                </div>
              </div>
            </div>
            <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5, marginTop: 4, display: 'inline-block' }}>
              {coveragePct >= BENCHMARKS.avgCoveragePct
                ? `Cao hơn ${coveragePct - BENCHMARKS.avgCoveragePct}% so với TB nền tảng`
                : `Thấp hơn ${BENCHMARKS.avgCoveragePct - coveragePct}% so với TB nền tảng`
              }
            </span>
          </div>

          {/* Reason distribution */}
          <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} color={c.text3} />
              <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                Phân bố lý do claim
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {Object.entries(BENCHMARKS.reasonDistribution).map(([reason, pct]) => {
                const labels: Record<string, string> = {
                  fraud: 'Gian lận',
                  chargeback: 'Chargeback',
                  dispute_error: 'Lỗi dispute',
                  other: 'Khác',
                };
                const isUserReason = reason === claimReason;
                return (
                  <div key={reason} className="flex items-center gap-2">
                    <span style={{
                      color: isUserReason ? '#3B82F6' : c.text3,
                      fontSize: 11,
                      fontWeight: isUserReason ? 700 : 500,
                      width: 80,
                      lineHeight: 1.5,
                    }}>
                      {labels[reason] || reason}
                      {isUserReason && ' *'}
                    </span>
                    <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: c.divider }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: isUserReason ? '#3B82F6' : c.text3,
                          opacity: isUserReason ? 1 : 0.4,
                        }}
                      />
                    </div>
                    <span style={{
                      color: isUserReason ? '#3B82F6' : c.text3,
                      fontSize: 10,
                      fontWeight: isUserReason ? 700 : 500,
                      fontVariantNumeric: 'tabular-nums',
                      width: 28,
                      textAlign: 'right',
                    }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>Tỷ lệ duyệt chung</p>
              <p style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {BENCHMARKS.approvalRate}%
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>Xử lý nhanh nhất</p>
              <p style={{ color: '#3B82F6', fontSize: φ.base, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                4h
              </p>
            </div>
          </div>
        </div>
      </TrCard>
    </div>
  );
}