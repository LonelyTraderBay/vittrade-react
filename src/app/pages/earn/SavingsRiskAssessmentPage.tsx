import React, { useState } from 'react';
import {
  Shield, CheckCircle2, TrendingUp, AlertCircle, ArrowRight,
  RotateCcw, PiggyBank, Lock, Unlock, Sparkles, Clock,
  AlertTriangle, ChevronRight, Target,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtUsd } from '../../data/formatNumber';

/* ═══════════════════════════════════════════════════════════
   Savings-specific Risk Assessment Questions
   ═══════════════════════════════════════════════════════════ */

interface Question {
  id: string;
  question: string;
  helpText?: string;
  options: { label: string; value: number; description?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'experience',
    question: 'Kinh nghiệm đầu tư / tiết kiệm crypto của bạn?',
    options: [
      { label: 'Hoàn toàn mới', value: 0, description: 'Chưa từng gửi tiết kiệm crypto' },
      { label: 'Cơ bản', value: 1, description: 'Đã dùng flexible savings 1-2 lần' },
      { label: 'Có kinh nghiệm', value: 2, description: 'Đã dùng flexible + locked savings' },
      { label: 'Thành thạo', value: 3, description: 'Hiểu rõ APY, lock period, risks' },
    ],
  },
  {
    id: 'savings-goal',
    question: 'Mục tiêu gửi tiết kiệm chính của bạn?',
    options: [
      { label: 'Bảo toàn vốn', value: 0, description: 'Giữ tiền an toàn, lãi nhẹ là đủ' },
      { label: 'Thu nhập thụ động', value: 1, description: 'Kiếm lãi đều đặn hàng tháng' },
      { label: 'Tăng trưởng', value: 2, description: 'Tối đa hóa lợi suất trong trung hạn' },
      { label: 'Tối đa APY', value: 3, description: 'Sẵn sàng lock dài để APY cao nhất' },
    ],
  },
  {
    id: 'risk-tolerance',
    question: 'Bạn phản ứng thế nào nếu tài sản giảm 15-20%?',
    helpText: 'Giá crypto biến động — ảnh hưởng giá trị sản phẩm cố định BTC/ETH/SOL.',
    options: [
      { label: 'Rất lo lắng, muốn rút ngay', value: 0 },
      { label: 'Lo nhưng chờ đáo hạn', value: 1 },
      { label: 'Bình tĩnh, chấp nhận biến động', value: 2 },
      { label: 'Không quan tâm, giữ dài hạn', value: 3 },
    ],
  },
  {
    id: 'liquidity',
    question: 'Bạn có cần dùng khoản tiền này trong thời gian ngắn?',
    helpText: 'Sản phẩm cố định không rút sớm được mà không mất lãi.',
    options: [
      { label: 'Có thể cần bất kỳ lúc nào', value: 0 },
      { label: 'Có thể cần trong 1-2 tháng', value: 1 },
      { label: 'Không cần trong 3-6 tháng', value: 2 },
      { label: 'Tiền dư — không cần trong 6+ tháng', value: 3 },
    ],
  },
  {
    id: 'asset-preference',
    question: 'Bạn ưu tiên loại tài sản nào để tiết kiệm?',
    options: [
      { label: 'Chỉ stablecoin (USDT/USDC)', value: 0, description: 'Không rủi ro biến động giá' },
      { label: 'Stablecoin + BTC/ETH', value: 1, description: 'Mix an toàn + blue-chip crypto' },
      { label: 'Đa dạng (+ altcoin top)', value: 2, description: 'Thêm SOL, AVAX, etc.' },
      { label: 'APY cao nhất, bất kỳ asset', value: 3, description: 'Ưu tiên lợi suất trên hết' },
    ],
  },
  {
    id: 'lock-comfort',
    question: 'Bạn thoải mái với kỳ hạn lock bao lâu?',
    helpText: 'Lock càng dài → APY càng cao, nhưng không rút sớm được.',
    options: [
      { label: 'Chỉ linh hoạt (flexible)', value: 0, description: 'Rút bất kỳ lúc nào' },
      { label: 'Cố định ngắn (≤30 ngày)', value: 1, description: 'Lock tối đa 1 tháng' },
      { label: 'Cố định vừa (31-90 ngày)', value: 2, description: 'Sẵn sàng lock 1-3 tháng' },
      { label: 'Cố định dài (90+ ngày)', value: 3, description: 'Lock dài để APY cao nhất' },
    ],
  },
  {
    id: 'amount-ratio',
    question: 'Khoản tiết kiệm này chiếm bao nhiêu % tổng tài sản crypto?',
    options: [
      { label: 'Phần lớn (>60%)', value: 0, description: 'Cần cẩn thận — an toàn trước' },
      { label: 'Kha khá (30-60%)', value: 1 },
      { label: 'Một phần (10-30%)', value: 2 },
      { label: 'Rất nhỏ (<10%)', value: 3, description: 'Tiền dư — sẵn sàng chấp nhận rủi ro' },
    ],
  },
];

