import { useState } from 'react';
import {
  Gift, TrendingUp, CheckCircle, HelpCircle,
  ChevronUp, ChevronDown, Info,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { fmtUsd } from '../../data/formatNumber';
import { φ, φRadius, φSpace, φIcon } from '../../utils/golden';
import {
  REFERRAL_TIERS,
  REFERRAL_FAQ,
  getReferralStats,
  getCurrentTier,
} from '../../data/referralData';

/* ═══════════════════════════════════════════════════════════
   SPACING CONSTANTS — 8pt rhythm (Guidelines §2.3)
   ═══════════════════════════════════════════════════════════
   Section gap (PageContent):  16px  (gap="default")
   Card internal padding:      16px  (p-4)
   Sub-item gap:                8px  (gap-2)
   ═══════════════════════════════════════════════════════════ */

const S = {
  /** Card inner padding */
  cardPad: 16,
  /** Sub-item gap */
  itemGap: φSpace[3],      // 8px
} as const;

export function ReferralRulesPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const stats = getReferralStats();
  const { current: currentTier, currentIdx } = getCurrentTier(stats.totalFriends);
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  return (
    <PageLayout>
      <Header title="Quy tắc chương trình" subtitle="Quy tắc · Referral" back onBack={() => navigate(prefix + '/referral')} />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
      <PageContent gap="default">
      {/* ─── Tier Table ─── */}
      <div>
        <SectionHeader title="Hệ thống hạng" accent accentColor="#F59E0B"
          subtitle="Mời càng nhiều, thưởng càng lớn" />
        <TrCard overflow>
          {/* Header row */}
          <div className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: c.surface2, borderBottom: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600, width: 80 }}>Hạng</span>
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600, flex: 1, textAlign: 'center' }}>Bạn bè</span>
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600, flex: 1, textAlign: 'center' }}>Hoa hồng</span>
            <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 600, flex: 1, textAlign: 'right' }}>Thưởng KYC</span>
          </div>
          {REFERRAL_TIERS.map((tier, i) => {
            const isCurrent = i === currentIdx;
            return (
              <div key={tier.name}
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  borderBottom: i < REFERRAL_TIERS.length - 1 ? `1px solid ${c.divider}` : 'none',
                  background: isCurrent ? `${tier.color}0D` : 'transparent',
                }}>
                <div className="flex items-center gap-2" style={{ width: 80 }}>
                  <span style={{ fontSize: φ.base }}>{tier.icon}</span>
                  <div>
                    <p style={{ color: isCurrent ? tier.color : c.text1, fontSize: φ.sm, fontWeight: isCurrent ? 700 : 500 }}>
                      {tier.name}
                    </p>
                    <p style={{ color: isCurrent ? tier.color : c.text3, fontSize: 9, fontWeight: 500, opacity: isCurrent ? 0.8 : 0.7 }}>
                      {tier.nameEn}
                    </p>
                    {isCurrent && (
                      <span style={{ color: tier.color, fontSize: 9, fontWeight: 600 }}>Hiện tại</span>
                    )}
                  </div>
                </div>
                <span style={{ color: c.text2, fontSize: φ.sm, flex: 1, textAlign: 'center', fontFamily: 'monospace' }}>
                  {tier.friends === 0 ? '0' : `≥ ${tier.friends}`}
                </span>
                <span style={{ color: '#10B981', fontSize: φ.body, fontWeight: 700, flex: 1, textAlign: 'center', fontFamily: 'monospace' }}>
                  {tier.commission}%
                </span>
                <span style={{ color: '#8B5CF6', fontSize: φ.sm, fontWeight: 600, flex: 1, textAlign: 'right', fontFamily: 'monospace' }}>
                  {fmtUsd(tier.kycBonus)}
                </span>
              </div>
            );
          })}
        </TrCard>
      </div>

      {/* ─── Reward Types ─── */}
      <div>
        <SectionHeader title="Các loại thưởng" accent accentColor="#3B82F6" />
        <div className="flex flex-col gap-3">
          <TrCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(139,92,246,0.12)' }}>
                <Gift size={φIcon.md} color="#8B5CF6" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, marginBottom: 4 }}>
                  Thưởng KYC cố định
                </p>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                  Khi bạn bè hoàn tất xác minh danh tính (KYC), <span style={{ fontWeight: 600, color: '#8B5CF6' }}>cả bạn và bạn bè</span> đều nhận thưởng cố định bằng USDT.
                  Mức thưởng tùy theo hạng của bạn ({fmtUsd(REFERRAL_TIERS[0].kycBonus)} – {fmtUsd(REFERRAL_TIERS[REFERRAL_TIERS.length - 1].kycBonus)}).
                </p>
                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(139,92,246,0.08)', display: 'inline-flex' }}>
                  <CheckCircle size={12} color="#8B5CF6" />
                  <span style={{ color: '#8B5CF6', fontSize: φ.xs, fontWeight: 600 }}>Cộng vào ví trong 24h</span>
                </div>
              </div>
            </div>
          </TrCard>

          <TrCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.12)' }}>
                <TrendingUp size={φIcon.md} color="#10B981" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 700, marginBottom: 4 }}>
                  Hoa hồng giao dịch
                </p>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                  Bạn nhận <span style={{ fontWeight: 600, color: '#10B981' }}>{currentTier.commission}%</span> phí giao dịch (Spot, P2P, Convert) của bạn bè được giới thiệu.
                  Hoa hồng được cộng real-time và <span style={{ fontWeight: 600, color: '#10B981' }}>không giới hạn thời gian</span>.
                </p>
                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', display: 'inline-flex' }}>
                  <CheckCircle size={12} color="#10B981" />
                  <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>Vĩnh viễn, không giới hạn</span>
                </div>
              </div>
            </div>
          </TrCard>
        </div>
      </div>

      {/* ─── Rules ─── */}
      <div>
        <SectionHeader title="Điều khoản chương trình" accent accentColor="#94A3B8" />
        <TrCard className="p-4">
          <div className="flex flex-col gap-3">
            {[
              'Mỗi người dùng chỉ được giới thiệu bởi 1 người. Mã giới thiệu phải được nhập khi đăng ký.',
              'Bạn bè phải hoàn tất KYC để cả hai nhận thưởng cố định.',
              'Hoa hồng giao dịch được tính trên phí thực tế bạn bè đã trả.',
              'Lên hạng tự động khi số bạn bè đủ điều kiện. % hoa hồng mới áp dụng ngay.',
              'VitTrade có quyền thay đổi chương trình với thông báo trước 30 ngày.',
              'Nghiêm cấm spam, tự giới thiệu, hoặc gian lận. Vi phạm sẽ bị khóa tài khoản.',
            ].map((rule, i) => (
              <div key={i} className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: c.surface2 }}>
                  <span style={{ color: c.text3, fontSize: φ.xs, fontWeight: 700 }}>{i + 1}</span>
                </div>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{rule}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>

      {/* ─── FAQ ─── */}
      <div>
        <SectionHeader title="Câu hỏi thường gặp" accent accentColor="#06B6D4" />
        <div className="flex flex-col gap-2">
          {REFERRAL_FAQ.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <TrCard key={i} className="overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
                  style={{ minHeight: 48 }}>
                  <HelpCircle size={φ.base} color="#06B6D4" className="shrink-0" />
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, flex: 1 }}>{faq.q}</span>
                  {isOpen
                    ? <ChevronUp size={φ.base} color={c.text3} className="shrink-0" />
                    : <ChevronDown size={φ.base} color={c.text3} className="shrink-0" />
                  }
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{faq.a}</p>
                    </div>
                  </div>
                )}
              </TrCard>
            );
          })}
        </div>
      </div>

      {/* ─── Disclaimer ─── */}
      <div>
        <TrCard className="p-4" accentBorder="rgba(245,158,11,0.15)">
          <div className="flex items-start gap-2.5">
            <Info size={φ.base} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.6 }}>
              Chương trình giới thiệu không được sử dụng cho mục đích quảng cáo sai lệch.
              VitTrade không cam kết lợi nhuận từ giao dịch. Thưởng giới thiệu chỉ dựa trên phí giao dịch, không liên quan đến kết quả đầu tư.
            </p>
          </div>
        </TrCard>
      </div>
      </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}