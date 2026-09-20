import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, AlertTriangle, TrendingUp, Shield, Target } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

type QuestionType = 'single' | 'slider' | 'quiz';

interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  weights?: number[];
  min?: number;
  max?: number;
  weight?: number;
  quizQuestions?: { q: string; options: string[]; correct: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'experience',
    question: 'How long have you invested in cryptocurrency?',
    type: 'single',
    options: ['No experience', 'Less than 1 year', '1-3 years', '3-5 years', '5+ years'],
    weights: [0, 10, 20, 30, 40],
  },
  {
    id: 'net-worth',
    question: 'What is your total net worth (excluding primary residence)?',
    type: 'single',
    options: ['Less than $10,000', '$10,000-$50,000', '$50,000-$100,000', '$100,000-$500,000', 'Over $500,000'],
    weights: [0, 10, 20, 30, 40],
  },
  {
    id: 'income',
    question: 'What is your annual income?',
    type: 'single',
    options: ['Less than $30,000', '$30,000-$60,000', '$60,000-$100,000', '$100,000-$200,000', 'Over $200,000'],
    weights: [0, 10, 15, 20, 25],
  },
  {
    id: 'objectives',
    question: 'What is your primary investment objective?',
    type: 'single',
    options: ['Capital Preservation', 'Stable Income', 'Growth', 'Aggressive Growth'],
    weights: [5, 15, 25, 35],
  },
  {
    id: 'horizon',
    question: 'What is your investment time horizon for staked assets?',
    type: 'single',
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5+ years'],
    weights: [0, 10, 20, 30],
  },
  {
    id: 'risk',
    question: 'How would you rate your risk tolerance? (1 = Very Conservative, 10 = Very Aggressive)',
    type: 'slider',
    min: 1,
    max: 10,
    weight: 3,
  },
  {
    id: 'knowledge',
    question: 'Test your staking knowledge (5 questions)',
    type: 'quiz',
    quizQuestions: [
      {
        q: 'What is slashing in Proof of Stake?',
        options: ['A reward mechanism', 'A penalty for validator misbehavior', 'A way to unstake faster', 'A fee structure'],
        correct: 1,
      },
      {
        q: 'What does APY stand for?',
        options: ['Annual Payment Yield', 'Annual Percentage Yield', 'Average Profit Yearly', 'Asset Price Yield'],
        correct: 1,
      },
      {
        q: 'What is a lock-up period?',
        options: ['Time to earn rewards', 'Time funds are locked and cannot be withdrawn', 'Time to verify transactions', 'Validator uptime'],
        correct: 1,
      },
      {
        q: 'What is liquid staking?',
        options: ['Staking only stablecoins', 'Staking with instant withdrawal', 'Staking while maintaining liquidity via derivative tokens', 'Staking in liquidity pools'],
        correct: 2,
      },
      {
        q: 'What is the main risk of staking?',
        options: ['High fees', 'Slashing and smart contract risk', 'Slow transactions', 'No rewards'],
        correct: 1,
      },
    ],
    weight: 5,
  },
];

type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

const PROFILES = {
  conservative: {
    score: [0, 40],
    label: 'Conservative',
    desc: 'You prefer low-risk, stable returns. Suitable products: Flexible staking, stablecoins, short lock-up periods.',
    color: '#10B981',
    products: ['USDT Flexible', 'USDC Flexible', 'BTC Fixed 30D'],
  },
  moderate: {
    score: [40, 70],
    label: 'Moderate',
    desc: 'You accept moderate risk for higher returns. Suitable products: ETH staking, 60-90 day fixed terms, auto-compound.',
    color: '#3B82F6',
    products: ['ETH Fixed 60D', 'SOL Fixed 30D', 'Auto-compound ETH', 'BTC Fixed 90D'],
  },
  aggressive: {
    score: [70, 100],
    label: 'Aggressive',
    desc: 'You seek maximum returns and accept high risk. Suitable products: DeFi staking, liquid staking, governance, long lock-ups.',
    color: '#F59E0B',
    products: ['Liquid Staking ETH', 'DeFi Yield Farming', 'Governance Staking', 'Fixed 180D'],
  },
};

