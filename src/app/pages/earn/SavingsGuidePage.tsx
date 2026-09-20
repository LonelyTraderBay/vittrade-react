import React, { useState } from 'react';
import {
  BookOpen, PlayCircle, CheckCircle2, ChevronRight, Lightbulb,
  Shield, TrendingUp, AlertTriangle, PiggyBank, Lock, Unlock,
  Zap, Calculator, HelpCircle, ArrowRight,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Tutorial Data
   ═══════════════════════════════════════════════════════════ */
interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tips: string[];
}

interface Tutorial {
  id: string;
  title: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  steps: GuideStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'savings-basic',
    title: 'Tiết kiệm Crypto là gì?',
    duration: '4 phút',
    difficulty: 'beginner',
    description: 'Hiểu cơ bản về gửi tiết kiệm crypto và cách kiếm lãi thụ động.',
    steps: [
      {
        id: 'sb1',
        title: 'Tiết kiệm Crypto hoạt động thế nào?',
        description: 'Gửi tiết kiệm crypto giống như gửi tiền tiết kiệm ngân hàng — bạn gửi tài sản và nhận lãi suất hàng ngày. Tài sản của bạn được sử dụng để cung cấp thanh khoản cho thị trường vay/mượn, và phần lãi được chia lại cho bạn.',
        icon: PiggyBank,
        tips: [
          'Bạn vẫn sở hữu 100% tài sản đã gửi',
          'Lãi suất (APY) cao hơn ngân hàng truyền thống 3-10 lần',
          'Lãi được tính và phân phối tự động hàng ngày',
          'Không cần kiến thức kỹ thuật phức tạp',
        ],
      },
      {
        id: 'sb2',
        title: 'Linh hoạt vs Cố định',
        description: 'Có 2 loại sản phẩm tiết kiệm chính. "Linh hoạt" cho phép rút bất kỳ lúc nào nhưng APY thấp hơn. "Cố định" yêu cầu khóa tài sản trong thời gian nhất định (30, 60, 90 ngày) nhưng APY cao hơn đáng kể.',
        icon: Lock,
        tips: [
          'Linh hoạt: APY 2-5%, rút tự do 24/7',
          'Cố định 30D: APY 4-7%, khóa 30 ngày',
          'Cố định 60D: APY 5-8%, khóa 60 ngày',
          'Cố định 90D: APY 6-10%, khóa 90 ngày',
        ],
      },
      {
        id: 'sb3',
        title: 'Bắt đầu gửi tiết kiệm',
        description: 'Chọn sản phẩm phù hợp → Nhập số lượng → Xem lại điều khoản → Xác nhận gửi. Sau khi gửi, lãi sẽ được tính ngay từ ngày hôm sau và tự động phân phối vào ví tiết kiệm.',
        icon: CheckCircle2,
        tips: [
          'Kiểm tra số dư khả dụng trước khi gửi',
          'Đọc kỹ điều khoản sản phẩm, đặc biệt phần rút sớm',
          'Bắt đầu với số nhỏ ($50-200) để làm quen',
          'Bật tái đầu tư tự động (auto-compound) để tối đa lãi kép',
        ],
      },
    ],
  },
  {
    id: 'savings-optimize',
    title: 'Tối ưu lãi suất Tiết kiệm',
    duration: '6 phút',
    difficulty: 'intermediate',
    description: 'Chiến lược nâng cao để tối đa hóa thu nhập từ tiết kiệm crypto.',
    steps: [
      {
        id: 'so1',
        title: 'Chiến lược phân bổ Ladder',
        description: 'Chia tài sản vào nhiều sản phẩm với kỳ hạn khác nhau. Ví dụ: 40% Linh hoạt (thanh khoản khẩn cấp), 30% Cố định 30D, 30% Cố định 60D. Khi mỗi kỳ đáo hạn, bạn có thể quyết định tái gửi hoặc chuyển sang kỳ hạn dài hơn.',
        icon: TrendingUp,
        tips: [
          'Luôn giữ 30-40% ở Linh hoạt để có thanh khoản',
          'Kỳ hạn dài hơn = APY cao hơn, nhưng kém linh hoạt',
          'Review phân bổ mỗi tháng khi có kỳ đáo hạn',
          'Stablecoin (USDT, USDC) ổn định hơn cho Cố định dài hạn',
        ],
      },
      {
        id: 'so2',
        title: 'Tái đầu tư tự động (Auto-compound)',
        description: 'Auto-compound tự động gộp lãi nhận được vào gốc để tạo lãi kép. Thay vì nhận lãi về ví, lãi được cộng thẳng vào số tiết kiệm → tháng sau tính lãi trên gốc + lãi cũ. Hiệu quả tăng 5-15% APY thực tế so với không compound.',
        icon: Zap,
        tips: [
          'Bật auto-compound cho tất cả sản phẩm Linh hoạt',
          'Compound hàng ngày hiệu quả hơn hàng tuần/tháng',
          'Kiểm tra lãi thực tế trên tab Thu nhập trong Portfolio',
          'Với Cố định, lãi thường được phân phối khi đáo hạn',
        ],
      },
      {
        id: 'so3',
        title: 'Theo dõi APY và thời điểm',
        description: 'APY không cố định — nó thay đổi theo cung/cầu thị trường. Khi nhu cầu vay cao (thị trường bull), APY tăng. Khi thị trường im ắng, APY giảm. Theo dõi APY trend để chọn thời điểm gửi Cố định tối ưu.',
        icon: Calculator,
        tips: [
          'Bật thông báo thay đổi APY > 0.5%',
          'Gửi Cố định khi APY đang cao và ổn định',
          'Xem lịch sử APY 30 ngày trên trang Chi tiết sản phẩm',
          'So sánh APY giữa các tài sản trước khi quyết định',
        ],
      },
    ],
  },
  {
    id: 'savings-risk',
    title: 'Rủi ro & An toàn Tiết kiệm',
    duration: '5 phút',
    difficulty: 'advanced',
    description: 'Hiểu rủi ro và cách bảo vệ tài sản trong tiết kiệm crypto.',
    steps: [
      {
        id: 'sr1',
        title: 'Các loại rủi ro cần biết',
        description: 'Tiết kiệm crypto có rủi ro thấp hơn trading nhưng không phải zero risk. Rủi ro chính: (1) Platform risk — nền tảng gặp sự cố, (2) Market risk — giá tài sản giảm trong khi khóa, (3) Liquidity risk — không rút kịp khi cần, (4) Smart contract risk — lỗi hệ thống kỹ thuật.',
        icon: AlertTriangle,
        tips: [
          'Stablecoin (USDT/USDC) loại bỏ market risk về giá',
          'Sản phẩm Linh hoạt loại bỏ liquidity risk',
          'Quỹ Bảo hiểm bảo vệ một phần platform risk',
          'Không gửi toàn bộ tài sản — giữ ít nhất 20% liquid',
        ],
      },
      {
        id: 'sr2',
        title: 'Rút sớm sản phẩm Cố định',
        description: 'Nếu bạn cần rút tiền từ sản phẩm Cố định trước đáo hạn, phí phạt sẽ áp dụng. Thường là mất toàn bộ hoặc một phần lãi đã tích lũy. Một số sản phẩm có thể tính thêm phí 0.5-2% trên gốc.',
        icon: Shield,
        tips: [
          'Đọc kỹ chính sách rút sớm trước khi gửi Cố định',
          'Phí rút sớm thường = mất hết lãi tích lũy',
          'Một số sản phẩm không cho phép rút sớm',
          'Review Rút sớm luôn hiển thị phí/lãi mất trước khi xác nhận',
        ],
      },
      {
        id: 'sr3',
        title: 'Bảo mật tài khoản',
        description: 'Tài sản tiết kiệm được bảo vệ bởi nhiều lớp bảo mật: mã hóa end-to-end, xác thực 2 yếu tố (2FA), quản lý thiết bị, anti-phishing code, và Quỹ Bảo hiểm. Luôn bật đầy đủ các lớp bảo mật trước khi gửi số lượng lớn.',
        icon: Shield,
        tips: [
          'BẮT BUỘC bật 2FA trước khi gửi tiết kiệm',
          'Kiểm tra thiết bị đăng nhập định kỳ',
          'Đặt anti-phishing code để nhận diện email giả',
          'Không chia sẻ mã OTP hay link xác nhận với bất kỳ ai',
        ],
      },
    ],
  },
];

