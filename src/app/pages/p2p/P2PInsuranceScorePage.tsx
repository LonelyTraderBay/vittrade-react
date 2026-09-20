import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  Shield, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle,
  ChevronRight, TrendingUp, Award, Star, Lock, UserCheck,
  BarChart3, Zap, ArrowUpRight, Info, Target, Gem,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ, φSpace } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';
import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

/* ═══════════════════════════════════════════════════════════
   P2P Insurance Protection Score — Enterprise Trust Assessment
   TIER 5.1 — Personal protection & risk scoring
   ═══════════════════════════════════════════════════════════ */

interface ScoreFactor {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  icon: React.ElementType;
  color: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation?: string;
}

interface TierRequirement {
  name: string;
  requiredScore: number;
  coveragePct: string;
  requirements: string[];
  isCurrent: boolean;
  isUnlocked: boolean;
}

/* ─── Mock Data ─── */

const OVERALL_SCORE = 78;
const MAX_SCORE = 100;

const SCORE_FACTORS: ScoreFactor[] = [
  {
    id: 'kyc', label: 'Xác minh danh tính', description: 'KYC Level 2 đã hoàn tất',
    score: 20, maxScore: 20, icon: UserCheck, color: '#10B981', status: 'excellent',
  },
  {
    id: 'trading', label: 'Lịch sử giao dịch', description: '128 giao dịch thành công, 99.2% completion',
    score: 22, maxScore: 25, icon: BarChart3, color: '#3B82F6', status: 'good',
    recommendation: 'Hoàn thành thêm 20 giao dịch để đạt điểm tối đa',
  },
  {
    id: 'claim_history', label: 'Lịch sử claims', description: '5 claims, 60% được duyệt, 0 gian lận',
    score: 16, maxScore: 20, icon: Shield, color: '#8B5CF6', status: 'good',
    recommendation: 'Tỷ lệ duyệt 60% — cải thiện chất lượng bằng chứng khi gửi claim',
  },
  {
    id: 'account_age', label: 'Tuổi tài khoản', description: '14 tháng hoạt động liên tục',
    score: 12, maxScore: 15, icon: Award, color: '#F59E0B', status: 'good',
    recommendation: 'Đạt 18 tháng để nhận điểm tối đa',
  },
  {
    id: 'security', label: 'Bảo mật tài khoản', description: '2FA bật, chưa có anti-phishing code',
    score: 8, maxScore: 20, icon: Lock, color: '#EF4444', status: 'fair',
    recommendation: 'Thiết lập Anti-Phishing Code và Biometrics để tăng 12 điểm',
  },
];

const STATUS_CONFIG: Record<ScoreFactor['status'], { label: string; color: string }> = {
  excellent: { label: 'Xuất sắc', color: '#10B981' },
  good: { label: 'Tốt', color: '#3B82F6' },
  fair: { label: 'Trung bình', color: '#F59E0B' },
  poor: { label: 'Yếu', color: '#EF4444' },
};

const TIER_REQUIREMENTS: TierRequirement[] = [
  {
    name: 'Thường', requiredScore: 0, coveragePct: '0%',
    requirements: ['Tạo tài khoản'], isCurrent: false, isUnlocked: true,
  },
  {
    name: 'Xác minh', requiredScore: 30, coveragePct: '70%',
    requirements: ['KYC Level 1+', 'Điểm bảo vệ ≥ 30', '2FA bật'],
    isCurrent: false, isUnlocked: true,
  },
  {
    name: 'Pro', requiredScore: 60, coveragePct: '85%',
    requirements: ['KYC Level 2', 'Điểm bảo vệ ≥ 60', '50+ giao dịch', 'Completion ≥ 95%'],
    isCurrent: true, isUnlocked: true,
  },
  {
    name: 'Elite', requiredScore: 90, coveragePct: '100% +10%',
    requirements: ['KYC Level 2', 'Điểm bảo vệ ≥ 90', '200+ giao dịch', 'Completion ≥ 98%', '0 vi phạm 6 tháng', 'Anti-Phishing Code bật'],
    isCurrent: false, isUnlocked: false,
  },
];

