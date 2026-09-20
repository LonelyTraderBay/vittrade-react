/**
 * ══════════════════════════════════════════════════════════════════
 *  REGULATORY COMPLIANCE COMPONENTS
 * ══════════════════════════════════════════════════════════════════
 *  MiFID II / ESMA / FCA / MAS compliance features:
 *  - Appropriateness Test (Knowledge Quiz)
 *  - Professional Client Categorization
 *  - Leverage Restriction Enforcement
 *  - Margin Close-out Rule (50% equity)
 *  - Best Execution Disclosure
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Shield, FileText, Info } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. APPROPRIATENESS TEST (MiFID II / MAS)
   ═══════════════════════════════════════════════════════════════ */

interface AppropriatenessTestProps {
  leverageRequested: number;
  onPass: () => void;
  onFail: () => void;
  open: boolean;
  onClose: () => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const MARGIN_TRADING_QUESTIONS: Question[] = [
  {
    id: 'q1',
    question: 'Margin trading là gì?',
    options: [
      'Giao dịch không có rủi ro với tiền vay',
      'Giao dịch với tiền vay để khuếch đại lợi nhuận (và lỗ)',
      'Một loại tài khoản tiết kiệm có lãi suất cao',
      'Chỉ dành cho nhà đầu tư tổ chức',
    ],
    correctIndex: 1,
    explanation: 'Margin trading cho phép bạn vay tiền để giao dịch lớn hơn vốn có, nhưng điều này cũng khuếch đại lỗ.',
  },
  {
    id: 'q2',
    question: 'Điều gì xảy ra nếu margin level của bạn giảm xuống dưới Maintenance Margin Ratio (MMR)?',
    options: [
      'Không có gì, bạn vẫn giữ vị thế',
      'Bạn nhận được cảnh báo nhưng không bị ảnh hưởng',
      'Vị thế của bạn bị thanh lý (đóng tự động)',
      'Bạn được thêm margin miễn phí',
    ],
    correctIndex: 2,
    explanation: 'Khi margin level < MMR, hệ thống sẽ tự động thanh lý vị thế của bạn để bảo vệ nền tảng khỏi lỗ.',
  },
  {
    id: 'q3',
    question: 'Với đòn bẩy 10x, nếu giá biến động ngược chiều bao nhiêu % thì bạn bị thanh lý?',
    options: [
      'Khoảng 10%',
      'Khoảng 50%',
      'Khoảng 1%',
      'Khoảng 90-100% (chỉ khi giá về 0)',
    ],
    correctIndex: 0,
    explanation: 'Với 10x leverage, giá chỉ cần biến động ngược ~10% (chính xác hơn là 100%/10 = 10%) là bạn mất hết margin.',
  },
  {
    id: 'q4',
    question: 'Stop Loss là gì và tại sao nên dùng?',
    options: [
      'Lệnh tự động đóng vị thế khi giá chạm mức chỉ định, giúp giới hạn lỗ',
      'Lệnh tự động mua thêm khi giá giảm',
      'Một loại phí giao dịch',
      'Chỉ dành cho pro trader, beginner không cần',
    ],
    correctIndex: 0,
    explanation: 'Stop Loss là công cụ quản lý rủi ro quan trọng nhất, tự động cắt lỗ khi giá đi ngược dự đoán.',
  },
  {
    id: 'q5',
    question: 'Rủi ro lớn nhất của margin trading là gì?',
    options: [
      'Phí giao dịch cao',
      'Bị thanh lý và mất toàn bộ margin đã đặt vào',
      'Không thể rút tiền trong 1 năm',
      'Bị hack tài khoản',
    ],
    correctIndex: 1,
    explanation: 'Rủi ro lớn nhất là thanh lý - bạn có thể mất 100% margin nếu thị trường biến động mạnh.',
  },
];

const QUESTIONS_FOR_HIGH_LEVERAGE: Question[] = [
  {
    id: 'hq1',
    question: 'Với đòn bẩy 50x, giá chỉ cần biến động bao nhiêu % là bạn bị thanh lý?',
    options: ['~2%', '~10%', '~25%', '~50%'],
    correctIndex: 0,
    explanation: 'Với 50x, giá chỉ cần di chuyển ~2% (100%/50) ngược chiều là bạn mất toàn bộ margin.',
  },
  {
    id: 'hq2',
    question: 'Tại sao đòn bẩy cao cực kỳ rủi ro?',
    options: [
      'Phí cao hơn',
      'Không thể đặt Stop Loss',
      'Biến động nhỏ cũng có thể thanh lý toàn bộ vị thế',
      'Chỉ được giao dịch BTC',
    ],
    correctIndex: 2,
    explanation: 'Đòn bẩy cao làm bạn cực kỳ dễ bị thanh lý ngay cả với biến động giá rất nhỏ.',
  },
];

export function AppropriatenessTest({ leverageRequested, onPass, onFail, open, onClose }: AppropriatenessTestProps) {
  const c = useThemeColors();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const isHighLeverage = leverageRequested > 20;
  const questions = isHighLeverage
    ? [...MARGIN_TRADING_QUESTIONS, ...QUESTIONS_FOR_HIGH_LEVERAGE]
    : MARGIN_TRADING_QUESTIONS;

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      // Calculate score
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const correctCount = answers.filter((ans, i) => ans === questions[i].correctIndex).length;
  const passThreshold = isHighLeverage ? questions.length : Math.ceil(questions.length * 0.8); // 100% for >20x, 80% for ≤20x
  const passed = correctCount >= passThreshold;

  const handleFinish = () => {
    if (passed) {
      onPass();
    } else {
      onFail();
    }
    onClose();
    // Reset for next time
    setTimeout(() => {
      setCurrentQ(0);
      setAnswers([]);
      setShowResult(false);
    }, 500);
  };

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Kiểm tra kiến thức"
      subtitle={`Đòn bẩy ${leverageRequested}x yêu cầu ${isHighLeverage ? '100%' : '80%'} đúng`}
    >
      {!showResult ? (
        <div className="flex flex-col gap-4">
          {/* Progress */}
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
              Câu {currentQ + 1}/{questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: i < currentQ ? c.primary : i === currentQ ? c.primary : c.surface2,
                    opacity: i < currentQ ? 1 : i === currentQ ? 0.6 : 0.3,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, lineHeight: 1.5 }}>
              {questions[currentQ].question}
            </p>
          </TrCard>

          {/* Options */}
          <div className="flex flex-col gap-2">
            {questions[currentQ].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="rounded-2xl p-4 text-left transition-all"
                style={{
                  background: c.surface,
                  border: `1.5px solid ${c.borderSolid}`,
                  color: c.text1,
                  fontSize: FONT_SCALE.sm,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: c.surface2 }}
                  >
                    <span style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                  <span>{opt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Result card */}
          <TrCard
            className="p-6 text-center"
            style={{
              background: passed ? withAlpha('#10B981', ALPHA.hover) : withAlpha('#EF4444', ALPHA.hover),
              border: `1.5px solid ${passed ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft)}`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: passed ? withAlpha('#10B981', ALPHA.muted) : withAlpha('#EF4444', ALPHA.muted) }}
            >
              {passed ? (
                <CheckCircle size={ICON_SIZE.xl} color="#10B981" strokeWidth={ICON_STROKE.bold} />
              ) : (
                <XCircle size={ICON_SIZE.xl} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
              )}
            </div>
            <p
              style={{
                color: passed ? '#10B981' : '#EF4444',
                fontSize: FONT_SCALE.lg,
                fontWeight: FONT_WEIGHT.bold,
                marginBottom: 8,
              }}
            >
              {passed ? 'Đạt yêu cầu!' : 'Chưa đạt yêu cầu'}
            </p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.semibold, marginBottom: 4 }}>
              Điểm: {correctCount}/{questions.length} ({((correctCount / questions.length) * 100).toFixed(0)}%)
            </p>
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              {passed
                ? `Bạn đã hiểu đủ rủi ro của đòn bẩy ${leverageRequested}x. Bạn có thể tiếp tục giao dịch.`
                : `Bạn cần trả lời đúng tối thiểu ${passThreshold} câu để sử dụng đòn bẩy ${leverageRequested}x. Vui lòng học thêm về margin trading trước khi thử lại.`}
            </p>
          </TrCard>

          {/* Review answers */}
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correctIndex;
              return (
                <TrCard key={q.id} className="p-3">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle size={ICON_SIZE.sm} color="#10B981" className="shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={ICON_SIZE.sm} color="#EF4444" className="shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
                        Câu {i + 1}: {q.question}
                      </p>
                      <p
                        style={{
                          color: isCorrect ? '#10B981' : '#EF4444',
                          fontSize: FONT_SCALE.micro,
                          marginTop: 2,
                        }}
                      >
                        Bạn chọn: {q.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>
                          Đúng: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                  <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                    💡 {q.explanation}
                  </p>
                </TrCard>
              );
            })}
          </div>

          <CTAButton onClick={handleFinish} variant={passed ? 'primary' : 'secondary'}>
            {passed ? 'Tiếp tục giao dịch' : 'Đóng'}
          </CTAButton>
        </div>
      )}
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. PROFESSIONAL CLIENT CATEGORIZATION
   ═══════════════════════════════════════════════════════════════ */

