import React, { useState } from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { Header } from '../../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../../components/layout/PageContent';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TrCard } from '../../../components/ui/TrCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string; score: number }[];
  category: 'experience' | 'knowledge' | 'risk' | 'financial';
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'experience',
    question: 'How long have you been trading cryptocurrencies?',
    options: [
      { id: 'a', text: 'Never traded before / Less than 3 months', score: 0 },
      { id: 'b', text: '3-12 months', score: 1 },
      { id: 'c', text: '1-3 years', score: 2 },
      { id: 'd', text: 'More than 3 years', score: 3 },
    ],
  },
  {
    id: 'q2',
    category: 'experience',
    question: 'Have you ever used trading bots or algorithmic trading before?',
    options: [
      { id: 'a', text: 'No, this is my first time', score: 0 },
      { id: 'b', text: 'Yes, but only in demo/paper trading', score: 1 },
      { id: 'c', text: 'Yes, with real money for less than 6 months', score: 2 },
      { id: 'd', text: 'Yes, extensively with real money for over 6 months', score: 3 },
    ],
  },
  {
    id: 'q3',
    category: 'knowledge',
    question: 'Do you understand how Grid Bots work?',
    options: [
      { id: 'a', text: 'No, I don\'t know what a Grid Bot is', score: 0 },
      { id: 'b', text: 'Slightly - I have a basic idea', score: 1 },
      { id: 'c', text: 'Yes - I understand the concept and risks', score: 2 },
      { id: 'd', text: 'Expert - I can explain it and have used it before', score: 3 },
    ],
  },
  {
    id: 'q4',
    category: 'knowledge',
    question: 'Do you understand what "slippage" means in trading?',
    options: [
      { id: 'a', text: 'No, never heard of it', score: 0 },
      { id: 'b', text: 'Vaguely - I\'ve seen the term but not sure what it means', score: 1 },
      { id: 'c', text: 'Yes - I know it\'s the difference between expected and actual price', score: 2 },
      { id: 'd', text: 'Expert - I know how to mitigate slippage', score: 3 },
    ],
  },
  {
    id: 'q5',
    category: 'risk',
    question: 'What percentage of your total savings/investments are you planning to allocate to trading bots?',
    options: [
      { id: 'a', text: 'More than 50% of my total savings', score: 0 },
      { id: 'b', text: '20-50% of my total savings', score: 1 },
      { id: 'c', text: '5-20% of my total savings', score: 2 },
      { id: 'd', text: 'Less than 5% - only money I can afford to lose', score: 3 },
    ],
  },
  {
    id: 'q6',
    category: 'risk',
    question: 'If your bot lost 30% of its value in one week, what would you do?',
    options: [
      { id: 'a', text: 'Panic and sell immediately', score: 0 },
      { id: 'b', text: 'Feel very uncomfortable but hold', score: 1 },
      { id: 'c', text: 'Accept it as normal volatility and continue', score: 2 },
      { id: 'd', text: 'See it as a buying opportunity and add more', score: 3 },
    ],
  },
  {
    id: 'q7',
    category: 'financial',
    question: 'What is your primary investment goal with trading bots?',
    options: [
      { id: 'a', text: 'Get rich quick / Double my money fast', score: 0 },
      { id: 'b', text: 'Earn steady income to replace my salary', score: 1 },
      { id: 'c', text: 'Long-term wealth accumulation over years', score: 2 },
      { id: 'd', text: 'Experiment and learn, with small capital', score: 3 },
    ],
  },
  {
    id: 'q8',
    category: 'knowledge',
    question: 'Do you understand the difference between DCA, Grid, and Martingale strategies?',
    options: [
      { id: 'a', text: 'No, I don\'t know any of them', score: 0 },
      { id: 'b', text: 'I know DCA but not the others', score: 1 },
      { id: 'c', text: 'I understand all three conceptually', score: 2 },
      { id: 'd', text: 'Expert - I know when to use each strategy', score: 3 },
    ],
  },
];

export function BotSuitabilityAssessmentPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const progress = (Object.keys(answers).length / totalQuestions) * 100;
  
  const calculateScore = () => {
    let total = 0;
    Object.entries(answers).forEach(([qId, optionId]) => {
      const question = QUESTIONS.find(q => q.id === qId);
      const option = question?.options.find(o => o.id === optionId);
      total += option?.score || 0;
    });
    return total;
  };

  const maxScore = QUESTIONS.reduce((sum, q) => sum + 3, 0); // 3 points per question
  const score = calculateScore();
  const scorePercent = (score / maxScore) * 100;

  const getResult = () => {
    if (scorePercent >= 75) {
      return {
        status: 'pass',
        title: 'Suitable for Trading Bots',
        message: 'Based on your responses, you have sufficient knowledge and risk tolerance to use Trading Bots.',
        color: '#10B981',
        icon: CheckCircle2,
      };
    } else if (scorePercent >= 50) {
      return {
        status: 'warning',
        title: 'Proceed with Caution',
        message: 'You have some experience, but we recommend starting with small amounts and simpler strategies like DCA. Avoid high-risk strategies like Martingale.',
        color: '#F59E0B',
        icon: AlertTriangle,
      };
    } else {
      return {
        status: 'fail',
        title: 'Not Recommended',
        message: 'Based on your responses, Trading Bots may not be suitable for you at this time. We recommend gaining more trading experience and knowledge before using automated strategies.',
        color: '#EF4444',
        icon: XCircle,
      };
    }
  };

  const handleAnswer = (optionId: string) => {
    const qId = QUESTIONS[currentQ].id;
    setAnswers({ ...answers, [qId]: optionId });
    
    if (currentQ < totalQuestions - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const handleComplete = () => {
    const result = getResult();
    localStorage.setItem('bot_suitability_result', JSON.stringify({
      score,
      scorePercent,
      status: result.status,
      timestamp: new Date().toISOString(),
    }));
    
    if (result.status === 'pass' || result.status === 'warning') {
      toast.success('Assessment complete - you may proceed');
      navigate('/trade/bots');
    } else {
      toast.error('Assessment complete - please review educational materials');
    }
  };

  if (showResult) {
    const result = getResult();
    const ResultIcon = result.icon;

    return (
      <PageLayout variant="flush">
        <Header title="Assessment Result" back />
        <PageContent grow>
          {/* Result Card */}
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: `${result.color}15`, border: `3px solid ${result.color}` }}>
              <ResultIcon size={48} color={result.color} />
            </div>

            <p style={{ color: result.color, fontSize: 20, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              {result.title}
            </p>

            <p style={{ color: c.text2, fontSize: 14, lineHeight: 1.6, textAlign: 'center', marginBottom: 24, maxWidth: 300 }}>
              {result.message}
            </p>

            {/* Score */}
            <TrCard className="p-4 w-full">
              <div className="flex items-center justify-between mb-3">
                <p style={{ color: c.text2, fontSize: 13 }}>Your Score</p>
                <p style={{ color: result.color, fontSize: 18, fontWeight: 700 }}>
                  {score} / {maxScore}
                </p>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                <div 
                  className="h-full transition-all duration-500"
                  style={{ background: result.color, width: `${scorePercent}%` }}
                />
              </div>
              <p style={{ color: c.text3, fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                {scorePercent.toFixed(0)}% proficiency
              </p>
            </TrCard>

            {/* Breakdown */}
            <PageSection label="Category Breakdown">
              <div className="grid grid-cols-2 gap-3">
                {(['experience', 'knowledge', 'risk', 'financial'] as const).map(cat => {
                  const catQuestions = QUESTIONS.filter(q => q.category === cat);
                  const catScore = catQuestions.reduce((sum, q) => {
                    const ans = answers[q.id];
                    const opt = q.options.find(o => o.id === ans);
                    return sum + (opt?.score || 0);
                  }, 0);
                  const catMax = catQuestions.length * 3;
                  const catPercent = (catScore / catMax) * 100;
                  
                  return (
                    <TrCard key={cat} className="p-3 text-center">
                      <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </p>
                      <p style={{ color: c.text1, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                        {catScore}/{catMax}
                      </p>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div 
                          className="h-full"
                          style={{ 
                            background: catPercent >= 75 ? '#10B981' : catPercent >= 50 ? '#F59E0B' : '#EF4444',
                            width: `${catPercent}%`,
                          }}
                        />
                      </div>
                    </TrCard>
                  );
                })}
              </div>
            </PageSection>

            {/* Recommendations */}
            <PageSection label="Recommendations">
              <TrCard className="p-4">
                {result.status === 'pass' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        You may use all bot strategies (DCA, Grid, Momentum, Martingale)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Still recommended to start with small amounts ($100-500)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 size={16} color="#10B981" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Monitor performance daily and adjust parameters as needed
                      </p>
                    </div>
                  </div>
                )}
                {result.status === 'warning' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        <strong>Start with DCA Bot only</strong> - avoid Grid and Martingale
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Use small amounts ($50-200 maximum per bot)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <AlertTriangle size={16} color="#F59E0B" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Complete the Bot Guide tutorial before creating your first bot
                      </p>
                    </div>
                  </div>
                )}
                {result.status === 'fail' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <XCircle size={16} color="#EF4444" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        <strong>Not recommended to proceed</strong> at this time
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <XCircle size={16} color="#EF4444" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Gain more manual trading experience first (3-6 months)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <XCircle size={16} color="#EF4444" className="shrink-0 mt-1" />
                      <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
                        Review educational materials and retake assessment later
                      </p>
                    </div>
                  </div>
                )}
              </TrCard>
            </PageSection>

            {/* Regulatory Note */}
            <div className="rounded-2xl p-4" style={{ background: c.surface2 }}>
              <p style={{ color: c.text1, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Regulatory Compliance (MiFID II)
              </p>
              <p style={{ color: c.text3, fontSize: 12, lineHeight: 1.6 }}>
                This appropriateness assessment is required under European regulations
                for complex financial products. Your responses have been recorded for
                compliance purposes.
              </p>
            </div>
          </div>
        </PageContent>

        <StickyFooter>
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-[14px] text-sm font-semibold"
            style={{ background: result.color, color: '#FFF' }}>
            {result.status === 'fail' ? 'Review Educational Materials' : 'Continue to Trading Bots'}
          </button>
        </StickyFooter>
      </PageLayout>
    );
  }

  const question = QUESTIONS[currentQ];
  const selectedOption = answers[question.id];

  return (
    <PageLayout variant="flush">
      <Header title="Suitability Assessment" back />
      
      <PageContent grow>
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: c.text2, fontSize: 12 }}>
              Question {currentQ + 1} of {totalQuestions}
            </p>
            <p style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
              {progress.toFixed(0)}% Complete
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
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${c.primary}15` }}>
              <ClipboardCheck size={20} color={c.primary} />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 12, marginBottom: 4 }}>
                {question.category.toUpperCase()}
              </p>
              <p style={{ color: c.text1, fontSize: 16, fontWeight: 600, lineHeight: 1.5 }}>
                {question.question}
              </p>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map(option => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  background: isSelected ? `${c.primary}15` : c.surface,
                  border: `2px solid ${isSelected ? c.primary : c.borderSolid}`,
                }}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
                    style={{ borderColor: isSelected ? c.primary : c.borderSolid }}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.primary }} />
                    )}
                  </div>
                  <p style={{ color: isSelected ? c.primary : c.text1, fontSize: 13, lineHeight: 1.6 }}>
                    {option.text}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.6 }}>
            <strong>Why we ask:</strong> These questions help determine if Trading Bots are suitable for your 
            experience level and risk profile. Answer honestly for accurate results.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}