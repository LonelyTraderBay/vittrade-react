import React, { useState } from 'react';
import { BookOpen, PlayCircle, CheckCircle2, ChevronRight, Lightbulb, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  tips: string[];
}

interface Tutorial {
  id: string;
  title: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: GuideStep[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 'basic',
    title: 'Staking Cơ bản',
    duration: '5 phút',
    difficulty: 'beginner',
    steps: [
      {
        id: 's1',
        title: 'Staking là gì?',
        description: 'Staking là cách "khóa" crypto của bạn để hỗ trợ mạng blockchain và nhận phần thưởng. Giống như gửi tiết kiệm ngân hàng, nhưng APY cao hơn (4-20%).',
        icon: Lightbulb,
        tips: [
          'APY thường cao hơn lãi suất ngân hàng 5-10 lần',
          'Phần thưởng được phân phối tự động hàng ngày',
          'Bạn vẫn sở hữu 100% crypto đã stake',
        ],
      },
      {
        id: 's2',
        title: 'Chọn loại Staking',
        description: 'Có 3 loại chính: Flexible (rút bất kỳ lúc nào), Fixed (khóa thời gian cố định, APY cao hơn), và DeFi (thanh khoản pool, rủi ro cao hơn).',
        icon: TrendingUp,
        tips: [
          'Flexible: APY 4-6%, rút bất kỳ lúc nào',
          'Fixed: APY 6-10%, khóa 30-90 ngày',
          'DeFi: APY 10-25%, rủi ro smart contract',
        ],
      },
      {
        id: 's3',
        title: 'Tính toán Lợi nhuận',
        description: 'Dùng công thức: Lãi hàng năm = Số lượng stake × APY%. Ví dụ: Stake $10,000 với APY 7.5% = $750/năm = $62.5/tháng.',
        icon: CheckCircle2,
        tips: [
          'Dùng tính năng Auto-compound để tối đa hóa lợi nhuận',
          'APY thực tế có thể thay đổi theo thị trường',
          'Đừng quên trừ phí (nếu có)',
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Staking Nâng cao',
    duration: '10 phút',
    difficulty: 'intermediate',
    steps: [
      {
        id: 'a1',
        title: 'Chọn Validator',
        description: 'Validator là người vận hành node blockchain. Chọn validator uy tín với uptime cao (&gt;99.9%), phí hợp lý (5-10%), và không có lịch sử slashing.',
        icon: Shield,
        tips: [
          'Ưu tiên validator Top Tier hoặc Recommended',
          'Kiểm tra uptime và slashing history',
          'Đa dạng hóa qua nhiều validator để giảm rủi ro',
        ],
      },
      {
        id: 'a2',
        title: 'Auto-Compound Strategy',
        description: 'Auto-compound tự động tái đầu tư phần thưởng để tạo lãi kép. Tần suất Daily cho APY tối đa, nhưng phí gas cao hơn. Weekly/Monthly cân bằng hơn.',
        icon: TrendingUp,
        tips: [
          'Daily compound: +0.5-1% APY extra',
          'Bật Gas Optimization để tiết kiệm phí',
          'Đặt minimum threshold tránh compound số nhỏ',
        ],
      },
      {
        id: 'a3',
        title: 'Liquid Staking',
        description: 'Nhận liquid token (stETH, rETH) khi stake để vẫn giữ thanh khoản. Có thể swap, dùng làm collateral, hoặc farm thêm ở DeFi.',
        icon: Lightbulb,
        tips: [
          'stETH từ Lido có thanh khoản tốt nhất',
          'Cẩn thận rủi ro depegging (stToken ≠ ETH)',
          'Slippage có thể cao khi thị trường biến động',
        ],
      },
    ],
  },
  {
    id: 'risk',
    title: 'Quản lý Rủi ro',
    duration: '8 phút',
    difficulty: 'advanced',
    steps: [
      {
        id: 'r1',
        title: 'Hiểu các loại Rủi ro',
        description: 'Staking có 4 rủi ro chính: Slashing (validator vi phạm), Smart contract bug, Market risk (giá giảm), và Liquidity risk (không rút được).',
        icon: AlertTriangle,
        tips: [
          'Slashing: Mất 0.01-5% nếu validator vi phạm',
          'Smart contract: Rủi ro bị hack (DeFi)',
          'Market risk: Giá crypto giảm (không liên quan staking)',
        ],
      },
      {
        id: 'r2',
        title: 'Sử dụng Insurance',
        description: 'Mua insurance để bồi thường 25-75% thiệt hại nếu bị slashing. Phí chỉ 0.5-1.5% APY/năm, rất đáng với số lượng lớn.',
        icon: Shield,
        tips: [
          'Standard plan (50% coverage) phù hợp nhất',
          'Premium plan cho số lượng &gt;$50,000',
          'Insurance KHÔNG cover market risk',
        ],
      },
      {
        id: 'r3',
        title: 'Diversification Strategy',
        description: 'Đừng stake tất cả vào 1 nơi. Phân bổ 50% Flexible, 30% Fixed, 20% DeFi. Hoặc chia qua nhiều validator/protocol khác nhau.',
        icon: TrendingUp,
        tips: [
          'Không stake quá 50% tổng tài sản',
          'Giữ một phần Flexible để thanh khoản khẩn cấp',
          'Review portfolio hàng tháng',
        ],
      },
    ],
  },
];

const QUICK_TIPS = [
  { icon: '💡', title: 'Bắt đầu nhỏ', desc: 'Stake $100-500 đầu tiên để học cách hoạt động' },
  { icon: '📊', title: 'Theo dõi APY', desc: 'APY thay đổi liên tục, kiểm tra hàng tuần' },
  { icon: '🔒', title: 'Bật 2FA', desc: 'Bảo vệ tài khoản trước khi stake số lượng lớn' },
  { icon: '📱', title: 'Bật thông báo', desc: 'Nhận alert khi có maturity hoặc thay đổi APY' },
  { icon: '💰', title: 'Tính phí', desc: 'Đừng quên trừ phí validator và gas fee' },
  { icon: '⏰', title: 'Lên lịch', desc: 'Dùng Calendar để không bỏ lỡ ngày đáo hạn' },
];

export function StakingGuidePage() {
  const c = useThemeColors();
  const [tab, setTab] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const filteredTutorials = TUTORIALS.filter(t => t.difficulty === tab);

  return (
    <PageLayout>
      <Header title="Hướng dẫn Staking" back />

      {/* Tutorial Detail Bottom Sheet */}
      <BottomSheetV2
        open={!!selectedTutorial}
        onClose={() => {
          setSelectedTutorial(null);
          setCurrentStep(0);
        }}
        title={selectedTutorial?.title || ''}>
        {selectedTutorial && (
          <div className="flex flex-col gap-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p style={{ color: c.text3, fontSize: 12 }}>
                  Bước {currentStep + 1}/{selectedTutorial.steps.length}
                </p>
                <p style={{ color: c.text3, fontSize: 12 }}>
                  {Math.round(((currentStep + 1) / selectedTutorial.steps.length) * 100)}% hoàn thành
                </p>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: c.borderSolid }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    background: c.primary,
                    width: `${((currentStep + 1) / selectedTutorial.steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Current Step */}
            {(() => {
              const step = selectedTutorial.steps[currentStep];
              const Icon = step.icon;
              return (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                      <Icon size={24} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
                        {step.title}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        Bước {currentStep + 1} / {selectedTutorial.steps.length}
                      </p>
                    </div>
                  </div>

                  <p style={{ color: c.text2, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                    {step.description}
                  </p>

                  <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text2, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                      💡 Tips quan trọng:
                    </p>
                    <ul style={{ color: c.text2, fontSize: 12, lineHeight: 1.7, paddingLeft: 16 }}>
                      {step.tips.map((tip, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="flex gap-2">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: currentStep === 0 ? c.surface2 : c.surface2,
                  color: currentStep === 0 ? c.text3 : c.text1,
                  opacity: currentStep === 0 ? 0.5 : 1,
                }}>
                Trước
              </button>
              {currentStep < selectedTutorial.steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: c.primary, color: '#FFF' }}>
                  Tiếp theo
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedTutorial(null);
                    setCurrentStep(0);
                  }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: '#10B981', color: '#FFF' }}>
                  Hoàn thành ✓
                </button>
              )}
            </div>
          </div>
        )}
      </BottomSheetV2>

      <PageContent>
        {/* Hero Banner */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1.5px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <BookOpen size={20} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                Học Staking từ Zero
              </p>
              <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                Hướng dẫn từng bước để bạn bắt đầu kiếm passive income từ crypto. Từ cơ bản đến nâng cao.
              </p>
            </div>
          </div>
        </div>

        {/* Level Selector */}
        <TabBar
          tabs={[
            { id: 'beginner', label: 'Beginner' },
            { id: 'intermediate', label: 'Intermediate' },
            { id: 'advanced', label: 'Advanced' },
          ]}
          active={tab}
          onChange={setTab as any}
        />

        {/* Tutorials */}
        <PageSection label="Tutorials">
          <div className="flex flex-col gap-3">
            {filteredTutorials.map(tutorial => (
              <TrCard key={tutorial.id} hover className="p-4" onClick={() => setSelectedTutorial(tutorial)}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                    <PlayCircle size={24} color="#3B82F6" />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                      {tutorial.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{
                          background: tutorial.difficulty === 'beginner' ? 'rgba(16,185,129,0.15)' :
                                     tutorial.difficulty === 'intermediate' ? 'rgba(59,130,246,0.15)' :
                                     'rgba(245,158,11,0.15)',
                          color: tutorial.difficulty === 'beginner' ? '#10B981' :
                                 tutorial.difficulty === 'intermediate' ? '#3B82F6' :
                                 '#F59E0B',
                        }}>
                        {tutorial.difficulty}
                      </span>
                      <span style={{ color: c.text3, fontSize: 11 }}>
                        {tutorial.duration} • {tutorial.steps.length} bước
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} color={c.text3} className="shrink-0" />
                </div>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Quick Tips */}
        <PageSection label="Quick Tips">
          <div className="grid grid-cols-2 gap-3">
            {QUICK_TIPS.map((tip, idx) => (
              <TrCard key={idx} className="p-3">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>
                  {tip.title}
                </p>
                <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                  {tip.desc}
                </p>
              </TrCard>
            ))}
          </div>
        </PageSection>

        {/* Common Mistakes */}
        <PageSection label="Tránh sai lầm phổ biến">
          <TrCard className="p-4">
            <div className="flex flex-col gap-3">
              {[
                {
                  title: 'Stake tất cả vào Fixed dài hạn',
                  desc: 'Nên giữ 30-50% ở Flexible để thanh khoản khẩn cấp',
                  color: '#EF4444',
                },
                {
                  title: 'Không đọc điều khoản rút',
                  desc: 'Fixed có unbonding period 7-14 ngày, không rút ngay được',
                  color: '#F59E0B',
                },
                {
                  title: 'Bỏ qua rủi ro slashing',
                  desc: 'Chọn validator uy tín, hoặc mua insurance cho số lớn',
                  color: '#EF4444',
                },
                {
                  title: 'Quên compound phần thưởng',
                  desc: 'Bật Auto-compound để tối đa hóa lợi nhuận kép',
                  color: '#F59E0B',
                },
              ].map((mistake, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                  <AlertTriangle size={18} color={mistake.color} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      ❌ {mistake.title}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                      ✅ {mistake.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>
        </PageSection>

        {/* CTA */}
        <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            Sẵn sàng bắt đầu?
          </p>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>
            Stake từ $100 để thử nghiệm. Bắt đầu với Flexible APY 6.5% - rút bất kỳ lúc nào.
          </p>
          <button
            className="px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: c.primary, color: '#FFF' }}>
            Stake ngay →
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
