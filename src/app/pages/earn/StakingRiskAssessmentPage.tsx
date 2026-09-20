import React, { useState } from 'react';
import { Shield, CheckCircle2, TrendingUp, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

interface Question {
  id: string;
  question: string;
  options: { label: string; value: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'experience',
    question: 'Kinh nghiệm đầu tư crypto của bạn?',
    options: [
      { label: 'Người mới (< 6 tháng)', value: 0 },
      { label: 'Trung bình (6 tháng - 2 năm)', value: 1 },
      { label: 'Có kinh nghiệm (2-5 năm)', value: 2 },
      { label: 'Chuyên nghiệp (> 5 năm)', value: 3 },
    ],
  },
  {
    id: 'knowledge',
    question: 'Hiểu biết về staking?',
    options: [
      { label: 'Không biết gì', value: 0 },
      { label: 'Hiểu cơ bản (APY, lock-up)', value: 1 },
      { label: 'Hiểu rõ (validator, slashing, unbonding)', value: 2 },
      { label: 'Chuyên gia (PoS, DeFi, liquid staking)', value: 3 },
    ],
  },
  {
    id: 'risk-tolerance',
    question: 'Khả năng chấp nhận rủi ro?',
    options: [
      { label: 'Thấp - Không muốn mất tiền', value: 0 },
      { label: 'Trung bình - Chấp nhận mất 10-20%', value: 1 },
      { label: 'Cao - Chấp nhận mất 20-50%', value: 2 },
      { label: 'Rất cao - Chấp nhận mất >50%', value: 3 },
    ],
  },
  {
    id: 'reaction',
    question: 'Nếu tài sản giảm 30%, bạn sẽ?',
    options: [
      { label: 'Hoảng sợ và muốn rút ngay', value: 0 },
      { label: 'Lo lắng nhưng giữ', value: 1 },
      { label: 'Bình tĩnh, chờ hồi phục', value: 2 },
      { label: 'Mua thêm (buy the dip)', value: 3 },
    ],
  },
  {
    id: 'horizon',
    question: 'Thời gian đầu tư dự kiến?',
    options: [
      { label: '< 3 tháng (ngắn hạn)', value: 0 },
      { label: '3-12 tháng (trung hạn)', value: 1 },
      { label: '1-3 năm (dài hạn)', value: 2 },
      { label: '> 3 năm (rất dài hạn)', value: 3 },
    ],
  },
  {
    id: 'liquidity',
    question: 'Bạn có cần tiền khẩn cấp không?',
    options: [
      { label: 'Có thể cần bất kỳ lúc nào', value: 0 },
      { label: 'Có thể cần trong 6 tháng', value: 1 },
      { label: 'Không cần trong 1 năm', value: 2 },
      { label: 'Hoàn toàn không cần (tiền dư)', value: 3 },
    ],
  },
  {
    id: 'allocation',
    question: 'Bạn định stake bao nhiêu % tổng tài sản crypto?',
    options: [
      { label: '< 10%', value: 3 },
      { label: '10-30%', value: 2 },
      { label: '30-50%', value: 1 },
      { label: '> 50%', value: 0 },
    ],
  },
];

const getRiskProfile = (score: number) => {
  if (score <= 7) {
    return {
      level: 'conservative',
      label: 'Bảo thủ (Conservative)',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      description: 'Bạn ưu tiên an toàn và bảo toàn vốn. Tránh rủi ro cao.',
      recommendations: [
        'Staking Linh hoạt (Flexible Staking) - APY thấp nhưng rút bất kỳ lúc nào',
        'Staking Cố định 30-60 ngày - APY trung bình, kỳ hạn ngắn',
        'Chọn tài sản ổn định: USDT, USDC, BTC, ETH',
        'Phân tán qua nhiều sản phẩm, mỗi sản phẩm < 20% tổng tài sản',
        'TRÁNH: DeFi Staking, Fixed >90 ngày, tài sản altcoin rủi ro cao',
      ],
      products: [
        { name: 'USDT Linh hoạt', apy: '4.5%', risk: 'Thấp' },
        { name: 'BTC Cố định 30D', apy: '5.8%', risk: 'Thấp' },
        { name: 'ETH Linh hoạt', apy: '4.2%', risk: 'Thấp' },
      ],
    };
  } else if (score <= 14) {
    return {
      level: 'moderate',
      label: 'Cân bằng (Moderate)',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      description: 'Bạn chấp nhận một mức rủi ro hợp lý để đổi lấy lợi nhuận cao hơn.',
      recommendations: [
        'Mix Flexible và Fixed Staking (50-50)',
        'Staking Cố định 60-90 ngày - APY cao hơn',
        'Chọn tài sản: Mix stablecoin (40%) + BTC/ETH (40%) + altcoin top 20 (20%)',
        'Có thể thử DeFi Staking với số lượng nhỏ (<10% tổng tài sản)',
        'Theo dõi thị trường và điều chỉnh allocation định kỳ',
      ],
      products: [
        { name: 'USDT Cố định 60D', apy: '6.5%', risk: 'Thấp' },
        { name: 'ETH Cố định 90D', apy: '7.2%', risk: 'Trung bình' },
        { name: 'SOL Cố định 60D', apy: '9.8%', risk: 'Trung bình' },
        { name: 'ETH-USDT LP Pool', apy: '18.7%', risk: 'Cao (nhỏ)' },
      ],
    };
  } else {
    return {
      level: 'aggressive',
      label: 'Năng động (Aggressive)',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      description: 'Bạn sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận.',
      recommendations: [
        'Ưu tiên Fixed Staking 90-365 ngày - APY cao nhất',
        'DeFi Staking với APY 15-50%',
        'Liquid Staking để tăng thanh khoản',
        'Chọn altcoin tiềm năng (SOL, AVAX, MATIC, ADA)',
        'Sử dụng Validator Selection để chọn validator APY cao',
        'Tham gia Dual Rewards (stake + earn platform token)',
      ],
      products: [
        { name: 'SOL Cố định 180D', apy: '12.3%', risk: 'Trung bình' },
        { name: 'AVAX Cố định 90D', apy: '14.5%', risk: 'Cao' },
        { name: 'ETH-USDT LP Pool', apy: '24.5%', risk: 'Rất cao' },
        { name: 'BNB Liquid Staking', apy: '9.2%', risk: 'Trung bình' },
      ],
    };
  }
};

export function StakingRiskAssessmentPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: number) => {
    const question = QUESTIONS[currentQuestion];
    setAnswers({ ...answers, [question.id]: value });
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const reset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
  };

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const profile = getRiskProfile(totalScore);
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  if (showResult) {
    return (
      <PageLayout>
        <Header title="Kết quả Đánh giá" back />
        <PageContent>
          {/* Result Card */}
          <TrCard className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: profile.bg, border: `2px solid ${profile.color}` }}>
                <Shield size={32} color={profile.color} />
              </div>
              <div className="flex-1">
                <p style={{ color: c.text3, fontSize: 12, marginBottom: 2 }}>Hồ sơ rủi ro của bạn:</p>
                <p style={{ color: c.text1, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                  {profile.label}
                </p>
                <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
                  {profile.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: c.text3, fontSize: 12 }}>Điểm của bạn:</span>
                <span style={{ color: profile.color, fontSize: 14, fontWeight: 700 }}>
                  {totalScore}/{QUESTIONS.length * 3} điểm
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: c.borderSolid }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: profile.color,
                    width: `${(totalScore / (QUESTIONS.length * 3)) * 100}%`,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </TrCard>

          {/* Recommendations */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} color={profile.color} />
              <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>Gợi ý cho bạn</p>
            </div>
            <div className="space-y-2">
              {profile.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={16} color={profile.color} className="shrink-0 mt-0.5" />
                  <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>{rec}</p>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Recommended Products */}
          <TrCard className="p-4">
            <p style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              Sản phẩm phù hợp
            </p>
            <div className="space-y-3">
              {profile.products.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: c.surface2 }}>
                  <div className="flex-1">
                    <p style={{ color: c.text1, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                      {product.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>Rủi ro: {product.risk}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#10B981', fontSize: 16, fontWeight: 700 }}>{product.apy}</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>APY</p>
                  </div>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Warning */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="flex gap-2">
              <AlertCircle size={16} color="#F59E0B" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                <strong>Lưu ý:</strong> Đây chỉ là gợi ý dựa trên câu trả lời của bạn. Không phải lời khuyên đầu tư. Bạn nên tự nghiên cứu và đánh giá kỹ trước khi quyết định stake.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`${prefix}/earn/staking`)}
              className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: c.primary, color: '#FFF' }}>
              Khám phá sản phẩm
              <ArrowRight size={18} />
            </button>
            <button
              onClick={reset}
              className="px-4 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: c.surface2, color: c.text1 }}>
              <RotateCcw size={18} />
              Làm lại
            </button>
          </div>

          {/* Footer */}
          <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.6, textAlign: 'center' }}>
              Hồ sơ rủi ro được lưu trong tài khoản của bạn. Bạn có thể làm lại bài đánh giá bất kỳ lúc nào để cập nhật gợi ý sản phẩm phù hợp.
            </p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <PageLayout>
      <Header title="Đánh giá Rủi ro" back />
      <PageContent>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span style={{ color: c.text3, fontSize: 12 }}>
              Câu hỏi {currentQuestion + 1}/{QUESTIONS.length}
            </span>
            <span style={{ color: c.text3, fontSize: 12 }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: c.borderSolid }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <TrCard className="p-5 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
              <span style={{ color: '#3B82F6', fontSize: 16, fontWeight: 700 }}>
                {currentQuestion + 1}
              </span>
            </div>
            <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>
              {question.question}
            </p>
          </div>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = answers[question.id] === option.value;
              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 rounded-xl text-left flex items-center justify-between transition-all"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.12)' : c.surface2,
                    border: `1.5px solid ${isSelected ? '#3B82F6' : c.borderSolid}`,
                  }}>
                  <span style={{
                    color: isSelected ? '#3B82F6' : c.text1,
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                  }}>
                    {option.label}
                  </span>
                  {isSelected && <CheckCircle2 size={20} color="#3B82F6" />}
                </button>
              );
            })}
          </div>
        </TrCard>

        {/* Info Banner */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-2">
            <AlertCircle size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Trả lời trung thực để nhận được gợi ý sản phẩm phù hợp với tình hình tài chính và mục tiêu đầu tư của bạn.
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        {currentQuestion > 0 && (
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            className="w-full py-3 rounded-xl font-semibold"
            style={{ background: c.surface2, color: c.text2 }}>
            ← Quay lại câu trước
          </button>
        )}
      </PageContent>
    </PageLayout>
  );
}
