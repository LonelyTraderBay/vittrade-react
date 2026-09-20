/**
 * ══════════════════════════════════════════════════════════
 *  WebPreCopyAssessmentPage — Enterprise Desktop
 * ══════════════════════════════════════════════════════════
 *
 *  MiFID II risk assessment before copy trading.
 *  Simplified wizard with appropriateness questions.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { CheckCircle, Shield, ChevronRight, AlertTriangle } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';

export function WebPreCopyAssessmentPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = [
    {
      id: 'experience',
      question: 'Kinh nghiệm giao dịch của bạn?',
      options: [
        { value: 'none', label: 'Chưa từng giao dịch crypto' },
        { value: 'beginner', label: 'Mới bắt đầu (<6 tháng)' },
        { value: 'intermediate', label: 'Trung bình (6 tháng - 2 năm)' },
        { value: 'advanced', label: 'Có kinh nghiệm (>2 năm)' },
      ],
    },
    {
      id: 'risk_tolerance',
      question: 'Bạn chấp nhận mức độ rủi ro nào?',
      options: [
        { value: 'conservative', label: 'Bảo thủ: Không chấp nhận mất >5%' },
        { value: 'moderate', label: 'Trung bình: Chấp nhận mất 5-15%' },
        { value: 'aggressive', label: 'Mạo hiểm: Chấp nhận mất 15-30%' },
      ],
    },
  ];

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <PageLayout variant="flush">
      <Header title="Đánh giá rủi ro" back />

      <div style={{ padding: '24px 0 0', flex: 1 }}>
        <div
          className="rounded-2xl p-8 mb-8"
          style={{
            background: `linear-gradient(135deg, ${c.primary}15 0%, ${c.primary}08 100%)`,
            border: `1px solid ${c.primary}25`,
          }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: c.primary }}
            >
              <Shield size={WEB_ICON.xl} color="#fff" />
            </div>
            <div>
              <h3
                style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1, marginBottom: 8 }}
              >
                Đánh giá rủi ro trước khi copy
              </h3>
              <p style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>
                Trả lời một vài câu hỏi để đảm bảo Copy Trading phù hợp với bạn
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl p-8"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              <h4
                style={{
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  color: c.text1,
                  marginBottom: 24,
                }}
              >
                {idx + 1}. {q.question}
              </h4>
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt.value })}
                    className="w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      background: answers[q.id] === opt.value ? c.primary + '15' : c.surface2,
                      border: `2px solid ${answers[q.id] === opt.value ? c.primary : 'transparent'}`,
                      color: answers[q.id] === opt.value ? c.primary : c.text2,
                      fontSize: WEB_FONT.md,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {answers[q.id] === opt.value && (
                        <CheckCircle size={WEB_ICON.lg} color={c.primary} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {allAnswered && (
          <div
            className="rounded-2xl p-6 flex gap-4"
            style={{ background: c.buyAlpha10, border: `1px solid ${c.buyAlpha20}` }}
          >
            <CheckCircle size={WEB_ICON.lg} color={c.success} className="shrink-0" />
            <div>
              <p
                style={{
                  color: c.success,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Đánh giá hoàn tất
              </p>
              <p style={{ color: c.success, fontSize: WEB_FONT.sm, opacity: 0.9 }}>
                Bạn đủ điều kiện để tiếp tục. Vui lòng cấu hình chiến lược copy.
              </p>
            </div>
          </div>
        )}
      </div>

      <StickyFooter>
        <button
          disabled={!allAnswered}
          onClick={() => navigate(`/w/trade/copy/provider/${providerId}/configuration`)}
          className="w-full rounded-2xl flex items-center justify-center gap-3 transition-all"
          style={{
            background: allAnswered ? c.primary : c.surface2,
            color: allAnswered ? '#fff' : c.text3,
            height: 48,
            fontWeight: 600,
            fontSize: WEB_FONT.lg,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
            opacity: allAnswered ? 1 : 0.5,
          }}
        >
          <span>Tiếp tục</span>
          <ChevronRight size={WEB_ICON.lg} />
        </button>
      </StickyFooter>
    </PageLayout>
  );
}