export function StakingSuitabilityAssessmentPage() {
  const c = useThemeColors();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [profile, setProfile] = useState<RiskProfile>('moderate');

  const currentQuestion = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleAnswer = (value: any) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      calculateScore();
      setShowResult(true);
    }
  };

  const handlePrevious = () => {
    if (step > 0) setStep(step - 1);
  };

  const calculateScore = () => {
    let total = 0;
    QUESTIONS.forEach(q => {
      const answer = answers[q.id];
      if (!answer) return;

      if (q.type === 'single' && q.weights) {
        total += q.weights[answer];
      } else if (q.type === 'slider' && q.weight) {
        total += answer * q.weight;
      } else if (q.type === 'quiz' && q.weight) {
        const correctCount = answer.filter((a: number, idx: number) => a === q.quizQuestions![idx].correct).length;
        total += correctCount * q.weight;
      }
    });

    setScore(total);

    // Determine profile
    if (total < 40) setProfile('conservative');
    else if (total < 70) setProfile('moderate');
    else setProfile('aggressive');
  };

  const isAnswered = answers[currentQuestion?.id] !== undefined;

  // Radar chart data
  const radarData = [
    { subject: 'Experience', value: (answers['experience'] || 0) * 10, fullMark: 40 },
    { subject: 'Net Worth', value: (answers['net-worth'] || 0) * 10, fullMark: 40 },
    { subject: 'Income', value: (answers['income'] || 0) * 5, fullMark: 25 },
    { subject: 'Objectives', value: answers['objectives'] !== undefined ? QUESTIONS[3].weights![answers['objectives']] : 0, fullMark: 35 },
    { subject: 'Horizon', value: (answers['horizon'] || 0) * 10, fullMark: 30 },
    { subject: 'Risk Tolerance', value: (answers['risk'] || 1) * 3, fullMark: 30 },
  ];

  if (showResult) {
    const profileData = PROFILES[profile];
    return (
      <PageLayout>
        <Header title="Assessment Result" back />

        <PageContent>
          {/* Score Card */}
          <TrCard className="p-6">
            <div className="text-center mb-6">
              <div
                className="w-32 h-32 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ background: `${profileData.color}22`, border: `4px solid ${profileData.color}` }}>
                <div>
                  <p style={{ color: profileData.color, fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
                    {score}
                  </p>
                  <p style={{ color: c.text3, fontSize: 11 }}>/ 100</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                style={{ background: `${profileData.color}22` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: profileData.color }} />
                <p style={{ color: profileData.color, fontSize: 16, fontWeight: 700 }}>
                  {profileData.label} Investor
                </p>
              </div>

              <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                {profileData.desc}
              </p>
            </div>

            {/* Radar Chart */}
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid key="polar-grid" stroke={c.borderSolid} />
                <PolarAngleAxis key="polar-angle" dataKey="subject" tick={{ fill: c.text3, fontSize: 10 }} />
                <Radar key="radar" name="Your Profile" dataKey="value" stroke={profileData.color} fill={profileData.color} fillOpacity={0.3} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: c.surface,
                    border: `1px solid ${c.borderSolid}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </TrCard>

          {/* Suitable Products */}
          <PageSection label="Recommended Products">
            <div className="flex flex-col gap-3">
              {profileData.products.map((product, idx) => (
                <TrCard key={idx} hover className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${profileData.color}22` }}>
                        <CheckCircle2 size={20} color={profileData.color} />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{product}</p>
                        <p style={{ color: c.text3, fontSize: 11 }}>Match: {80 + idx * 5}%</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color={c.text3} />
                  </div>
                </TrCard>
              ))}
            </div>
          </PageSection>

          {/* Warning for Conservative */}
          {profile === 'conservative' && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-3">
                <AlertTriangle size={18} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    High-Risk Products Restricted
                  </p>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                    Based on your assessment, DeFi staking, liquid staking, and long lock-up products are restricted. You can re-assess annually or when your financial situation changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              className="w-full py-3 rounded-[14px] text-center text-sm font-semibold"
              style={{ background: c.primary, color: '#FFF' }}>
              Explore Recommended Products
            </button>
            <button
              onClick={() => {
                setShowResult(false);
                setStep(0);
                setAnswers({});
              }}
              className="w-full py-3 rounded-[14px] text-center text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Retake Assessment
            </button>
          </div>

          {/* Validity Notice */}
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 11, textAlign: 'center' }}>
              This assessment is valid until <strong>March 7, 2027</strong>. You must re-assess annually or if your financial situation changes significantly.
            </p>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="flush">
      <Header title="Suitability Assessment" back />

      <PageContent grow padding="relaxed">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: c.text3, fontSize: 12 }}>
              Question {step + 1} of {totalSteps}
            </p>
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
              {Math.round(progress)}%
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
            <div
              className="h-full transition-all duration-300"
              style={{ background: c.primary, width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <TrCard className="p-5">
          <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 20 }}>
            {currentQuestion.question}
          </p>

          {currentQuestion.type === 'single' && currentQuestion.options && (
            <div className="flex flex-col gap-2">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? `${c.primary}22` : c.surface2,
                      border: `2px solid ${isSelected ? c.primary : 'transparent'}`,
                    }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: isSelected ? c.primary : c.borderSolid }}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full" style={{ background: c.primary }} />
                        )}
                      </div>
                      <p style={{ color: c.text1, fontSize: 14 }}>{option}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'slider' && (
            <div>
              <div className="flex justify-between mb-4">
                <p style={{ color: c.text3, fontSize: 11 }}>Conservative</p>
                <p style={{ color: c.text3, fontSize: 11 }}>Aggressive</p>
              </div>
              <input
                type="range"
                min={currentQuestion.min}
                max={currentQuestion.max}
                value={answers[currentQuestion.id] || currentQuestion.min}
                onChange={e => handleAnswer(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${c.primary} 0%, ${c.primary} ${((answers[currentQuestion.id] || currentQuestion.min!) - currentQuestion.min!) / (currentQuestion.max! - currentQuestion.min!) * 100}%, ${c.surface2} ${((answers[currentQuestion.id] || currentQuestion.min!) - currentQuestion.min!) / (currentQuestion.max! - currentQuestion.min!) * 100}%, ${c.surface2} 100%)`,
                }}
              />
              <div className="text-center mt-4">
                <p style={{ color: c.primary, fontSize: 32, fontWeight: 700 }}>
                  {answers[currentQuestion.id] || currentQuestion.min}
                </p>
              </div>
            </div>
          )}

          {currentQuestion.type === 'quiz' && currentQuestion.quizQuestions && (
            <div className="flex flex-col gap-4">
              {currentQuestion.quizQuestions.map((quiz, qIdx) => {
                const userAnswer = answers[currentQuestion.id]?.[qIdx];
                return (
                  <div key={qIdx} className="rounded-xl p-3" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                      {qIdx + 1}. {quiz.q}
                    </p>
                    <div className="flex flex-col gap-2">
                      {quiz.options.map((opt, oIdx) => {
                        const isSelected = userAnswer === oIdx;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              const newAnswers = [...(answers[currentQuestion.id] || [])];
                              newAnswers[qIdx] = oIdx;
                              handleAnswer(newAnswers);
                            }}
                            className="p-2 rounded-lg text-left text-xs"
                            style={{
                              background: isSelected ? `${c.primary}22` : c.bg,
                              border: `1px solid ${isSelected ? c.primary : c.borderSolid}`,
                              color: c.text2,
                            }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TrCard>

        {/* Info box */}
        {step === 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div className="flex gap-3">
              <Shield size={18} color="#3B82F6" className="shrink-0 mt-0.5" />
              <div>
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                  Why This Assessment?
                </p>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>
                  Regulatory compliance requires us to assess your suitability for high-risk staking products. This helps protect you from unsuitable investments. Your answers are confidential.
                </p>
              </div>
            </div>
          </div>
        )}
      </PageContent>

      <StickyFooter>
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 rounded-[14px] text-center text-sm font-semibold"
              style={{ background: c.surface2, color: c.text1 }}>
              Previous
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex-1 py-3 rounded-[14px] text-center text-sm font-semibold"
            style={{
              background: isAnswered ? c.primary : c.surface2,
              color: isAnswered ? '#FFF' : c.text3,
              opacity: isAnswered ? 1 : 0.5,
            }}>
            {step === totalSteps - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      </StickyFooter>
    </PageLayout>
  );
}