const QUICK_TIPS = [
  { icon: PiggyBank, title: 'Bắt đầu nhỏ', desc: 'Gửi $50-200 đầu tiên để làm quen với hệ thống', color: '#10B981' },
  { icon: TrendingUp, title: 'Theo dõi APY', desc: 'APY thay đổi liên tục, kiểm tra hàng tuần', color: '#3B82F6' },
  { icon: Shield, title: 'Bật 2FA', desc: 'Bảo vệ tài khoản trước khi gửi số lượng lớn', color: '#EF4444' },
  { icon: Zap, title: 'Auto-compound', desc: 'Bật tái đầu tư tự động để tối đa lãi kép', color: '#8B5CF6' },
  { icon: Lock, title: 'Ladder strategy', desc: 'Chia tài sản vào nhiều kỳ hạn khác nhau', color: '#F59E0B' },
  { icon: Calculator, title: 'Tính phí rút sớm', desc: 'Luôn kiểm tra phí trước khi rút Cố định sớm', color: '#06B6D4' },
];

const KEY_TERMS = [
  { term: 'APY', def: 'Annual Percentage Yield — lãi suất hàng năm đã tính lãi kép' },
  { term: 'Linh hoạt', def: 'Sản phẩm rút tự do bất kỳ lúc nào, APY thấp hơn' },
  { term: 'Cố định', def: 'Sản phẩm khóa kỳ hạn, APY cao hơn, phí rút sớm' },
  { term: 'Auto-compound', def: 'Tự động gộp lãi vào gốc để tạo lãi kép' },
  { term: 'Rút sớm', def: 'Rút trước đáo hạn Cố định, mất lãi hoặc chịu phí phạt' },
  { term: 'Đáo hạn', def: 'Ngày kết thúc kỳ hạn khóa, gốc + lãi trả về ví' },
  { term: 'Quỹ Bảo hiểm', def: 'Quỹ dự phòng bảo vệ tài sản user khi xảy ra sự cố' },
];

