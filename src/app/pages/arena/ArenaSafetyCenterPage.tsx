/**
 * ══════════════════════════════════════════════════════════
 *  ArenaSafetyCenterPage — /arena/safety
 * ══════════════════════════════════════════════════════════
 *  07B: Arena Safety & Trust center.
 *  Sections:
 *  - Quy tắc cộng đồng (Community Rules)
 *  - Nội dung bị cấm
 *  - Cách report / block
 *  - Quy trình xử lý vi phạm
 *  - Cách chốt kết quả
 *  - Không giao dịch ngoài nền tảng
 *  - Về Arena Points
 *  Tone: nghiêm túc, rõ ràng, không gamification.
 */

import React from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, AlertTriangle, Flag, Ban,
  BookOpen, Scale, Gift, ChevronRight,
  CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SafetyBanner } from '../../components/arena/ArenaGovernance';
import { ArenaPageFooter } from '../../components/arena/ArenaPageFooter';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ─── Data ─── */

const COMMUNITY_RULES = [
  {
    icon: Scale,
    title: 'Tôn trọng kết quả',
    desc: 'Không thao túng, gian lận hoặc từ chối kết quả hợp lệ.',
    color: '#3B82F6',
  },
  {
    icon: Ban,
    title: 'Không giao dịch ngoài nền tảng',
    desc: 'Mọi thỏa thuận phải diễn ra trong Open Arena.',
    color: '#EF4444',
  },
  {
    icon: BookOpen,
    title: 'Ngôn ngữ văn minh',
    desc: 'Không xúc phạm, đe doạ, phân biệt đối xử người chơi khác.',
    color: '#8B5CF6',
  },
  {
    icon: Shield,
    title: 'Bảo vệ thông tin cá nhân',
    desc: 'Không chia sẻ thông tin nhạy cảm trong chat hoặc challenge.',
    color: '#10B981',
  },
];

const BANNED_CONTENT = [
  'Spam, quảng cáo, link lạ',
  'Nội dung lừa đảo hoặc scam',
  'Thao túng kết quả challenge',
  'Ngôn ngữ thù ghét, đe doạ',
  'Mạo danh người dùng khác',
  'Giao dịch tiền thật / tài sản ngoài Arena',
];

const VIOLATION_PROCESS = [
  { step: 1, title: 'Gửi báo cáo', desc: 'Nhấn "Báo cáo" trên profile hoặc challenge và chọn lý do.' },
  { step: 2, title: 'Tiếp nhận', desc: 'Hệ thống xác nhận và ghi nhận báo cáo ngay lập tức.' },
  { step: 3, title: 'Xem xét', desc: 'Đội ngũ kiểm duyệt xem xét bằng chứng trong 24 - 48h.' },
  { step: 4, title: 'Kết luận', desc: 'Thông báo kết quả qua mục "Báo cáo & chặn" trong profile.' },
];

/* ═══════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════ */