/* ─── Risk Profile Result Logic ─── */

interface RiskResult {
  level: 'conservative' | 'moderate' | 'aggressive';
  label: string;
  color: string;
  bg: string;
  description: string;
  recommendations: string[];
  products: { name: string; apy: string; risk: string; type: string; color: string }[];
  strategyMatch: string;
  warnings: string[];
}

function getRiskProfile(score: number): RiskResult {
  if (score <= 7) {
    return {
      level: 'conservative',
      label: 'Thận trọng (Conservative)',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      description: 'Bạn ưu tiên an toàn và bảo toàn vốn. Nên chọn sản phẩm linh hoạt hoặc cố định ngắn hạn với stablecoin.',
      recommendations: [
        'Ưu tiên sản phẩm Linh hoạt (Flexible) — rút bất kỳ lúc nào',
        'Stablecoin (USDT) chiếm 60-80% danh mục tiết kiệm',
        'Cố định ngắn hạn (30 ngày) cho phần còn lại',
        'Tránh lock dài (90+ ngày) nếu chưa sẵn sàng',
        'Đọc kỹ điều khoản rút sớm trước khi đăng ký cố định',
      ],
      products: [
        { name: 'USDT Linh hoạt', apy: '4.5%', risk: 'Rất thấp', type: 'Linh hoạt', color: '#26A17B' },
        { name: 'USDT Cố định 30D', apy: '7.2%', risk: 'Thấp', type: 'Cố định', color: '#26A17B' },
        { name: 'BTC Linh hoạt', apy: '1.8%', risk: 'Thấp', type: 'Linh hoạt', color: '#F7931A' },
      ],
      strategyMatch: 'Lãi suất Ổn định',
      warnings: [
        'Stablecoin cũng có rủi ro counterparty (issuer risk)',
        'APY có thể thay đổi theo điều kiện thị trường',
      ],
    };
  } else if (score <= 14) {
    return {
      level: 'moderate',
      label: 'Cân bằng (Moderate)',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      description: 'Bạn chấp nhận rủi ro vừa phải để đổi lấy lợi suất cao hơn. Nên mix giữa linh hoạt và cố định, stablecoin và blue-chip crypto.',
      recommendations: [
        'Mix 30-40% Flexible + 60-70% Fixed (nhiều kỳ hạn)',
        'Đa dạng hóa: USDT (40%) + BTC (25%) + ETH/SOL (35%)',
        'Chọn nhiều kỳ hạn khác nhau để dòng tiền liên tục',
        'Cố định 30-90 ngày — APY cao, kỳ hạn hợp lý',
        'Theo dõi ngày đáo hạn và gia hạn kịp thời',
      ],
      products: [
        { name: 'USDT Linh hoạt', apy: '4.5%', risk: 'Thấp', type: 'Linh hoạt', color: '#26A17B' },
        { name: 'USDT Cố định 90D', apy: '9.8%', risk: 'Thấp', type: 'Cố định', color: '#26A17B' },
        { name: 'BTC Cố định 60D', apy: '3.5%', risk: 'Trung bình', type: 'Cố định', color: '#F7931A' },
        { name: 'SOL Cố định 30D', apy: '6.5%', risk: 'Trung bình', type: 'Cố định', color: '#9945FF' },
      ],
      strategyMatch: 'Tăng trưởng Cân bằng',
      warnings: [
        'Giá BTC/SOL có thể biến động 20-30% trong 30-90 ngày',
        'Rút sớm sản phẩm cố định sẽ mất toàn bộ lãi tích luỹ',
        'Cần theo dõi ngày đáo hạn để tái ký kịp thời',
      ],
    };
  } else {
    return {
      level: 'aggressive',
      label: 'Năng động (Aggressive)',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      description: 'Bạn ưu tiên tối đa hóa lợi suất, sẵn sàng chấp nhận rủi ro biến động giá và lock dài hạn.',
      recommendations: [
        'Ưu tiên sản phẩm Cố định 60-90 ngày — APY cao nhất',
        'Đa dạng altcoin: SOL, ETH cùng USDT fixed',
        'Giữ tối thiểu 15-20% flexible cho thanh khoản khẩn cấp',
        'Tận dụng sản phẩm có APY bonus (VIP tier)',
        'Theo dõi thị trường để chốt lợi nhuận khi đáo hạn',
      ],
      products: [
        { name: 'USDT Cố định 90D', apy: '9.8%', risk: 'Thấp', type: 'Cố định', color: '#26A17B' },
        { name: 'BTC Cố định 60D', apy: '3.5%', risk: 'Trung bình', type: 'Cố định', color: '#F7931A' },
        { name: 'SOL Cố định 30D', apy: '6.5%', risk: 'Trung bình', type: 'Cố định', color: '#9945FF' },
        { name: 'ETH Linh hoạt', apy: '2.1%', risk: 'Thấp', type: 'Linh hoạt', color: '#627EEA' },
      ],
      strategyMatch: 'Tối đa Lợi suất',
      warnings: [
        'Lock dài hạn = không rút sớm. Đảm bảo bạn không cần tiền',
        'Altcoin có thể giảm 30-50% trong thời gian lock',
        'APY có thể thay đổi — không phải lợi nhuận đảm bảo',
        'Phân tán nhiều sản phẩm để giảm thiểu rủi ro tập trung',
      ],
    };
  }
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsRiskAssessmentPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticSuccess, hapticLight } = useHaptic();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: number) => {
    const question = QUESTIONS[currentQuestion];
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);
    hapticSelection();

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => {
        setShowResult(true);
        hapticSuccess();
      }, 400);
    }
  };

  const reset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    hapticLight();
  };

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const maxScore = QUESTIONS.length * 3;
  const profile = getRiskProfile(totalScore);
  const progress = showResult ? 100 : ((currentQuestion) / QUESTIONS.length) * 100;
  const answeredCount = Object.keys(answers).length;

  /* ═══ Result Screen ═══ */
  if (showResult) {
    return (
      <PageLayout>
        <Header title="Kết quả Đánh giá" back />
        <PageContent gap="default">
          {/* Result Card — FIXED: Better contrast & typography on dark gradient */}
          <TrCard variant="hero" rounded="lg" className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: profile.bg, border: `2px solid ${profile.color}` }}>
                <Shield size={ICON_SIZE.xl} color={profile.color} />
              </div>
              <div className="flex-1">
                <p style={{
                  color: c.portfolioTextMuted,
                  fontSize: FONT_SCALE.xs,
                  marginBottom: 2,
                  fontWeight: FONT_WEIGHT.medium,
                }}>
                  Hồ sơ rủi ro tiết kiệm:
                </p>
                <p style={{
                  color: '#FFFFFF',
                  fontSize: FONT_SCALE.lg,
                  fontWeight: FONT_WEIGHT.bold,
                  marginBottom: 6,
                  letterSpacing: -0.5,
                }}>
                  {profile.label}
                </p>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: FONT_SCALE.sm,
                  lineHeight: 1.6,
                  fontWeight: FONT_WEIGHT.regular,
                }}>
                  {profile.description}
                </p>
              </div>
            </div>

            {/* Score bar */}
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>Điểm rủi ro:</span>
                <span style={{ color: profile.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                  {totalScore}/{maxScore} điểm
                </span>
              </div>
              <div className="h-2.5 rounded-full flex" style={{ background: c.borderSolid }}>
                <div className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, #10B981, ${profile.color})`,
                    width: `${(totalScore / maxScore) * 100}%`,
                    transition: 'width 0.6s ease',
                  }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Thận trọng</span>
                <span style={{ color: '#F59E0B', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Cân bằng</span>
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Năng động</span>
              </div>
            </div>
          </TrCard>

          {/* Strategy match */}
          <TrCard className="p-4" accentBorder={`${profile.color}30`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={ICON_SIZE.sm} color={profile.color} />
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Chiến lược phù hợp</p>
            </div>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 12 }}>
              Dựa trên kết quả, chiến lược <strong style={{ color: profile.color }}>"{profile.strategyMatch}"</strong> phù hợp nhất với bạn.
            </p>
            <button
              onClick={() => { navigate(`${prefix}/earn/savings/recommendations`); hapticSelection(); }}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
              style={{ background: `${profile.color}15`, color: profile.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, border: `1px solid ${profile.color}30` }}>
              <Target size={ICON_SIZE.sm} />
              Xem gợi ý chi tiết
              <ChevronRight size={ICON_SIZE.sm} />
            </button>
          </TrCard>

          {/* Recommendations */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={ICON_SIZE.sm} color={profile.color} />
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>Gợi ý cho bạn</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {profile.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 size={ICON_SIZE.sm} color={profile.color} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.6 }}>{rec}</p>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Recommended Products */}
          <PageSection label="Sản phẩm phù hợp" accentColor={profile.color}>
            <div className="flex flex-col gap-2">
              {profile.products.map((product, idx) => (
                <TrCard key={idx} hover className="p-3.5"
                  onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: product.color + '22', border: `1.5px solid ${product.color}44` }}>
                      {product.type === 'Linh hoạt'
                        ? <Unlock size={ICON_SIZE.sm} color={product.color} />
                        : <Lock size={ICON_SIZE.sm} color={product.color} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, marginBottom: 2 }}>
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{product.type}</span>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{
                            background: product.risk === 'Rất thấp' || product.risk === 'Thấp' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                            color: product.risk === 'Rất thấp' || product.risk === 'Thấp' ? '#10B981' : '#F59E0B',
                            fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold,
                          }}>
                          {product.risk}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: '#10B981', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{product.apy}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY</p>
                    </div>
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>

          {/* Warnings */}
          {profile.warnings.length > 0 && (
            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" />
                <p style={{ color: '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>Lưu ý rủi ro</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {profile.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: '#F59E0B' }} />
                    <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <CTAButton onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}>
              <PiggyBank size={ICON_SIZE.base} />
              Khám phá sản phẩm
            </CTAButton>
          </div>
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2"
            style={{ background: c.surface2, color: c.text2, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SCALE.sm }}>
            <RotateCcw size={ICON_SIZE.sm} />
            Làm lại đánh giá
          </button>

          {/* Footer disclaimer */}
          <div className="rounded-2xl p-3" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.6, textAlign: 'center' }}>
              Hồ sơ rủi ro được lưu trong tài khoản. Bạn có thể đánh giá lại bất kỳ lúc nào.
              Đây không phải tư vấn tài chính — bạn chịu trách nhiệm cho quyết định đầu tư.
            </p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  /* ═══ Question Screen ═══ */
  const question = QUESTIONS[currentQuestion];

  return (
    <PageLayout variant="flush">
      <Header title="Đánh giá Rủi ro" back />

      <PageContent grow gap="default">
        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
              Câu hỏi {currentQuestion + 1}/{QUESTIONS.length}
            </span>
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: c.borderSolid }}>
            <div className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }} />
          </div>
        </div>

        {/* Question Card */}
        <TrCard className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
              <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>
                {currentQuestion + 1}
              </span>
            </div>
            <div className="flex-1">
              <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 1.4 }}>
                {question.question}
              </p>
              {question.helpText && (
                <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginTop: 4 }}>
                  {question.helpText}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[question.id] === option.value;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 rounded-xl text-left"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.12)' : c.surface2,
                    border: `1.5px solid ${isSelected ? '#3B82F6' : c.borderSolid}`,
                    transition: 'all 150ms ease',
                  }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span style={{
                        color: isSelected ? '#3B82F6' : c.text1,
                        fontSize: FONT_SCALE.sm,
                        fontWeight: isSelected ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                      }}>
                        {option.label}
                      </span>
                      {option.description && (
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 2 }}>
                          {option.description}
                        </p>
                      )}
                    </div>
                    {isSelected && <CheckCircle2 size={ICON_SIZE.md} color="#3B82F6" className="shrink-0 ml-2" />}
                  </div>
                </button>
              );
            })}
          </div>
        </TrCard>

        {/* Info banner */}
        <div className="rounded-xl p-3"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-2">
            <AlertCircle size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Trả lời trung thực để nhận gợi ý sản phẩm tiết kiệm phù hợp. Kết quả có thể thay đổi khi làm lại.
            </p>
          </div>
        </div>
      </PageContent>

      {/* Navigation footer */}
      {currentQuestion > 0 && (
        <StickyFooter>
          <button
            onClick={() => { setCurrentQuestion(currentQuestion - 1); hapticLight(); }}
            className="w-full py-3 rounded-xl"
            style={{ background: c.surface2, color: c.text2, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SCALE.sm }}>
            ← Quay lại câu trước
          </button>
        </StickyFooter>
      )}
    </PageLayout>
  );
}