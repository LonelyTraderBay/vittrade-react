/**
 * ══════════════════════════════════════════════════════════
 *  ArenaRewardComponents — Enterprise Reward Distribution UI
 * ══════════════════════════════════════════════════════════
 *  Covers audit gaps:
 *  C1 — PoolBreakdownCard (Fee breakdown on ChallengeDetailPage)
 *  C2 — JoinPreviewSheet ("You Will Receive" before joining)
 *  C3 — DistributionInfoCard (Distribution type on detail page)
 *  I5 — RefundPolicyBanner (Refund policy visible to participants)
 *  I6 — RewardAnalyticsCard (Reward history analytics)
 *  N7 — DistributionComparisonSheet (Side-by-side comparison)
 */

import React, { useState } from 'react';
import {
  X, Trophy, AlertTriangle, Info, Shield, TrendingUp,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Receipt,
  RefreshCw, Users, Target, Award, Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { φ } from '../../utils/golden';
import { fmtPoints } from '../../data/arenaData';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   C1: PoolBreakdownCard — Full fee transparency
   ═══════════════════════════════════════════ */

interface PoolBreakdownProps {
  grossPool: number;
  entryPoints: number;
  slotsFilled: number;
  slotsTotal: number;
  platformFeePct: number;
  creatorCutPct: number;
  consolationEnabled: boolean;
  consolationPct: number;
  bonusPool: number;
  dynamicPool?: boolean;
  dynamicPoolMin?: number;
}

export function PoolBreakdownCard({
  grossPool, entryPoints, slotsFilled, slotsTotal,
  platformFeePct = 10, creatorCutPct = 0,
  consolationEnabled = false, consolationPct = 0,
  bonusPool = 0, dynamicPool, dynamicPoolMin,
}: PoolBreakdownProps) {
  const c = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  const { hapticSelection } = useHaptic();

  const platformFee = Math.round(grossPool * platformFeePct / 100);
  const creatorAmount = Math.round(grossPool * creatorCutPct / 100);
  const afterDeductions = grossPool - platformFee - creatorAmount;
  const consolationAmount = consolationEnabled ? Math.round(afterDeductions * consolationPct / 100) : 0;
  const netPool = afterDeductions - consolationAmount;

  const rows: { label: string; value: string; color: string; icon?: typeof Receipt; bold?: boolean; indent?: boolean }[] = [
    { label: `Gross Pool (${slotsFilled}×${fmtPoints(entryPoints)}${bonusPool > 0 ? ` + ${fmtPoints(bonusPool)} bonus` : ''})`, value: `${fmtPoints(grossPool)} pts`, color: c.text1, bold: true },
    { label: `Phí vận hành (${platformFeePct}%)`, value: `−${fmtPoints(platformFee)}`, color: '#EF4444', icon: Receipt, indent: true },
  ];

  if (creatorCutPct > 0) {
    rows.push({ label: `Creator cut (${creatorCutPct}%)`, value: `−${fmtPoints(creatorAmount)}`, color: '#EF4444', indent: true });
  }
  if (consolationEnabled && consolationPct > 0) {
    rows.push({ label: `Thưởng an ủi (${consolationPct}%)`, value: `−${fmtPoints(consolationAmount)}`, color: '#8B5CF6', indent: true });
  }
  rows.push({ label: 'Net Pool (cho winners)', value: `${fmtPoints(netPool)} pts`, color: '#10B981', bold: true });

  return (
    <TrCard className="p-4">
      <button
        onClick={() => { setExpanded(!expanded); hapticSelection(); }}
        className="w-full flex items-center justify-between active:opacity-70"
        style={{ minHeight: 44 }}
      >
        <div className="flex items-center gap-2">
          <Receipt size={14} color="#F59E0B" />
          <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Chi tiết Pool & Phí</span>
          <span className="px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 9, fontWeight: 700 }}>
            MINH BẠCH
          </span>
        </div>
        {expanded ? <ChevronUp size={16} color={c.text3} /> : <ChevronDown size={16} color={c.text3} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              {rows.map((row, i) => (
                <div key={i} className="flex items-center justify-between"
                  style={{ paddingLeft: row.indent ? 12 : 0 }}>
                  <div className="flex items-center gap-1.5">
                    {row.indent && <div className="w-1 h-1 rounded-full" style={{ background: row.color }} />}
                    <span style={{
                      color: row.bold ? c.text1 : c.text3,
                      fontSize: row.bold ? φ.xs : 11,
                      fontWeight: row.bold ? 700 : 500,
                    }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{
                    color: row.color,
                    fontSize: row.bold ? φ.sm : φ.xs,
                    fontWeight: row.bold ? 700 : 600,
                    fontFamily: 'monospace',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}

              {/* Dynamic Pool note */}
              {dynamicPool && (
                <div className="flex items-start gap-2 mt-1 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
                  <Users size={10} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <span style={{ color: '#3B82F6', fontSize: 10, lineHeight: 1.4 }}>
                    Dynamic Pool: pool thay đổi theo số người thực tế
                    {dynamicPoolMin ? `. Tối thiểu ${dynamicPoolMin} người — dưới ngưỡng sẽ tự hủy + hoàn 100%.` : '.'}
                  </span>
                </div>
              )}

              {/* Pool fill indicator */}
              <div className="flex items-center justify-between mt-1">
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Slot đã điền: {slotsFilled}/{slotsTotal}
                </span>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Pool {slotsFilled < slotsTotal ? 'đang tăng' : 'đã đầy'}
                </span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: c.surface2 }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.round((slotsFilled / slotsTotal) * 100)}%`,
                  background: 'linear-gradient(90deg, #F59E0B 0%, #10B981 100%)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrCard>
  );
}


/* ═══════════════════════════════════════════
   C3: DistributionInfoCard — Show distribution type
   ═══════════════════════════════════════════ */

interface DistributionInfoProps {
  distLabel: string;
  distType: string;
  tiers: { rank: string; pct: number }[];
  netPool: number;
  consolationEnabled?: boolean;
  consolationPct?: number;
}

const TIER_COLORS = ['#F59E0B', '#94A3B8', '#CD7F32', '#8B5CF6', '#3B82F6', '#10B981'];

export function DistributionInfoCard({
  distLabel, distType, tiers, netPool,
  consolationEnabled, consolationPct,
}: DistributionInfoProps) {
  const c = useThemeColors();

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={14} color="#F59E0B" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Cách chia thưởng</span>
        <span className="px-2 py-0.5 rounded-md"
          style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
          {distLabel}
        </span>
      </div>

      {/* Visual bar */}
      {tiers.length > 1 ? (
        <div className="flex flex-col gap-2">
          <div className="flex h-4 rounded-lg overflow-hidden" style={{ background: c.surface2 }}>
            {tiers.map((t, i) => {
              const w = Math.max(t.pct, 5);
              return (
                <div key={i} className="flex items-center justify-center" style={{
                  width: `${w}%`,
                  background: TIER_COLORS[i % TIER_COLORS.length],
                  minWidth: w > 0 ? 20 : 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>{t.pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Tier breakdown */}
          <div className="flex flex-col gap-1.5">
            {tiers.map((t, i) => {
              const pts = Math.round(netPool * t.pct / 100);
              return (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                  style={{ background: hexToRgba(TIER_COLORS[i % TIER_COLORS.length], 8) }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
                    <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{t.rank}</span>
                    <span style={{ color: c.text3, fontSize: 10 }}>({t.pct}%)</span>
                  </div>
                  <span style={{
                    color: TIER_COLORS[i % TIER_COLORS.length],
                    fontSize: 12, fontWeight: 700, fontFamily: 'monospace',
                  }}>
                    ~{fmtPoints(pts)} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.04)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ background: '#F59E0B' }} />
              <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{tiers[0]?.rank || distLabel}</span>
            </div>
            <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtPoints(netPool)} pts
            </span>
          </div>
        </div>
      )}

      {/* Consolation note */}
      {consolationEnabled && consolationPct && consolationPct > 0 && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(139,92,246,0.06)' }}>
          <span style={{ fontSize: 12 }}>🎁</span>
          <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>
            Thưởng an ủi: {consolationPct}% net pool chia cho người không thắng
          </span>
        </div>
      )}
    </TrCard>
  );
}


/* ═══════════════════════════════════════════
   C2: JoinPreviewSheet — "You Will Receive" before joining
   ═══════════════════════════════════════════ */

interface JoinPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirmJoin: () => void;
  challengeTitle: string;
  entryPoints: number;
  grossPool: number;
  distLabel: string;
  tiers: { rank: string; pct: number }[];
  platformFeePct: number;
  creatorCutPct: number;
  consolationEnabled: boolean;
  consolationPct: number;
  slotsFilled: number;
  slotsTotal: number;
  refundPolicy?: string;
}

export function JoinPreviewSheet({
  open, onClose, onConfirmJoin,
  challengeTitle, entryPoints, grossPool,
  distLabel, tiers, platformFeePct, creatorCutPct,
  consolationEnabled, consolationPct,
  slotsFilled, slotsTotal, refundPolicy,
}: JoinPreviewSheetProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  const platformFee = Math.round(grossPool * platformFeePct / 100);
  const creatorAmount = Math.round(grossPool * creatorCutPct / 100);
  const afterDeductions = grossPool - platformFee - creatorAmount;
  const consolationAmount = consolationEnabled ? Math.round(afterDeductions * consolationPct / 100) : 0;
  const netPool = afterDeductions - consolationAmount;

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="Xác nhận tham gia">
          <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }} className="line-clamp-1">{challengeTitle}</p>

          {/* You Pay */}
          <TrCard className="p-4 mt-3" accentBorder="rgba(239,68,68,0.3)">
            <p style={{ color: c.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, marginBottom: 4 }}>BẠN TRẢ</p>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: φ.sm }}>Entry Points</span>
              <span style={{ color: '#EF4444', fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
                −{fmtPoints(entryPoints)} pts
              </span>
            </div>
          </TrCard>

          {/* You May Receive */}
          <TrCard className="p-4" accentBorder="rgba(16,185,129,0.3)">
            <p style={{ color: c.text3, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, marginBottom: 8 }}>BẠN CÓ THỂ NHẬN (ước tính)</p>
            <div className="flex flex-col gap-2">
              {tiers.map((t, i) => {
                const pts = Math.round(netPool * t.pct / 100);
                const roi = entryPoints > 0 ? ((pts / entryPoints - 1) * 100).toFixed(0) : '0';
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: hexToRgba(TIER_COLORS[i % TIER_COLORS.length], 8) }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ background: TIER_COLORS[i % TIER_COLORS.length] }} />
                      <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{t.rank}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{
                        color: TIER_COLORS[i % TIER_COLORS.length],
                        fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        +{fmtPoints(pts)} pts
                      </span>
                      {Number(roi) > 0 && (
                        <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>
                          +{roi}% ROI
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {consolationEnabled && consolationPct > 0 && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(139,92,246,0.04)' }}>
                <span style={{ fontSize: 10 }}>🎁</span>
                <span style={{ color: '#8B5CF6', fontSize: 10 }}>
                  Không thắng: ~consolation prize
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-3 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
              <Info size={10} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 9, lineHeight: 1.4 }}>
                Ước tính dựa trên {slotsFilled}/{slotsTotal} slot hiện tại. Pool sẽ thay đổi khi có thêm người tham gia.
              </span>
            </div>
          </TrCard>

          {/* Fee summary */}
          <TrCard className="p-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Phương thức chia thưởng</span>
                <span style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 600 }}>{distLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Phí vận hành</span>
                <span style={{ color: c.text2, fontSize: φ.xs }}>{platformFeePct}%</span>
              </div>
              {creatorCutPct > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Creator cut</span>
                  <span style={{ color: c.text2, fontSize: φ.xs }}>{creatorCutPct}%</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1.5" style={{ borderTop: `1px solid ${c.divider}` }}>
                <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700 }}>Net Pool (cho winners)</span>
                <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>
                  {fmtPoints(netPool)} pts
                </span>
              </div>
            </div>
          </TrCard>

          {/* I5: Refund Policy */}
          {refundPolicy && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <RefreshCw size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: '#3B82F6', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>Chính sách hoàn điểm</p>
                <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>{refundPolicy}</p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg"
            style={{ background: c.surface2 }}>
            <Shield size={10} color={c.text3} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5 }}>
              Entry points bị trừ ngay khi tham gia. Arena Points không phải tài sản tài chính và không có giá trị tiền tệ.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onConfirmJoin(); hapticSelection(); }}
            className="w-full py-4 rounded-2xl active:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              fontSize: φ.body,
              fontWeight: 700,
              minHeight: 52,
            }}
          >
            Xác nhận tham gia · −{fmtPoints(entryPoints)} pts
          </button>
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   I5: RefundPolicyBanner — Visible refund policy
   ═══════════════════════════════════════════ */

export function RefundPolicyBanner({ policy }: { policy: string }) {
  const c = useThemeColors();
  return (
    <TrCard className="p-3.5 flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(59,130,246,0.08)' }}>
        <RefreshCw size={14} color="#3B82F6" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 700, marginBottom: 2 }}>Chính sách hoàn điểm</p>
        <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{policy}</p>
      </div>
    </TrCard>
  );
}


/* ═══════════════════════════════════════════
   I6: RewardAnalyticsCard — Reward history on MyArenaPage
   ═══════════════════════════════════════════ */

interface RewardAnalyticsProps {
  totalPayouts: number;
  avgROI: number;
  largestPayout: number;
  winsByDistType: { type: string; label: string; wins: number; total: number }[];
  recentPayouts: { challengeId: string; title: string; amount: number; date: string; distType: string; rank: number }[];
  onViewChallenge?: (id: string) => void;
}

export function RewardAnalyticsCard({
  totalPayouts, avgROI, largestPayout,
  winsByDistType, recentPayouts, onViewChallenge,
}: RewardAnalyticsProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [expanded, setExpanded] = useState(false);

  const distColors: Record<string, string> = {
    top3: '#F59E0B',
    winner_all: '#EF4444',
    equal_split: '#10B981',
    proportional: '#3B82F6',
    top5: '#8B5CF6',
    top10pct: '#EC4899',
  };

  return (
    <TrCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} color="#F59E0B" />
        <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Phân tích phần thưởng</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Tổng lần nhận', value: totalPayouts.toString(), color: '#3B82F6' },
          { label: 'ROI trung bình', value: `+${avgROI}%`, color: '#10B981' },
          { label: 'Lớn nhất', value: `${fmtPoints(largestPayout)}`, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="text-center px-2 py-2.5 rounded-xl" style={{ background: c.surface2 }}>
            <p style={{ color: s.color, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Win rate by distribution type */}
      <div className="mb-3">
        <p style={{ color: c.text2, fontSize: 10, fontWeight: 600, letterSpacing: 0.3, marginBottom: 6 }}>
          TỶ LỆ THẮNG THEO LOẠI CHIA THƯỞNG
        </p>
        <div className="flex flex-col gap-1.5">
          {winsByDistType.map(item => {
            const winRate = item.total > 0 ? Math.round((item.wins / item.total) * 100) : 0;
            const barColor = distColors[item.type] || '#94A3B8';
            return (
              <div key={item.type} className="flex items-center gap-2">
                <span style={{ color: c.text2, fontSize: 10, fontWeight: 600, minWidth: 80, whiteSpace: 'nowrap' as const }} className="truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: c.surface2 }}>
                  <div className="h-full rounded-sm" style={{
                    width: `${Math.max(5, winRate)}%`,
                    background: barColor,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <span style={{ color: barColor, fontSize: 10, fontWeight: 700, minWidth: 30, textAlign: 'right' as const }}>
                  {item.wins}/{item.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent payouts toggle */}
      <button
        onClick={() => { setExpanded(!expanded); hapticSelection(); }}
        className="w-full flex items-center justify-between py-2 active:opacity-70"
        style={{ borderTop: `1px solid ${c.divider}`, minHeight: 36 }}
      >
        <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>Lịch sử nhận thưởng gần đây</span>
        {expanded ? <ChevronUp size={14} color={c.text3} /> : <ChevronDown size={14} color={c.text3} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5">
              {recentPayouts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { if (onViewChallenge) { onViewChallenge(p.challengeId); hapticSelection(); } }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg active:opacity-70"
                  style={{ background: c.surface2, minHeight: 44 }}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p style={{ color: c.text1, fontSize: 11, fontWeight: 600 }} className="truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color: c.text3, fontSize: 9 }}>{p.date}</span>
                      <span style={{ color: c.text3, fontSize: 9 }}>·</span>
                      <span style={{ color: c.text3, fontSize: 9 }}>{p.distType}</span>
                      {p.rank > 0 && (
                        <span className="px-1 py-0.5 rounded" style={{
                          background: p.rank <= 3 ? hexToRgba(['#F59E0B', '#94A3B8', '#CD7F32'][p.rank - 1], 15) : c.surface2,
                          color: p.rank <= 3 ? ['#F59E0B', '#94A3B8', '#CD7F32'][p.rank - 1] : c.text3,
                          fontSize: 8, fontWeight: 700,
                        }}>
                          #{p.rank}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    color: p.amount > 0 ? '#10B981' : '#EF4444',
                    fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace',
                  }}>
                    {p.amount > 0 ? '+' : ''}{fmtPoints(Math.abs(p.amount))}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrCard>
  );
}


/* ═══════════════════════════════════════════
   N7: DistributionComparisonSheet — Side-by-side comparison
   ═══════════════════════════════════════════ */

const COMPARISON_PRESETS: { id: string; label: string; tiers: { rank: string; pct: number }[] }[] = [
  { id: 'winner_all', label: 'Winner All', tiers: [{ rank: '1st', pct: 100 }] },
  { id: 'top3', label: 'Top 3', tiers: [{ rank: '1st', pct: 60 }, { rank: '2nd', pct: 25 }, { rank: '3rd', pct: 15 }] },
  { id: 'top5', label: 'Top 5', tiers: [{ rank: '1st', pct: 40 }, { rank: '2nd', pct: 25 }, { rank: '3rd', pct: 15 }, { rank: '4th', pct: 12 }, { rank: '5th', pct: 8 }] },
  { id: 'equal', label: 'Chia đều', tiers: [{ rank: 'Tất cả', pct: 100 }] },
];

interface ComparisonSheetProps {
  open: boolean;
  onClose: () => void;
  entryPoints: number;
  maxParticipants: number;
  platformFeePct: number;
}

export function DistributionComparisonSheet({
  open, onClose, entryPoints, maxParticipants, platformFeePct,
}: ComparisonSheetProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const [selected, setSelected] = useState<string[]>(['winner_all', 'top3']);

  const grossPool = entryPoints * maxParticipants;
  const netPool = grossPool - Math.round(grossPool * platformFeePct / 100);

  const toggle = (id: string) => {
    hapticSelection();
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  };

  return (
    <BottomSheetV2 open={open} onClose={onClose} title="So sánh cách chia thưởng">
          <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>
            Chọn tối đa 3 loại để so sánh (Net Pool: {fmtPoints(netPool)} pts)
          </p>

          {/* Selector chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {COMPARISON_PRESETS.map(p => {
              const active = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className="px-3 py-2 rounded-xl active:opacity-70"
                  style={{
                    background: active ? 'rgba(245,158,11,0.1)' : c.surface2,
                    border: `1.5px solid ${active ? 'rgba(245,158,11,0.3)' : c.borderSolid}`,
                    color: active ? '#F59E0B' : c.text2,
                    fontSize: φ.xs, fontWeight: 600, minHeight: 36,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Comparison table */}
          <TrCard className="p-4">
            <div className="flex flex-col gap-3">
              {/* Header row */}
              <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${selected.length}, 1fr)` }}>
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 600 }}>Hạng</span>
                {selected.map(id => {
                  const preset = COMPARISON_PRESETS.find(p => p.id === id)!;
                  return (
                    <span key={id} className="text-center"
                      style={{ color: '#F59E0B', fontSize: 9, fontWeight: 700 }}>
                      {preset.label}
                    </span>
                  );
                })}
              </div>

              {/* Data rows — show top 5 ranks */}
              {[1, 2, 3, 4, 5].map(rank => {
                const rankLabel = rank <= 3
                  ? ['🥇 1st', '🥈 2nd', '🥉 3rd'][rank - 1]
                  : `${rank}th`;

                return (
                  <div key={rank} className="grid gap-2 items-center"
                    style={{ gridTemplateColumns: `80px repeat(${selected.length}, 1fr)` }}>
                    <span style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>{rankLabel}</span>
                    {selected.map(id => {
                      const preset = COMPARISON_PRESETS.find(p => p.id === id)!;
                      const tier = preset.tiers.find((_, idx) => idx === rank - 1);
                      const pct = tier?.pct || 0;
                      const pts = Math.round(netPool * pct / 100);

                      if (preset.id === 'equal' && rank === 1) {
                        const perPerson = Math.round(netPool / maxParticipants);
                        return (
                          <div key={id} className="text-center">
                            <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                              ~{fmtPoints(perPerson)}/ng
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={id} className="text-center">
                          {pct > 0 ? (
                            <span style={{
                              color: TIER_COLORS[(rank - 1) % TIER_COLORS.length],
                              fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                            }}>
                              {fmtPoints(pts)}
                            </span>
                          ) : (
                            <span style={{ color: c.text3, fontSize: 10 }}>—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* ROI row for rank 1 */}
              <div className="grid gap-2 items-center pt-2"
                style={{
                  gridTemplateColumns: `80px repeat(${selected.length}, 1fr)`,
                  borderTop: `1px solid ${c.divider}`,
                }}>
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 600 }}>ROI #1</span>
                {selected.map(id => {
                  const preset = COMPARISON_PRESETS.find(p => p.id === id)!;
                  const topPct = preset.tiers[0]?.pct || 0;
                  const topPts = Math.round(netPool * topPct / 100);
                  const roi = entryPoints > 0 ? Math.round((topPts / entryPoints - 1) * 100) : 0;

                  if (preset.id === 'equal') {
                    const perPerson = Math.round(netPool / maxParticipants);
                    const eqRoi = entryPoints > 0 ? Math.round((perPerson / entryPoints - 1) * 100) : 0;
                    return (
                      <span key={id} className="text-center"
                        style={{ color: eqRoi >= 0 ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: 700 }}>
                        {eqRoi > 0 ? '+' : ''}{eqRoi}%
                      </span>
                    );
                  }

                  return (
                    <span key={id} className="text-center"
                      style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>
                      +{roi}%
                    </span>
                  );
                })}
              </div>
            </div>
          </TrCard>

          {/* Info */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: c.surface2 }}>
            <Info size={10} color={c.text3} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5 }}>
              Ước tính dựa trên {maxParticipants} người tham gia, entry {fmtPoints(entryPoints)} pts, phí {platformFeePct}%.
              Số liệu thực tế có thể khác.
            </p>
          </div>
    </BottomSheetV2>
  );
}