/* ─── Difficulty config ─── */
const DIFF_CONFIG = {
  beginner: { label: 'Cơ bản', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  intermediate: { label: 'Trung bình', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  advanced: { label: 'Nâng cao', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

/* ═══════════════════════════════════════════════════════════ */
export function SavingsGuidePage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();

  const [tab, setTab] = useState<'tutorials' | 'glossary'>('tutorials');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState<Set<string>>(new Set());

  const handleComplete = () => {
    if (selectedTutorial) {
      setCompletedTutorials(prev => new Set(prev).add(selectedTutorial.id));
    }
    setSelectedTutorial(null);
    setCurrentStep(0);
    hapticLight();
  };

  const progress = TUTORIALS.length > 0
    ? Math.round((completedTutorials.size / TUTORIALS.length) * 100)
    : 0;

  return (
    <PageLayout>
      <Header title="Hướng dẫn Tiết kiệm" back />

      {/* ─── Tutorial Detail Bottom Sheet ─── */}
      <BottomSheetV2
        open={!!selectedTutorial}
        onClose={() => { setSelectedTutorial(null); setCurrentStep(0); }}
        title={selectedTutorial?.title || ''}
      >
        {selectedTutorial && (() => {
          const step = selectedTutorial.steps[currentStep];
          const Icon = step.icon;
          const total = selectedTutorial.steps.length;
          const pct = Math.round(((currentStep + 1) / total) * 100);

          return (
            <div className="px-5 pb-8 flex flex-col gap-4">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    Bước {currentStep + 1}/{total}
                  </span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    {pct}% hoàn thành
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ background: c.primary, width: `${pct}%` }} />
                </div>
              </div>

              {/* Step content */}
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}>
                  <Icon size={ICON_SIZE.lg} color="#10B981" />
                </div>
                <div className="flex-1">
                  <div style={{ color: c.text, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{step.title}</div>
                  <div style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                    Bước {currentStep + 1} / {total}
                  </div>
                </div>
              </div>

              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, lineHeight: 1.7 }}>
                {step.description}
              </p>

              {/* Tips */}
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb size={ICON_SIZE.sm} color={c.warning} strokeWidth={ICON_STROKE.standard} />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                    Tips quan trọng
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5" style={{ paddingLeft: 16 }}>
                  {step.tips.map((tip, idx) => (
                    <li key={idx} style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navigation buttons */}
              <div className="flex gap-2 mt-1">
                <button
                  disabled={currentStep === 0}
                  onClick={() => { setCurrentStep(s => s - 1); hapticLight(); }}
                  className="flex-1 py-3 rounded-[14px]"
                  style={{
                    background: c.surface2,
                    color: currentStep === 0 ? c.text3 : c.text,
                    fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold,
                    opacity: currentStep === 0 ? 0.5 : 1,
                  }}>
                  Trước
                </button>
                {currentStep < total - 1 ? (
                  <button
                    onClick={() => { setCurrentStep(s => s + 1); hapticLight(); }}
                    className="flex-1 py-3 rounded-[14px]"
                    style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                    Tiếp theo
                  </button>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="flex-1 py-3 rounded-[14px]"
                    style={{ background: c.success, color: '#FFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      <TabBar
        tabs={[
          { key: 'tutorials', label: 'Hướng dẫn' },
          { key: 'glossary', label: 'Thuật ngữ' },
        ]}
        active={tab}
        onChange={(k) => { setTab(k as typeof tab); hapticLight(); }}
      />

      <PageContent gap="default">
        {tab === 'tutorials' && (
          <>
            {/* Hero banner */}
            <div className="rounded-2xl p-4"
              style={{ background: withAlpha(c.success, ALPHA.ghost), border: `1.5px solid ${withAlpha(c.success, ALPHA.soft)}` }}>
              <div className="flex gap-3">
                <BookOpen size={ICON_SIZE.md} color={c.success} strokeWidth={ICON_STROKE.standard} className="shrink-0 mt-0.5" />
                <div>
                  <div style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
                    Tiết kiệm Crypto từ Zero
                  </div>
                  <div style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>
                    Hướng dẫn từng bước để bắt đầu gửi tiết kiệm và kiếm lãi thụ động từ crypto.
                    Không cần kiến thức kỹ thuật phức tạp.
                  </div>
                </div>
              </div>
            </div>

            {/* Learning progress */}
            <TrCard>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tiến trình học</span>
                <span style={{ color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                  {completedTutorials.size}/{TUTORIALS.length}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: c.borderSolid }}>
                <div className="h-full rounded-full transition-all"
                  style={{ background: c.success, width: `${progress}%` }} />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 size={ICON_SIZE.sm} color={progress === 100 ? c.success : c.text3} strokeWidth={ICON_STROKE.standard} />
                <span style={{ color: progress === 100 ? c.success : c.text3, fontSize: FONT_SCALE.xs }}>
                  {progress === 100
                    ? 'Bạn đã hoàn thành tất cả hướng dẫn!'
                    : `Còn ${TUTORIALS.length - completedTutorials.size} bài chưa hoàn thành`
                  }
                </span>
              </div>
            </TrCard>

            {/* Tutorial list */}
            <PageSection label="Bài hướng dẫn" accentColor="#10B981">
              <div className="flex flex-col gap-2">
                {TUTORIALS.map(tutorial => {
                  const diff = DIFF_CONFIG[tutorial.difficulty];
                  const isCompleted = completedTutorials.has(tutorial.id);
                  return (
                    <TrCard key={tutorial.id}>
                      <button
                        onClick={() => { setSelectedTutorial(tutorial); setCurrentStep(0); hapticSelection(); }}
                        className="flex items-start gap-3 w-full"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                            border: `1.5px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
                          }}>
                          {isCompleted
                            ? <CheckCircle2 size={ICON_SIZE.md} color="#10B981" />
                            : <PlayCircle size={ICON_SIZE.md} color="#3B82F6" />
                          }
                        </div>
                        <div className="flex-1 text-left">
                          <div style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
                            {tutorial.title}
                          </div>
                          <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.4, marginBottom: 4 }}>
                            {tutorial.description}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md"
                              style={{ background: diff.bg, color: diff.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>
                              {diff.label}
                            </span>
                            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>
                              {tutorial.duration} · {tutorial.steps.length} bước
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={ICON_SIZE.base} color={c.text3} className="shrink-0 mt-1" />
                      </button>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            {/* Quick tips grid */}
            <PageSection label="Mẹo nhanh" accentColor="#F59E0B">
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TIPS.map((tip, idx) => {
                  const Icon = tip.icon;
                  return (
                    <TrCard key={idx}>
                      <div className="flex flex-col gap-2 p-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${tip.color}18` }}>
                          <Icon size={ICON_SIZE.sm} color={tip.color} />
                        </div>
                        <div style={{ color: c.text, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{tip.title}</div>
                        <div style={{ color: c.text3, fontSize: FONT_SCALE.micro, lineHeight: 1.4 }}>{tip.desc}</div>
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            {/* CTA to savings */}
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <div style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
                Sẵn sàng bắt đầu?
              </div>
              <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 12, lineHeight: 1.5 }}>
                Khám phá các sản phẩm tiết kiệm đang có lãi suất hấp dẫn.
              </div>
              <button
                onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}
                className="w-full h-[48px] rounded-[14px] flex items-center justify-center gap-2"
                style={{ background: c.primary, color: '#FFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Khám phá sản phẩm
                <ArrowRight size={ICON_SIZE.sm} />
              </button>
            </div>
          </>
        )}

        {tab === 'glossary' && (
          <>
            {/* Glossary header */}
            <div className="flex items-center gap-2 px-1">
              <HelpCircle size={ICON_SIZE.sm} color="#3B82F6" />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                {KEY_TERMS.length} thuật ngữ
              </span>
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-2">
              {KEY_TERMS.map((item, idx) => (
                <TrCard key={idx}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                        {item.term.substring(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div style={{ color: c.text, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 }}>
                        {item.term}
                      </div>
                      <div style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                        {item.def}
                      </div>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <Shield size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0 mt-0.5" />
              <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, lineHeight: 1.4 }}>
                Thuật ngữ và giải thích mang tính giáo dục, không phải lời khuyên tài chính.
                Luôn tự nghiên cứu trước khi đưa ra quyết định đầu tư.
              </span>
            </div>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}