const getOverallGrade = (score: number): { grade: string; label: string; color: string; desc: string } => {
  if (score >= 90) return { grade: 'A+', label: 'Xuất sắc', color: '#10B981', desc: 'Bảo vệ tối đa — đủ điều kiện tier Elite' };
  if (score >= 75) return { grade: 'A', label: 'Tốt', color: '#3B82F6', desc: 'Bảo vệ mạnh — đang ở tier Pro' };
  if (score >= 60) return { grade: 'B', label: 'Khá', color: '#8B5CF6', desc: 'Bảo vệ trung bình — cần cải thiện bảo mật' };
  if (score >= 40) return { grade: 'C', label: 'Trung bình', color: '#F59E0B', desc: 'Bảo vệ cơ bản — nhiều yếu tố cần cải thiện' };
  return { grade: 'D', label: 'Yếu', color: '#EF4444', desc: 'Bảo vệ yếu — cần hoàn tất KYC và bật bảo mật' };
};

/* ─── Animated Score Ring ─── */

function ScoreRing({ score, maxScore, size = 160 }: { score: number; maxScore: number; size?: number }) {
  const c = useThemeColors();
  const grade = getOverallGrade(score);
  const animatedScore = useAnimatedCounter(score);

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      const progress = score / maxScore;
      setDashOffset(circumference * (1 - progress));
    }, 300);
    return () => clearTimeout(timer);
  }, [score, maxScore, circumference]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={c.surface2} strokeWidth={10}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={grade.color} strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span style={{ color: grade.color, fontSize: 36, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {animatedScore}
        </span>
        <span style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>/ {maxScore}</span>
        <span style={{
          color: grade.color, fontSize: φ.sm, fontWeight: 700,
          marginTop: 6, letterSpacing: 1,
        }}>
          {grade.grade}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export function P2PInsuranceScorePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();

  const grade = getOverallGrade(OVERALL_SCORE);
  const improvableFactors = SCORE_FACTORS.filter(f => f.recommendation);
  const potentialGain = SCORE_FACTORS.reduce((sum, f) => sum + (f.maxScore - f.score), 0);

  return (
    <PageLayout>
      <Header title="Điểm bảo vệ" subtitle="Bảo hiểm · P2P" back />

      <PageContent>
        <div className="px-5 py-4 flex flex-col" style={{ gap: φSpace[5] }}>
          {/* ── Score Overview ── */}
          <TrCard className="p-5">
            <div className="flex flex-col items-center" style={{ gap: φSpace[3] }}>
              <ScoreRing score={OVERALL_SCORE} maxScore={MAX_SCORE} />
              <div className="text-center">
                <p style={{ color: grade.color, fontSize: φ.base, fontWeight: 700 }}>
                  {grade.label}
                </p>
                <p style={{ color: c.text3, fontSize: φ.sm, lineHeight: 1.5, marginTop: 4 }}>
                  {grade.desc}
                </p>
              </div>

              {potentialGain > 0 && (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <TrendingUp size={14} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600 }}>
                    +{potentialGain} điểm có thể cải thiện
                  </span>
                </div>
              )}
            </div>
          </TrCard>

          {/* ── Score Breakdown ── */}
          <TrCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                Chi tiết điểm số
              </span>
            </div>

            <div className="flex flex-col">
              {SCORE_FACTORS.map((factor, idx) => {
                const Icon = factor.icon;
                const statusCfg = STATUS_CONFIG[factor.status];
                const isLast = idx === SCORE_FACTORS.length - 1;
                const pct = Math.round(factor.score / factor.maxScore * 100);

                return (
                  <div key={factor.id}>
                    <div
                      className="py-3"
                      style={{ borderBottom: isLast ? 'none' : `1px solid ${c.divider}` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${factor.color}12` }}
                          >
                            <Icon size={14} color={factor.color} />
                          </div>
                          <div>
                            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.5 }}>
                              {factor.label}
                            </p>
                            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                              {factor.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span style={{
                            color: factor.color, fontSize: φ.body, fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {factor.score}
                          </span>
                          <span style={{ color: c.text3, fontSize: 11 }}>/{factor.maxScore}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-2 ml-10">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: factor.color }}
                          />
                        </div>
                        <span style={{
                          color: statusCfg.color, fontSize: 10, fontWeight: 600,
                          minWidth: 40, textAlign: 'right',
                        }}>
                          {statusCfg.label}
                        </span>
                      </div>

                      {factor.recommendation && (
                        <div
                          className="flex items-start gap-2 ml-10 mt-2 px-3 py-2 rounded-lg"
                          style={{ background: `${factor.color}08` }}
                        >
                          <Zap size={12} color={factor.color} className="shrink-0 mt-0.5" />
                          <p style={{ color: factor.color, fontSize: 11, lineHeight: 1.5 }}>
                            {factor.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>

          {/* ── Quick Actions to Improve Score ── */}
          {improvableFactors.length > 0 && (
            <TrCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpRight size={16} color="#10B981" />
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                  Cải thiện nhanh
                </span>
              </div>

              <div className="flex flex-col" style={{ gap: φSpace[2] }}>
                {[
                  {
                    label: 'Thiết lập Anti-Phishing Code',
                    gain: '+8 điểm',
                    action: () => { hapticSelection(); navigate(`${prefix}/profile/settings`); },
                    color: '#EF4444',
                  },
                  {
                    label: 'Bật Biometrics / Passkey',
                    gain: '+4 điểm',
                    action: () => { hapticSelection(); navigate(`${prefix}/profile/settings`); },
                    color: '#F59E0B',
                  },
                  {
                    label: 'Hoàn thành thêm 20 giao dịch',
                    gain: '+3 điểm',
                    action: () => { hapticSelection(); navigate(`${prefix}/p2p`); },
                    color: '#3B82F6',
                  },
                  {
                    label: 'Duy trì 4 tháng nữa',
                    gain: '+3 điểm',
                    action: undefined,
                    color: '#8B5CF6',
                  },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="flex items-center justify-between p-3 rounded-xl text-left"
                    style={{ background: c.surface2 }}
                    disabled={!item.action}
                  >
                    <div className="flex items-center gap-2.5 flex-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 500, lineHeight: 1.5 }}>
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700 }}>
                        {item.gain}
                      </span>
                      {item.action && <ChevronRight size={14} color={c.text3} />}
                    </div>
                  </button>
                ))}
              </div>
            </TrCard>
          )}

          {/* ── Tier Upgrade Path ── */}
          <TrCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gem size={16} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                Lộ trình nâng cấp
              </span>
            </div>

            <div className="flex flex-col" style={{ gap: φSpace[3] }}>
              {TIER_REQUIREMENTS.map((tier, idx) => {
                const isLast = idx === TIER_REQUIREMENTS.length - 1;
                const progressPct = tier.isUnlocked
                  ? 100
                  : Math.min(100, Math.round(OVERALL_SCORE / tier.requiredScore * 100));

                return (
                  <div key={tier.name}>
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: tier.isCurrent ? 'rgba(59,130,246,0.06)' : c.surface2,
                        border: tier.isCurrent ? '1.5px solid rgba(59,130,246,0.3)' : `1px solid ${c.divider}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {tier.isUnlocked ? (
                            <CheckCircle size={16} color={tier.isCurrent ? '#3B82F6' : '#10B981'} />
                          ) : (
                            <Lock size={16} color={c.text3} />
                          )}
                          <span style={{
                            color: tier.isCurrent ? '#3B82F6' : (tier.isUnlocked ? c.text1 : c.text3),
                            fontSize: φ.body, fontWeight: 700,
                          }}>
                            {tier.name}
                            {tier.isCurrent && (
                              <span style={{ fontSize: 10, marginLeft: 6, color: '#3B82F6' }}>← HIỆN TẠI</span>
                            )}
                          </span>
                        </div>
                        <span style={{
                          color: tier.isCurrent ? '#3B82F6' : c.text2,
                          fontSize: φ.body, fontWeight: 700,
                        }}>
                          {tier.coveragePct}
                        </span>
                      </div>

                      {!tier.isUnlocked && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ color: c.text3, fontSize: 11 }}>Tiến độ</span>
                            <span style={{ color: c.text2, fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                              {OVERALL_SCORE}/{tier.requiredScore}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${progressPct}%`, background: '#8B5CF6' }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tier.requirements.map(req => {
                          const isMet = tier.isUnlocked;
                          return (
                            <span
                              key={req}
                              className="px-2 py-0.5 rounded"
                              style={{
                                fontSize: 10, lineHeight: 1.5,
                                color: isMet ? '#10B981' : c.text3,
                                background: isMet ? 'rgba(16,185,129,0.08)' : c.surface2,
                              }}
                            >
                              {isMet ? '✓ ' : ''}{req}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {!isLast && (
                      <div className="flex justify-center py-1">
                        <div className="w-0.5 h-4" style={{ background: c.divider }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TrCard>

          {/* ── Disclosure ── */}
          <div
            className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: c.surface2, border: `1px solid ${c.divider}` }}
          >
            <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
              Điểm bảo vệ được tính dựa trên nhiều yếu tố và cập nhật hàng ngày.
              Điểm không ảnh hưởng đến khả năng giao dịch, chỉ xác định mức bảo hiểm khi xảy ra sự cố.
            </p>
          </div>

          <div style={{ height: 8 }} />
        </div>
      </PageContent>
    </PageLayout>
  );
}