/**
 * ══════════════════════════════════════════════════════════════
 *  WithdrawLimitsPage — P1: Withdrawal Limits & KYC Tier Display
 * ══════════════════════════════════════════════════════════════
 *  Shows daily/monthly withdrawal limits, KYC tier unlocks,
 *  remaining limits today, and how to increase limits.
 *  Pattern A — Standard Page
 *  Compliance: §14 Security & Privacy UX, §8.4 Wallet
 * ══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { fmtUsd } from '../../data/formatNumber';
import { φ, φIcon } from '../../utils/golden';
import {
  Shield, ChevronRight, CheckCircle, Lock,
  ArrowUpRight, AlertTriangle, Info, Star, Zap,
} from 'lucide-react';

const KYC_TIERS = [
  {
    level: 0,
    name: 'Chưa xác minh',
    dailyLimit: 0,
    monthlyLimit: 0,
    singleTxLimit: 0,
    requirements: ['Đăng ký tài khoản'],
    color: '#94A3B8',
    features: ['Xem giá', 'Danh sách theo dõi'],
  },
  {
    level: 1,
    name: 'Cơ bản',
    dailyLimit: 10000,
    monthlyLimit: 50000,
    singleTxLimit: 5000,
    requirements: ['Email xác minh', 'Số điện thoại'],
    color: '#3B82F6',
    features: ['Nạp tiền', 'Giao dịch Spot', 'Rút tiền cơ bản'],
  },
  {
    level: 2,
    name: 'Nâng cao',
    dailyLimit: 100000,
    monthlyLimit: 500000,
    singleTxLimit: 50000,
    requirements: ['CMND/CCCD', 'Nhận diện khuôn mặt'],
    color: '#10B981',
    features: ['P2P Trading', 'Rút tiền nâng cao', 'API Access'],
  },
  {
    level: 3,
    name: 'VIP',
    dailyLimit: 1000000,
    monthlyLimit: 5000000,
    singleTxLimit: 500000,
    requirements: ['KYC Level 2', 'Volume > $100K/tháng', 'Duyệt VIP'],
    color: '#F59E0B',
    features: ['Hạn mức VIP', 'Phí giao dịch giảm', 'Hỗ trợ ưu tiên', 'OTC Trading'],
  },
];

// Simulated current user state
const CURRENT_KYC = 2;
const USED_TODAY = 2450;
const USED_MONTH = 18750;

export function WithdrawLimitsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  const currentTier = KYC_TIERS[CURRENT_KYC];
  const dailyRemaining = currentTier.dailyLimit - USED_TODAY;
  const monthlyRemaining = currentTier.monthlyLimit - USED_MONTH;
  const dailyPct = (USED_TODAY / currentTier.dailyLimit) * 100;
  const monthlyPct = (USED_MONTH / currentTier.monthlyLimit) * 100;

  return (
    <PageLayout>
      <Header title="Hạn mức rút tiền" back />

      <PageContent gap="default">
        {/* Current tier badge */}
        <TrCard variant="hero" rounded="lg" className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${currentTier.color}22`, border: `2px solid ${currentTier.color}44` }}>
              <Shield size={24} color={currentTier.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span style={{ color: c.text1, fontSize: φ.body, fontWeight: 700 }}>
                  KYC Level {CURRENT_KYC}
                </span>
                <span className="px-2 py-0.5 rounded-lg"
                  style={{ background: `${currentTier.color}22`, color: currentTier.color, fontSize: 10, fontWeight: 700 }}>
                  {currentTier.name}
                </span>
              </div>
              <p style={{ color: c.text3, fontSize: φ.xs }}>Đã xác minh</p>
            </div>
            <CheckCircle size={20} color={currentTier.color} />
          </div>

          {/* Daily limit */}
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: c.text2, fontSize: 12 }}>Hạn mức rút/ngày</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtUsd(USED_TODAY)} / {fmtUsd(currentTier.dailyLimit)}
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: c.surface2 }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(dailyPct, 100)}%`,
                  background: dailyPct > 80 ? '#EF4444' : dailyPct > 50 ? '#F59E0B' : '#10B981',
                }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                Còn lại: {fmtUsd(dailyRemaining)}
              </span>
              <span style={{ color: c.text3, fontSize: 11 }}>{dailyPct.toFixed(1)}% đã dùng</span>
            </div>
          </div>

          {/* Monthly limit */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span style={{ color: c.text2, fontSize: 12 }}>Hạn mức rút/tháng</span>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtUsd(USED_MONTH)} / {fmtUsd(currentTier.monthlyLimit)}
              </span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: c.surface2 }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(monthlyPct, 100)}%`,
                  background: monthlyPct > 80 ? '#EF4444' : monthlyPct > 50 ? '#F59E0B' : '#10B981',
                }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                Còn lại: {fmtUsd(monthlyRemaining)}
              </span>
              <span style={{ color: c.text3, fontSize: 11 }}>{monthlyPct.toFixed(1)}% đã dùng</span>
            </div>
          </div>
        </TrCard>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Rút/ngày tối đa', value: fmtUsd(currentTier.dailyLimit), color: '#3B82F6' },
            { label: 'Giao dịch đơn', value: fmtUsd(currentTier.singleTxLimit), color: '#10B981' },
            { label: 'Rút/tháng', value: fmtUsd(currentTier.monthlyLimit), color: '#F59E0B' },
          ].map(s => (
            <TrCard key={s.label} className="p-3 text-center">
              <p style={{ color: s.color, fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
              <p style={{ color: c.text3, fontSize: 9 }}>{s.label}</p>
            </TrCard>
          ))}
        </div>

        {/* High amount warning */}
        <div className="flex items-start gap-2 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: '#D97706', fontSize: 11, lineHeight: 1.6 }}>
            Yêu cầu rút trên <strong>{fmtUsd(10000)}</strong> sẽ cần xem xét thủ công (lên đến 24 giờ).
            Rút trên <strong>{fmtUsd(50000)}</strong> cần xác minh video call.
          </p>
        </div>

        {/* KYC Tiers comparison */}
        <PageSection label="So sánh hạn mức theo cấp KYC">
          <div className="flex flex-col gap-2">
            {KYC_TIERS.map(tier => {
              const isCurrent = tier.level === CURRENT_KYC;
              const isLocked = tier.level > CURRENT_KYC;
              const isCompleted = tier.level < CURRENT_KYC;
              const isExpanded = expandedTier === tier.level;

              return (
                <TrCard key={tier.level} className="overflow-hidden"
                  style={isCurrent ? { border: `1.5px solid ${tier.color}44` } : undefined}>
                  <button
                    onClick={() => setExpandedTier(isExpanded ? null : tier.level)}
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${tier.color}18` }}>
                      {isLocked
                        ? <Lock size={18} color={tier.color} />
                        : isCompleted
                          ? <CheckCircle size={18} color={tier.color} />
                          : <Star size={18} color={tier.color} />
                      }
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>Level {tier.level}</span>
                        <span style={{ color: tier.color, fontSize: 11, fontWeight: 600 }}>{tier.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: `${tier.color}18`, color: tier.color, fontSize: 9, fontWeight: 700 }}>
                            HIỆN TẠI
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {tier.dailyLimit > 0 ? `${fmtUsd(tier.dailyLimit)}/ngày` : 'Không có hạn mức'}
                      </p>
                    </div>
                    <ChevronRight size={16} color={c.text3}
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl p-3 mb-3" style={{ background: c.surface2 }}>
                        {[
                          { label: 'Rút/ngày', value: tier.dailyLimit > 0 ? fmtUsd(tier.dailyLimit) : '—' },
                          { label: 'Rút/tháng', value: tier.monthlyLimit > 0 ? fmtUsd(tier.monthlyLimit) : '—' },
                          { label: 'Giao dịch đơn', value: tier.singleTxLimit > 0 ? fmtUsd(tier.singleTxLimit) : '—' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between py-1.5"
                            style={{ borderBottom: `1px solid ${c.divider}` }}>
                            <span style={{ color: c.text3, fontSize: 12 }}>{row.label}</span>
                            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Requirements */}
                      <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Yêu cầu:</p>
                      <div className="flex flex-col gap-1 mb-3">
                        {tier.requirements.map(req => (
                          <div key={req} className="flex items-center gap-2">
                            <CheckCircle size={12} color={!isLocked ? '#10B981' : c.text3} />
                            <span style={{ color: !isLocked ? c.text2 : c.text3, fontSize: 11 }}>{req}</span>
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Tính năng:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.features.map(f => (
                          <span key={f} className="px-2 py-1 rounded-lg"
                            style={{ background: `${tier.color}12`, color: tier.color, fontSize: 10, fontWeight: 600 }}>
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Upgrade CTA */}
                      {isLocked && tier.level === CURRENT_KYC + 1 && (
                        <button
                          onClick={() => navigate(`${prefix}/profile/kyc`)}
                          className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl"
                          style={{ background: `${tier.color}18`, color: tier.color, fontSize: 13, fontWeight: 700 }}>
                          <Zap size={14} />
                          Nâng cấp lên {tier.name}
                        </button>
                      )}
                    </div>
                  )}
                </TrCard>
              );
            })}
          </div>
        </PageSection>

        {/* FAQ */}
        <TrCard className="p-4">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Câu hỏi thường gặp</p>
          {[
            { q: 'Hạn mức reset khi nào?', a: 'Hạn mức ngày reset lúc 00:00 UTC. Hạn mức tháng reset ngày 1 hàng tháng.' },
            { q: 'Rút vượt hạn mức thì sao?', a: 'Yêu cầu rút sẽ bị từ chối. Bạn có thể nâng cấp KYC hoặc chờ hạn mức reset.' },
            { q: 'Phí rút có tính vào hạn mức?', a: 'Không. Hạn mức chỉ tính số tiền thực rút, không bao gồm phí mạng.' },
          ].map((faq, i) => (
            <div key={i} className="py-2.5" style={{ borderBottom: i < 2 ? `1px solid ${c.divider}` : 'none' }}>
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{faq.q}</p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.5 }}>{faq.a}</p>
            </div>
          ))}
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}