interface ClientCategoryBannerProps {
  category: 'retail' | 'professional' | 'eligible_counterparty';
  onRequestUpgrade?: () => void;
  className?: string;
}

export function ClientCategoryBanner({ category, onRequestUpgrade, className = '' }: ClientCategoryBannerProps) {
  const c = useThemeColors();

  const config = {
    retail: {
      color: '#F59E0B',
      icon: Shield,
      title: 'Retail Client',
      description: 'Bạn được hưởng bảo vệ cao nhất theo quy định MiFID II/FCA',
      limits: ['Leverage tối đa: 30x (crypto)', 'Negative balance protection', 'Best execution guarantee'],
    },
    professional: {
      color: '#3B82F6',
      icon: Shield,
      title: 'Professional Client',
      description: 'Bạn có quyền truy cập leverage cao hơn nhưng mất một số quyền bảo vệ',
      limits: ['Leverage tối đa: 100x', 'Reduced investor protection', 'Must meet MiFID II criteria'],
    },
    eligible_counterparty: {
      color: '#8B5CF6',
      icon: Shield,
      title: 'Eligible Counterparty',
      description: 'Tổ chức tài chính hoặc công ty lớn - không có giới hạn leverage',
      limits: ['No leverage limits', 'No investor protection rules', 'Institutional pricing'],
    },
  };

  const cfg = config[category];
  const Icon = cfg.icon;

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{
        background: withAlpha(cfg.color, ALPHA.hover),
        border: `1.5px solid ${withAlpha(cfg.color, ALPHA.soft)}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha(cfg.color, ALPHA.muted) }}
        >
          <Icon size={ICON_SIZE.md} color={cfg.color} strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: cfg.color, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {cfg.title}
            </p>
            {category === 'retail' && onRequestUpgrade && (
              <button
                onClick={onRequestUpgrade}
                className="px-2.5 py-1 rounded-lg"
                style={{
                  background: withAlpha(cfg.color, ALPHA.muted),
                  color: cfg.color,
                  fontSize: FONT_SCALE.micro,
                  fontWeight: FONT_WEIGHT.bold,
                }}
              >
                Nâng cấp
              </button>
            )}
          </div>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 6 }}>
            {cfg.description}
          </p>
          <div className="flex flex-col gap-1">
            {cfg.limits.map((limit, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span style={{ color: cfg.color, fontSize: FONT_SCALE.micro }}>•</span>
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{limit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. LEVERAGE RESTRICTION ENFORCER
   ═══════════════════════════════════════════════════════════════ */

interface LeverageRestriction {
  region: 'EU' | 'UK' | 'SG' | 'US' | 'OTHER';
  clientCategory: 'retail' | 'professional' | 'eligible_counterparty';
  assetClass: 'crypto' | 'forex' | 'commodities' | 'indices';
}

export function getMaxAllowedLeverage(restriction: LeverageRestriction): number {
  const { region, clientCategory, assetClass } = restriction;

  // Professional and eligible counterparty have higher limits
  if (clientCategory === 'professional') {
    return assetClass === 'crypto' ? 100 : 200;
  }
  if (clientCategory === 'eligible_counterparty') {
    return 500; // Practically unlimited
  }

  // Retail limits vary by region
  if (region === 'EU') {
    // ESMA retail limits
    if (assetClass === 'crypto') return 2; // 2:1 = 2x
    if (assetClass === 'forex') return 30;
    return 20;
  }

  if (region === 'UK') {
    // FCA ban on retail crypto derivatives (effectively 1x, but we allow 2x for compatibility)
    if (assetClass === 'crypto') return 2;
    return 30;
  }

  if (region === 'SG') {
    // MAS limits
    if (assetClass === 'crypto') return 20;
    return 50;
  }

  if (region === 'US') {
    // CFTC/SEC - no retail crypto derivatives
    if (assetClass === 'crypto') return 1; // Spot only
    return 50;
  }

  // Default for other regions
  return assetClass === 'crypto' ? 100 : 200;
}

interface LeverageBlockerProps {
  requestedLeverage: number;
  maxAllowed: number;
  reason: string;
  onClose: () => void;
  open: boolean;
}

export function LeverageBlocker({ requestedLeverage, maxAllowed, reason, onClose, open }: LeverageBlockerProps) {
  const c = useThemeColors();

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      title="Đòn bẩy bị giới hạn"
    >
      <div className="flex flex-col gap-4">
        <TrCard
          className="p-6 text-center"
          style={{
            background: withAlpha('#EF4444', ALPHA.hover),
            border: `1.5px solid ${withAlpha('#EF4444', ALPHA.soft)}`,
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: withAlpha('#EF4444', ALPHA.muted) }}
          >
            <AlertTriangle size={ICON_SIZE.xl} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
          </div>
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 }}>
            Không thể dùng {requestedLeverage}x
          </p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.base, marginBottom: 4 }}>
            Đòn bẩy tối đa cho tài khoản của bạn: <strong>{maxAllowed}x</strong>
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
            {reason}
          </p>
        </TrCard>

        <CTAButton onClick={onClose} variant="secondary">
          Đóng
        </CTAButton>
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. MARGIN CLOSE-OUT WARNING (50% RULE - EU/UK)
   ═══════════════════════════════════════════════════════════════ */

interface MarginCloseoutWarningProps {
  equityPercentage: number; // e.g., 45 = 45% of initial margin remains
  className?: string;
}

export function MarginCloseoutWarning({ equityPercentage, className = '' }: MarginCloseoutWarningProps) {
  const c = useThemeColors();

  // EU/UK rules: Close positions when equity < 50% of initial margin
  const CLOSEOUT_THRESHOLD = 50;

  if (equityPercentage >= CLOSEOUT_THRESHOLD) return null;

  return (
    <TrCard
      className={`p-4 ${className}`}
      style={{
        background: withAlpha('#EF4444', ALPHA.hover),
        border: `1.5px solid ${withAlpha('#EF4444', ALPHA.soft)}`,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha('#EF4444', ALPHA.muted) }}
        >
          <AlertTriangle size={ICON_SIZE.md} color="#EF4444" strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
            50% Margin Close-out Rule
          </p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 6 }}>
            Equity của bạn hiện ở <strong style={{ color: '#EF4444' }}>{equityPercentage.toFixed(1)}%</strong> initial margin.
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
            Theo quy định EU/UK, nếu equity giảm xuống dưới 50%, hệ thống sẽ <strong>tự động đóng toàn bộ vị thế</strong> để bảo vệ bạn khỏi lỗ thêm.
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${equityPercentage}%`,
                  background: '#EF4444',
                  boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ color: c.text3, fontSize: 9 }}>0%</span>
              <span style={{ color: '#EF4444', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>50% = Auto Close</span>
              <span style={{ color: c.text3, fontSize: 9 }}>100%</span>
            </div>
          </div>
        </div>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. BEST EXECUTION DISCLOSURE
   ═══════════════════════════════════════════════════════════════ */

export function BestExecutionDisclosure({ className = '' }: { className?: string }) {
  const c = useThemeColors();

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: withAlpha('#3B82F6', ALPHA.soft) }}
        >
          <FileText size={ICON_SIZE.md} color="#3B82F6" strokeWidth={ICON_STROKE.bold} />
        </div>
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, marginBottom: 4 }}>
            Best Execution Policy
          </p>
          <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5, marginBottom: 6 }}>
            Chúng tôi cam kết thực hiện lệnh của bạn theo <strong style={{ color: c.text1 }}>Best Execution</strong> theo quy định MiFID II:
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              'Giá tốt nhất có sẵn trên nhiều exchanges',
              'Tốc độ khớp lệnh nhanh nhất',
              'Chi phí thấp nhất (phí + slippage)',
              'Khả năng settlement và size phù hợp',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{item}</p>
              </div>
            ))}
          </div>
          <button
            className="mt-3 px-3 py-1.5 rounded-lg"
            style={{
              background: withAlpha('#3B82F6', ALPHA.soft),
              color: '#3B82F6',
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            Xem Best Execution Report
          </button>
        </div>
      </div>
    </TrCard>
  );
}
