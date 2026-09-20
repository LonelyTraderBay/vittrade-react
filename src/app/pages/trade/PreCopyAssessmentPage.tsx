/**
 * ══════════════════════════════════════════════════════════════
 *  PreCopyAssessmentPage — Phase 1: Risk Assessment (MiFID II)
 * ══════════════════════════════════════════════════════════════
 * 
 * MiFID II Art. 25.3 — Appropriateness Assessment:
 * - Required BEFORE first copy
 * - Assess: knowledge, experience, risk tolerance, financial situation
 * - Block unsuitable investments
 * - Educational checkpoint mandatory
 * - Results stored to audit trail
 * - Reassessment every 6-12 months
 * 
 * Compliance:
 * - 5-7 question questionnaire
 * - Score calculation (0-100)
 * - Appropriateness gate (unsuitable/suitable/highly suitable)
 * - Capital allocation recommendation
 * - Educational content requirement
 * - Cooling-off period notice (24-48h first copy)
 * 
 * Guidelines:
 * - PageLayout variant="flush" + StickyFooter pattern
 * - Multi-step wizard (Welcome → Questions → Education → Results)
 * - No dark patterns, friction is a feature
 * - Trust-first, safety-by-design
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  AlertTriangle, CheckCircle, Shield, BookOpen, 
  TrendingUp, Info, ChevronRight, ChevronLeft, Clock,
  FileText, AlertCircle, Target, Zap
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { COPY_TRADERS } from '../../data/mockData';

// Assessment steps
type AssessmentStep = 'welcome' | 'questions' | 'education' | 'results';

// Question types
interface Question {
  id: string;
  question: string;
  description?: string;
  options: {
    value: string;
    label: string;
    score: number; // 0-20 points per question
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'experience',
    question: '1. Kinh nghiệm giao dịch của bạn?',
    description: 'Đánh giá mức độ am hiểu về thị trường crypto',
    options: [
      { value: 'none', label: 'Chưa từng giao dịch crypto', score: 0 },
      { value: 'beginner', label: 'Mới bắt đầu (<6 tháng)', score: 5 },
      { value: 'intermediate', label: 'Trung bình (6 tháng - 2 năm)', score: 12 },
      { value: 'advanced', label: 'Có kinh nghiệm (>2 năm)', score: 20 },
    ],
  },
  {
    id: 'copy_knowledge',
    question: '2. Bạn hiểu về Copy Trading như thế nào?',
    description: 'Copy Trading tự động sao chép lệnh của trader khác',
    options: [
      { value: 'no_idea', label: 'Chưa hiểu rõ cơ chế hoạt động', score: 0 },
      { value: 'basic', label: 'Hiểu cơ bản (sao chép lệnh)', score: 7 },
      { value: 'good', label: 'Hiểu rõ (slippage, phí, rủi ro)', score: 15 },
      { value: 'expert', label: 'Am hiểu sâu (position sizing, portfolio allocation)', score: 20 },
    ],
  },
  {
    id: 'risk_tolerance',
    question: '3. Bạn chấp nhận mức độ rủi ro nào?',
    description: 'Đánh giá khả năng chịu đựng khi tài khoản giảm giá trị',
    options: [
      { value: 'conservative', label: 'Bảo thủ: Không chấp nhận mất >5%', score: 5 },
      { value: 'moderate', label: 'Trung bình: Chấp nhận mất 5-15%', score: 12 },
      { value: 'aggressive', label: 'Mạo hiểm: Chấp nhận mất 15-30%', score: 18 },
      { value: 'very_aggressive', label: 'Rất mạo hiểm: Chấp nhận mất >30%', score: 20 },
    ],
  },
  {
    id: 'capital_allocation',
    question: '4. Bạn dự định copy với bao nhiêu % tổng vốn?',
    description: 'Phân bổ vốn hợp lý giúp quản lý rủi ro tốt hơn',
    options: [
      { value: 'small', label: '<10% tổng vốn', score: 20 },
      { value: 'medium', label: '10-30% tổng vốn', score: 15 },
      { value: 'large', label: '30-50% tổng vốn', score: 8 },
      { value: 'all_in', label: '>50% tổng vốn (không khuyến khích)', score: 0 },
    ],
  },
  {
    id: 'loss_awareness',
    question: '5. Bạn hiểu rủi ro mất vốn như thế nào?',
    description: 'Copy Trading có thể khiến bạn mất toàn bộ số tiền đầu tư',
    options: [
      { value: 'no_loss', label: 'Provider có ROI cao nên chắc chắn lời', score: 0 },
      { value: 'partial', label: 'Có thể mất một phần nhưng không nhiều', score: 5 },
      { value: 'understand', label: 'Hiểu rằng có thể mất toàn bộ vốn', score: 20 },
    ],
  },
  {
    id: 'timeframe',
    question: '6. Bạn dự định copy trong bao lâu?',
    description: 'Copy Trading phù hợp với đầu tư dài hạn',
    options: [
      { value: 'short', label: '<1 tháng (kiếm lời nhanh)', score: 5 },
      { value: 'medium', label: '1-3 tháng', score: 12 },
      { value: 'long', label: '3-6 tháng', score: 18 },
      { value: 'very_long', label: '>6 tháng (dài hạn)', score: 20 },
    ],
  },
  {
    id: 'monitoring',
    question: '7. Bạn sẽ theo dõi vị thế copy như thế nào?',
    description: 'Copy Trading không phải đầu tư thụ động hoàn toàn',
    options: [
      { value: 'never', label: 'Để yên, không theo dõi', score: 0 },
      { value: 'occasional', label: 'Thỉnh thoảng check (1-2 lần/tuần)', score: 10 },
      { value: 'regular', label: 'Theo dõi thường xuyên (hàng ngày)', score: 18 },
      { value: 'active', label: 'Active monitoring + điều chỉnh khi cần', score: 20 },
    ],
  },
];

// Educational docs (must complete before proceeding)
const EDUCATION_DOCS = [
  {
    id: 'how_it_works',
    title: 'Copy Trading hoạt động như thế nào?',
    icon: BookOpen,
    duration: '2 phút',
    content: [
      'Khi bạn copy một provider, mọi lệnh của họ sẽ được tự động sao chép vào tài khoản của bạn.',
      'Bạn có thể chọn tỷ lệ sao chép (ví dụ: 50% = provider mở $1000 thì bạn mở $500).',
      'Slippage: Lệnh của bạn execute sau provider 0.5-3s, giá có thể khác nhau.',
      'Phí: Platform fee + Performance fee (10% lợi nhuận) + Trading fee.',
      'Bạn có thể dừng copy bất cứ lúc nào, nhưng các vị thế đang mở vẫn sẽ theo provider cho đến khi đóng.',
    ],
  },
  {
    id: 'risks',
    title: 'Rủi ro của Copy Trading',
    icon: AlertTriangle,
    duration: '2 phút',
    content: [
      'Hiệu suất quá khứ KHÔNG đảm bảo lợi nhuận tương lai.',
      'Provider có thể thay đổi chiến lược mà không báo trước (đối với private rooms).',
      'Slippage và phí có thể làm giảm đáng kể lợi nhuận của bạn so với provider.',
      'Trong thị trường biến động mạnh, bạn có thể mất 100% vốn đầu tư.',
      'Provider KHÔNG phải investment advisor, họ không chịu trách nhiệm cho kết quả của bạn.',
    ],
  },
  {
    id: 'best_practices',
    title: 'Nguyên tắc đầu tư an toàn',
    icon: Shield,
    duration: '2 phút',
    content: [
      'Chỉ copy với số tiền bạn có thể chấp nhận mất hoàn toàn.',
      'Không copy quá 20% tổng vốn cho 1 provider duy nhất.',
      'Copy nhiều provider khác nhau để phân tán rủi ro (tối đa 70% tổng vốn).',
      'Đặt stop-loss chặt hơn provider nếu bạn có risk tolerance thấp.',
      'Review hiệu suất hàng tuần, dừng copy nếu drawdown vượt ngưỡng chấp nhận.',
      'Đọc kỹ strategy change log và conflict of interest disclosure.',
    ],
  },
];

export function PreCopyAssessmentPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  const [step, setStep] = useState<AssessmentStep>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedDocs, setCompletedDocs] = useState<Set<string>>(new Set());
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const provider = COPY_TRADERS.find(t => t.id === providerId);
  if (!provider) return null;

  // Calculate score
  const calculateScore = () => {
    let totalScore = 0;
    QUESTIONS.forEach(q => {
      const answer = answers[q.id];
      const option = q.options.find(o => o.value === answer);
      if (option) totalScore += option.score;
    });
    return totalScore;
  };

  const score = calculateScore();
  const maxScore = QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.score)), 0);
  const scorePercent = (score / maxScore) * 100;

  // Appropriateness determination
  const getAppropriateness = () => {
    if (scorePercent < 40) return { level: 'unsuitable', color: '#EF4444', label: 'Không phù hợp' };
    if (scorePercent < 70) return { level: 'suitable', color: '#F59E0B', label: 'Phù hợp' };
    return { level: 'highly_suitable', color: '#10B981', label: 'Rất phù hợp' };
  };

  const appropriateness = getAppropriateness();

  // Capital allocation recommendation
  const getRecommendedAllocation = () => {
    if (scorePercent < 40) return { percent: 0, reason: 'Không nên copy cho đến khi hiểu rõ hơn về rủi ro' };
    if (scorePercent < 55) return { percent: 5, reason: 'Bắt đầu với số tiền nhỏ để học hỏi' };
    if (scorePercent < 70) return { percent: 10, reason: 'Phân bổ vừa phải, phù hợp với risk tolerance' };
    if (scorePercent < 85) return { percent: 15, reason: 'Có kinh nghiệm, có thể tăng allocation' };
    return { percent: 20, reason: 'Am hiểu sâu, nhưng vẫn nên đa dạng hóa' };
  };

  const recommendation = getRecommendedAllocation();

  // Check if all questions answered
  const allQuestionsAnswered = QUESTIONS.every(q => answers[q.id]);

  // Check if all docs completed
  const allDocsCompleted = EDUCATION_DOCS.every(doc => completedDocs.has(doc.id));

  // Mark doc as completed when expanded
  const handleDocExpand = (docId: string) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null);
    } else {
      setExpandedDoc(docId);
      // Auto-mark as completed after 3 seconds
      setTimeout(() => {
        setCompletedDocs(prev => new Set(prev).add(docId));
      }, 3000);
    }
  };

  return (
    <PageLayout variant="flush">
      <Header 
        title={
          step === 'welcome' ? 'Đánh giá rủi ro' :
          step === 'questions' ? 'Câu hỏi đánh giá' :
          step === 'education' ? 'Tài liệu bắt buộc' :
          'Kết quả đánh giá'
        } 
        back 
      />

      <PageContent grow padding="default" gap="relaxed">
        {/* Welcome Screen */}
        {step === 'welcome' && (
          <div className="flex flex-col gap-5">
            {/* MiFID II Notice */}
            <div className="rounded-2xl p-4 flex gap-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <Shield size={24} color={c.primary} className="shrink-0" />
              <div>
                <h3 style={{ color: c.primary, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  Đánh giá bắt buộc (MiFID II)
                </h3>
                <p style={{ color: c.text2, fontSize: 12, lineHeight: 1.5 }}>
                  Theo quy định MiFID II Art. 25.3, chúng tôi cần đánh giá sự phù hợp của Copy Trading với 
                  kiến thức, kinh nghiệm và mục tiêu đầu tư của bạn.
                </p>
              </div>
            </div>

            {/* Provider Info */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 8 }}>Bạn đang xem xét copy</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: c.primary + '22', border: `2px solid ${c.primary}` }}>
                  <span style={{ color: c.primary, fontSize: 16, fontWeight: 700 }}>{provider.avatar}</span>
                </div>
                <div className="flex-1">
                  <p style={{ color: c.text1, fontSize: 15, fontWeight: 700 }}>{provider.name}</p>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    ROI: +{provider.totalPnlPct.toFixed(1)}% · Max DD: {provider.maxDrawdown.toFixed(1)}% · 
                    Risk: <span style={{ color: provider.riskLevel === 'low' ? '#10B981' : provider.riskLevel === 'medium' ? '#F59E0B' : '#EF4444' }}>
                      {provider.riskLevel === 'low' ? 'Thấp' : provider.riskLevel === 'medium' ? 'Trung bình' : 'Cao'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Process Overview */}
            <div>
              <h3 style={{ color: c.text1, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Quy trình đánh giá
              </h3>
              <div className="space-y-3">
                {[
                  { step: 1, icon: FileText, title: 'Trả lời câu hỏi', desc: '7 câu hỏi về kinh nghiệm & rủi ro', duration: '3 phút' },
                  { step: 2, icon: BookOpen, title: 'Đọc tài liệu', desc: '3 tài liệu về cơ chế & rủi ro', duration: '6 phút' },
                  { step: 3, icon: Target, title: 'Nhận kết quả', desc: 'Đánh giá độ phù hợp & khuyến nghị', duration: '1 phút' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: c.primary + '15' }}
                      >
                        <span style={{ color: c.primary, fontSize: 13, fontWeight: 700 }}>{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} color={c.text1} />
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{item.title}</p>
                          <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: c.surface2, color: c.text3, fontSize: 9 }}>
                            {item.duration}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: 11 }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Important Notes */}
            <div className="rounded-2xl p-3" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
              <div className="flex gap-2 items-start">
                <AlertTriangle size={14} color={c.warningText} className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.warningText, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                    Lưu ý quan trọng
                  </p>
                  <ul className="space-y-1" style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4 }}>
                    <li>• Trả lời trung thực để nhận đánh giá chính xác</li>
                    <li>• Kết quả sẽ được lưu vào audit trail</li>
                    <li>• Nếu không phù hợp, bạn sẽ không thể copy chiến lược này</li>
                    <li>• Đánh giá lại mỗi 6 tháng hoặc khi thay đổi chiến lược</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Screen */}
        {step === 'questions' && (
          <div className="flex flex-col gap-5">
            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ color: c.text2, fontSize: 11 }}>Tiến độ</span>
                <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                  {Object.keys(answers).length}/{QUESTIONS.length}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: c.border }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    background: c.primary, 
                    width: `${(Object.keys(answers).length / QUESTIONS.length) * 100}%` 
                  }}
                />
              </div>
            </div>

            {QUESTIONS.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <div className="flex items-start gap-2 mb-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ 
                      background: answers[q.id] ? c.primary : c.surface2,
                      color: answers[q.id] ? '#fff' : c.text3
                    }}
                  >
                    {answers[q.id] ? <CheckCircle size={14} /> : <span className="text-xs font-semibold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                      {q.question}
                    </h4>
                    {q.description && (
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{q.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {q.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: option.value }))}
                      className="w-full p-3 rounded-xl text-left transition-all"
                      style={{
                        background: answers[q.id] === option.value ? c.primary + '15' : c.surface2,
                        border: `1.5px solid ${answers[q.id] === option.value ? c.primary : 'transparent'}`,
                        color: answers[q.id] === option.value ? c.primary : c.text2,
                        fontSize: 12,
                        fontWeight: answers[q.id] === option.value ? 600 : 500,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: answers[q.id] === option.value ? c.primary : c.border }}
                        >
                          {answers[q.id] === option.value && (
                            <div className="w-2 h-2 rounded-full" style={{ background: c.primary }} />
                          )}
                        </div>
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education Screen */}
        {step === 'education' && (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl p-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex gap-2 items-start">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.4 }}>
                  Bạn cần đọc và hiểu <strong>tất cả 3 tài liệu</strong> trước khi tiếp tục. 
                  Mỗi tài liệu sẽ được đánh dấu hoàn thành sau 3 giây.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {EDUCATION_DOCS.map((doc, idx) => {
                const Icon = doc.icon;
                const isCompleted = completedDocs.has(doc.id);
                const isExpanded = expandedDoc === doc.id;

                return (
                  <div 
                    key={doc.id}
                    className="rounded-2xl overflow-hidden transition-all"
                    style={{ 
                      background: c.surface, 
                      border: `1px solid ${isCompleted ? '#10B981' : c.border}` 
                    }}
                  >
                    <button
                      onClick={() => handleDocExpand(doc.id)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isCompleted ? '#10B98115' : c.surface2 }}
                      >
                        {isCompleted ? (
                          <CheckCircle size={20} color="#10B981" />
                        ) : (
                          <Icon size={20} color={c.text2} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>{doc.title}</span>
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#10B98115', color: '#10B981', fontSize: 9, fontWeight: 600 }}>
                              Hoàn thành
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={10} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 10 }}>{doc.duration}</span>
                        </div>
                      </div>
                      <ChevronRight 
                        size={16} 
                        color={c.text3} 
                        className="transition-transform"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="pt-3" style={{ borderTop: `1px solid ${c.border}` }}>
                          <ul className="space-y-2">
                            {doc.content.map((point, pidx) => (
                              <li key={pidx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: c.primary }} />
                                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{point}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ color: c.text2, fontSize: 11 }}>Đã đọc</span>
                <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                  {completedDocs.size}/{EDUCATION_DOCS.length}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: c.border }}>
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    background: '#10B981', 
                    width: `${(completedDocs.size / EDUCATION_DOCS.length) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Screen */}
        {step === 'results' && (
          <div className="flex flex-col gap-5">
            {/* Appropriateness Result */}
            <div className="rounded-2xl p-4 text-center" style={{ background: appropriateness.color + '15', border: `2px solid ${appropriateness.color}` }}>
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: appropriateness.color + '22' }}>
                {appropriateness.level === 'unsuitable' ? (
                  <AlertCircle size={32} color={appropriateness.color} />
                ) : appropriateness.level === 'suitable' ? (
                  <Info size={32} color={appropriateness.color} />
                ) : (
                  <CheckCircle size={32} color={appropriateness.color} />
                )}
              </div>
              <h3 style={{ color: appropriateness.color, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                {appropriateness.label}
              </h3>
              <p style={{ color: c.text2, fontSize: 12 }}>
                Điểm đánh giá: <strong style={{ color: appropriateness.color }}>{score}/{maxScore}</strong> ({scorePercent.toFixed(0)}%)
              </p>
            </div>

            {/* Recommendation */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <h4 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                Khuyến nghị phân bổ vốn
              </h4>
              
              {appropriateness.level === 'unsuitable' ? (
                <div className="rounded-xl p-3" style={{ background: c.warningBg, border: `1px solid ${c.warningBorder}` }}>
                  <div className="flex gap-2 items-start">
                    <AlertTriangle size={16} color={c.warningText} className="shrink-0 mt-0.5" />
                    <div>
                      <p style={{ color: c.warningText, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                        Không nên copy chiến lược này
                      </p>
                      <p style={{ color: c.warningText, fontSize: 11, lineHeight: 1.4 }}>
                        Dựa trên đánh giá, Copy Trading với provider này không phù hợp với kiến thức và 
                        kinh nghiệm hiện tại của bạn. Chúng tôi khuyến nghị bạn học thêm về Copy Trading 
                        hoặc chọn provider có risk level thấp hơn.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: c.text2, fontSize: 12 }}>Số tiền copy khuyến nghị</span>
                    <span style={{ color: c.primary, fontSize: 20, fontWeight: 700 }}>
                      {recommendation.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full mb-3" style={{ background: c.surface2 }}>
                    <div 
                      className="h-full rounded-full"
                      style={{ background: c.primary, width: `${recommendation.percent}%` }}
                    />
                  </div>
                  <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.4 }}>
                    {recommendation.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <h4 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                Chi tiết điểm số
              </h4>
              <div className="space-y-2">
                {QUESTIONS.map(q => {
                  const answer = answers[q.id];
                  const option = q.options.find(o => o.value === answer);
                  const maxQ = Math.max(...q.options.map(o => o.score));
                  const scoreQ = option?.score || 0;
                  
                  return (
                    <div key={q.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ color: c.text2, fontSize: 11 }}>{q.question}</span>
                        <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>
                          {scoreQ}/{maxQ}
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full" style={{ background: c.surface2 }}>
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            background: scoreQ === maxQ ? '#10B981' : scoreQ > maxQ * 0.6 ? '#F59E0B' : '#EF4444',
                            width: `${(scoreQ / maxQ) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cooling-off Notice */}
            {appropriateness.level !== 'unsuitable' && (
              <div className="rounded-2xl p-3" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
                <div className="flex gap-2 items-start">
                  <Clock size={14} color={c.primary} className="shrink-0 mt-0.5" />
                  <div>
                    <p style={{ color: c.primary, fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                      Thời gian suy nghĩ (Cooling-off Period)
                    </p>
                    <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.4 }}>
                      Đây là lần đầu bạn copy. Theo quy định, bạn cần chờ <strong>24 giờ</strong> trước khi 
                      có thể bắt đầu copy. Điều này giúp bạn có thời gian suy nghĩ kỹ về quyết định.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {appropriateness.level !== 'unsuitable' && (
              <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
                <h4 style={{ color: c.text1, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                  Bước tiếp theo
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: c.primary }} />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      Đánh giá của bạn đã được lưu vào hệ thống
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: c.primary }} />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      Sau 24h, bạn có thể cấu hình và bắt đầu copy
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: c.primary }} />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      Đánh giá sẽ được yêu cầu lại sau 6 tháng
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </PageContent>

      {/* Sticky Footer */}
      <StickyFooter>
        <div className="flex gap-2">
          {step !== 'welcome' && (
            <button
              onClick={() => {
                if (step === 'questions') setStep('welcome');
                if (step === 'education') setStep('questions');
                if (step === 'results') setStep('education');
              }}
              className="px-4 py-3 rounded-xl flex items-center gap-2"
              style={{
                background: c.surface2,
                color: c.text1,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <ChevronLeft size={16} />
              Quay lại
            </button>
          )}

          <button
            onClick={() => {
              if (step === 'welcome') setStep('questions');
              else if (step === 'questions' && allQuestionsAnswered) setStep('education');
              else if (step === 'education' && allDocsCompleted) setStep('results');
              else if (step === 'results') {
                if (appropriateness.level === 'unsuitable') {
                  navigate(`${prefix}/trade/copy-trading`);
                } else {
                  navigate(`${prefix}/trade/copy-provider/${providerId}/configuration`);
                }
              }
            }}
            disabled={
              (step === 'questions' && !allQuestionsAnswered) ||
              (step === 'education' && !allDocsCompleted)
            }
            className="flex-1 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: c.primary,
              color: '#fff',
              height: 48,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <span>
              {step === 'welcome' && 'Bắt đầu đánh giá'}
              {step === 'questions' && (allQuestionsAnswered ? 'Tiếp tục' : `Trả lời câu hỏi (${Object.keys(answers).length}/${QUESTIONS.length})`)}
              {step === 'education' && (allDocsCompleted ? 'Xem kết quả' : `Đọc tài liệu (${completedDocs.size}/${EDUCATION_DOCS.length})`)}
              {step === 'results' && (appropriateness.level === 'unsuitable' ? 'Quay lại danh sách' : 'Tiếp tục cấu hình')}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </StickyFooter>
    </PageLayout>
  );
}