export function ArenaSafetyCenterPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();

  const handleAcknowledge = () => {
    hapticSuccess();
    actionToast.success(TOAST.ARENA.SAFETY_ACKNOWLEDGED);
    navigate(-1);
  };

  return (
    <PageLayout>
      <Header title="An toàn & Quy tắc Arena" subtitle="Trung tâm an toàn · Open Arena" back />

      <PageContent gap="relaxed">

        {/* ─── Hero Banner ─── */}
        <SafetyBanner
          variant="safety"
          title="Open Arena cam kết an toàn"
          description="Chúng tôi xây dựng môi trường lành mạnh, minh bạch và công bằng cho mọi người chơi."
        />

        {/* ─── Community Rules ─── */}
        <div>
          <SectionHeader title="Quy tắc cộng đồng" accent accentColor="#3B82F6" mb={8} />
          <div className="flex flex-col gap-2">
            {COMMUNITY_RULES.map(rule => (
              <TrCard key={rule.title} className="p-4 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: hexToRgba(rule.color, 12) }}
                >
                  <rule.icon size={18} color={rule.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                    {rule.title}
                  </p>
                  <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                    {rule.desc}
                  </p>
                </div>
              </TrCard>
            ))}
          </div>
        </div>

        {/* ─── Nội dung bị cấm ─── */}
        <div>
          <SectionHeader title="Nội dung bị cấm" accent accentColor="#EF4444" mb={8} />
          <TrCard className="p-4">
            <div className="flex flex-col gap-2.5">
              {BANNED_CONTENT.map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <XCircle size={14} color="#EF4444" className="shrink-0" />
                  <span style={{ color: c.text1, fontSize: φ.sm, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* ─── Cách báo cáo và chặn ─── */}
        <div>
          <SectionHeader title="Cách báo cáo và chặn" accent accentColor="#F59E0B" mb={8} />
          <div className="flex flex-col gap-2">
            <TrCard className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Flag size={18} color="#EF4444" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  Báo cáo vi phạm
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                  Nhấn nút "Báo cáo" trên profile người dùng, challenge hoặc mode. Chn lý do và gửi. Đội ngũ sẽ xem xét trong 24 – 48h.
                </p>
              </div>
            </TrCard>
            <TrCard className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(245,158,11,0.1)' }}>
                <Ban size={18} color="#F59E0B" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  Chặn người dùng
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                  Nhấn "Chặn" trên profile người dùng. Sau khi chặn, bạn sẽ không thấy challenge hoặc tin nhắn từ người này. Có thể bỏ chặn bất cứ lúc nào.
                </p>
              </div>
            </TrCard>
          </div>
        </div>

        {/* ─── Quy trình xử lý ─── */}
        <div>
          <SectionHeader title="Quy trình xử lý vi phạm" accent accentColor="#10B981" mb={8} />
          <TrCard className="p-4">
            <div className="flex flex-col">
              {VIOLATION_PROCESS.map((item, i) => (
                <div key={item.step} className="flex gap-3">
                  <div className="flex flex-col items-center" style={{ width: 28 }}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}
                    >
                      <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>{item.step}</span>
                    </div>
                    {i < VIOLATION_PROCESS.length - 1 && (
                      <div className="flex-1 w-px" style={{ background: 'rgba(16,185,129,0.2)', minHeight: 20 }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                      {item.title}
                    </p>
                    <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* ─── Cách chốt kết quả ─── */}
        <div>
          <SectionHeader title="Cách chốt kết quả" accent accentColor="#3B82F6" mb={8} />
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Scale size={18} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  Kết quả challenge được chốt minh bạch
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 4 }}>
                  Mỗi challenge có phương thức chốt riêng. Bạn luôn biết trước cách xác định kết quả.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              {[
                { title: 'Bình chọn cộng đồng', desc: 'Người tham gia bỏ phiếu. Kết quả theo đa số.' },
                { title: 'Trọng tài (Referee)', desc: 'Một người được chỉ định xem xét bằng chứng và quyết định.' },
                { title: 'Tự động (Auto)', desc: 'Hệ thống tự chốt dựa trên dữ liệu từ nguồn đáng tin cậy (API giá, oracle).' },
              ].map(item => (
                <div key={item.title}>
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                    {item.title}
                  </p>
                  <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* ─── Không giao dịch ngoài nền tảng ─── */}
        <div>
          <SectionHeader title="Không giao dịch ngoài nền tảng" accent accentColor="#EF4444" mb={8} />
          <TrCard className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Ban size={18} color="#EF4444" />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  Mọi thỏa thuận trong Arena
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 4 }}>
                  Không trao đổi tiền thật, crypto hoặc tài sản ngoài Arena. Mọi challenge chỉ sử dụng Arena Points.
                  Nếu ai đề nghị giao dịch ngoài nền tảng, hãy báo cáo ngay.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              {[
                { text: 'Không chuyển khoản ngân hàng cho challenge', ok: false },
                { text: 'Không đổi Arena Points lấy tiền thật', ok: false },
                { text: 'Báo cáo nếu bị dụ dỗ giao dịch ngoài', ok: true },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  {item.ok ? (
                    <CheckCircle2 size={13} color="#10B981" className="shrink-0" />
                  ) : (
                    <XCircle size={13} color="#EF4444" className="shrink-0" />
                  )}
                  <span style={{ color: item.ok ? c.text1 : c.text2, fontSize: φ.xs, lineHeight: 1.4 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* ─── Arena Points disclaimer ─── */}
        <div>
          <SectionHeader title="Về Arena Points" accent accentColor="#8B5CF6" mb={8} />
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Gift size={18} color="#8B5CF6" className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, lineHeight: 1.4 }}>
                  Arena Points chỉ dùng trong Open Arena
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginTop: 4 }}>
                  Arena Points là phần thưởng hoạt động, không phải tài sản tài chính, không có giá trị tiền tệ và không thể rút ra ngoài nền tảng.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              {[
                { text: 'Không mua bán Arena Points', ok: false },
                { text: 'Không đổi sang tiền thật hoặc crypto', ok: false },
                { text: 'Dùng để tham gia challenges và nhận thưởng', ok: true },
                { text: 'Nhận miễn phí qua nhiệm vụ hàng ngày', ok: true },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  {item.ok ? (
                    <CheckCircle2 size={13} color="#10B981" className="shrink-0" />
                  ) : (
                    <XCircle size={13} color="#EF4444" className="shrink-0" />
                  )}
                  <span style={{ color: item.ok ? c.text1 : c.text2, fontSize: φ.xs, lineHeight: 1.4 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* ─── Quick links ─── */}
        <div className="flex flex-col gap-2">
          <TrCard
            hover as="button"
            onClick={() => { navigate(`${prefix}/profile/arena/blocked`); hapticSelection(); }}
            className="flex items-center gap-3 p-4 w-full active:opacity-70"
            style={{ minHeight: 52 }}
          >
            <Ban size={16} color="#F59E0B" />
            <span className="flex-1 text-left" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Danh sách người đã chặn
            </span>
            <ChevronRight size={16} color={c.text3} />
          </TrCard>
          <TrCard
            hover as="button"
            onClick={() => { navigate(`${prefix}/profile/arena/reports/rpt001`); hapticSelection(); }}
            className="flex items-center gap-3 p-4 w-full active:opacity-70"
            style={{ minHeight: 52 }}
          >
            <Flag size={16} color="#EF4444" />
            <span className="flex-1 text-left" style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
              Xem báo cáo của tôi
            </span>
            <ChevronRight size={16} color={c.text3} />
          </TrCard>
        </div>

        {/* ─── CTA ─── */}
        <CTAButton onClick={handleAcknowledge} variant="primary">
          Đã hiểu
        </CTAButton>

        <ArenaPageFooter hideDisclaimer />

      </PageContent>
    </PageLayout>
  );
}