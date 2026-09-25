/**
 * ══════════════════════════════════════════════════════════════
 *  PreCopyAssessmentPage.test.tsx — Risk Assessment Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese-localized wizard
 * (Welcome → Questions → Education → Results).
 *
 * Test Coverage (15 tests):
 * CRITICAL: MiFID II Art. 25.3 Compliance
 *
 * 1.  ✅ Welcome step shows MiFID II notice + provider summary
 * 2.  ✅ Header title reflects the current wizard step
 * 3.  ✅ Questions step renders all 7 questions with 0/7 progress
 * 4.  ✅ Answering a question updates the progress counter
 * 5.  ✅ Cannot advance until all 7 questions are answered
 * 6.  ✅ Education gate blocks until all 3 docs are completed
 * 7.  ✅ Expanding a doc reveals content; auto-completes after 3s
 * 8.  ✅ Optimal answers → "Rất phù hợp" with 140/140 and 20% allocation
 * 9.  ✅ Poor answers → "Không phù hợp" blocks copy + returns to list
 * 10. ✅ Medium answers → "Phù hợp" with 5% allocation + navigate to config
 * 11. ✅ Cooling-off period notice (24h) for suitable assessments
 * 12. ✅ Score breakdown shows per-question points
 * 13. ✅ Wizard back navigation + header back uses router history
 * 14. ✅ Education docs contain the mandated risk disclosures
 * 15. ✅ Unknown providerId renders nothing
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - localStorage persistence of results (page stores nothing)
 * - Slider / checkbox question widgets (questions are option buttons now)
 * - "Question 1 of 7" progress label (progress is "x/7" counter now)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { PreCopyAssessmentPage } from '@/dev/legacy/trading/PreCopyAssessmentPage';

const ASSESSMENT_PATH = '/trade/copy-provider/:providerId/assessment';

/** The page reads the provider from useParams(), so it must be routed. */
function renderAssessment(providerId = 'ct001') {
  return renderWithRouter(
    <Routes>
      <Route path={ASSESSMENT_PATH} element={<PreCopyAssessmentPage />} />
    </Routes>,
    { initialRoute: `/trade/copy-provider/${providerId}/assessment` },
  );
}

/** Highest-scoring option for each of the 7 questions (140/140). */
const BEST_ANSWERS = [
  'Có kinh nghiệm (>2 năm)',
  'Am hiểu sâu (position sizing, portfolio allocation)',
  'Rất mạo hiểm: Chấp nhận mất >30%',
  '<10% tổng vốn',
  'Hiểu rằng có thể mất toàn bộ vốn',
  '>6 tháng (dài hạn)',
  'Active monitoring + điều chỉnh khi cần',
];

/** Lowest-scoring options (10/140 → "Không phù hợp"). */
const WORST_ANSWERS = [
  'Chưa từng giao dịch crypto',
  'Chưa hiểu rõ cơ chế hoạt động',
  'Bảo thủ: Không chấp nhận mất >5%',
  '>50% tổng vốn (không khuyến khích)',
  'Provider có ROI cao nên chắc chắn lời',
  '<1 tháng (kiếm lời nhanh)',
  'Để yên, không theo dõi',
];

/** Medium options (73/140 = 52% → "Phù hợp", 10% allocation). */
const MEDIUM_ANSWERS = [
  'Trung bình (6 tháng - 2 năm)',
  'Hiểu cơ bản (sao chép lệnh)',
  'Trung bình: Chấp nhận mất 5-15%',
  '10-30% tổng vốn',
  'Có thể mất một phần nhưng không nhiều',
  '1-3 tháng',
  'Thỉnh thoảng check (1-2 lần/tuần)',
];

async function answerQuestions(user: ReturnType<typeof userEvent.setup>, answers: string[]) {
  for (const label of answers) {
    await user.click(screen.getByRole('button', { name: label }));
  }
}

/** Advance from welcome to the results screen with the given answers. */
async function completeToResults(user: ReturnType<typeof userEvent.setup>, answers: string[]) {
  renderAssessment('ct001');

  // Welcome → Questions
  await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
  await waitFor(() => {
    expect(screen.getByText('1. Kinh nghiệm giao dịch của bạn?')).toBeInTheDocument();
  });

  await answerQuestions(user, answers);

  // Questions → Education
  const continueBtn = screen.getByRole('button', { name: 'Tiếp tục' });
  await user.click(continueBtn);
  await waitFor(() => {
    expect(screen.getByText(/tất cả 3 tài liệu/i)).toBeInTheDocument();
  });

  // Expand all 3 docs — each auto-completes 3 seconds after expansion
  const docTitles = [
    /Copy Trading hoạt động như thế nào/,
    /Rủi ro của Copy Trading/,
    /Nguyên tắc đầu tư an toàn/,
  ];
  for (const title of docTitles) {
    await user.click(screen.getByRole('button', { name: title }));
  }

  // Education → Results (button enables once all docs are completed)
  const resultsBtn = await screen.findByRole('button', { name: /Xem kết quả/ }, { timeout: 6000 });
  await waitFor(() => {
    expect(resultsBtn).toBeEnabled();
  });
  await user.click(resultsBtn);

  await waitFor(() => {
    expect(screen.getByText('Kết quả đánh giá')).toBeInTheDocument();
  });
}

describe('PreCopyAssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show MiFID II notice and provider summary on welcome step', () => {
    renderAssessment('ct001');

    // MiFID II compliance notice
    expect(screen.getByText('Đánh giá bắt buộc (MiFID II)')).toBeInTheDocument();
    expect(screen.getByText(/MiFID II Art\. 25\.3/i)).toBeInTheDocument();

    // Provider under consideration (ct001 = AlphaHunter_VN from mock data)
    expect(screen.getByText('Bạn đang xem xét copy')).toBeInTheDocument();
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
    expect(screen.getByText(/ROI: \+342\.5%/)).toBeInTheDocument();
    expect(screen.getByText(/Max DD: -12\.4%/)).toBeInTheDocument();
    expect(screen.getByText('Trung bình', { exact: true })).toBeInTheDocument(); // risk level

    // Process overview: 3 steps
    expect(screen.getByText('Quy trình đánh giá')).toBeInTheDocument();
    expect(screen.getByText('Trả lời câu hỏi')).toBeInTheDocument();
    expect(screen.getByText('Đọc tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Nhận kết quả')).toBeInTheDocument();

    // Important notes
    expect(screen.getByText('Lưu ý quan trọng')).toBeInTheDocument();
    expect(screen.getByText(/Kết quả sẽ được lưu vào audit trail/i)).toBeInTheDocument();
  });

  it('should change header title per wizard step', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    expect(screen.getByText('Đánh giá rủi ro')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
    await waitFor(() => {
      expect(screen.getByText('Câu hỏi đánh giá')).toBeInTheDocument();
    });
    expect(screen.queryByText('Đánh giá rủi ro')).not.toBeInTheDocument();
  });

  it('should render all 7 questions with initial 0/7 progress', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));

    const questions = [
      '1. Kinh nghiệm giao dịch của bạn?',
      '2. Bạn hiểu về Copy Trading như thế nào?',
      '3. Bạn chấp nhận mức độ rủi ro nào?',
      '4. Bạn dự định copy với bao nhiêu % tổng vốn?',
      '5. Bạn hiểu rủi ro mất vốn như thế nào?',
      '6. Bạn dự định copy trong bao lâu?',
      '7. Bạn sẽ theo dõi vị thế copy như thế nào?',
    ];
    questions.forEach((q) => {
      expect(screen.getByText(q)).toBeInTheDocument();
    });

    // Progress counter starts at 0/7
    expect(screen.getByText('Tiến độ')).toBeInTheDocument();
    expect(screen.getByText('0/7')).toBeInTheDocument();

    // Primary action shows unanswered state
    expect(screen.getByRole('button', { name: /Trả lời câu hỏi \(0\/7\)/ })).toBeDisabled();
  });

  it('should update progress when a question is answered', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));

    await user.click(screen.getByRole('button', { name: 'Trung bình (6 tháng - 2 năm)' }));

    expect(screen.getByText('1/7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trả lời câu hỏi \(1\/7\)/ })).toBeDisabled();

    // Answered question card shows a checkmark state via re-render (selected option)
    expect(screen.getByRole('button', { name: 'Trung bình (6 tháng - 2 năm)' })).toBeEnabled();
  });

  it('should not allow advancing until all questions are answered', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));

    // Answer only 6 of 7 — button must stay disabled
    await answerQuestions(user, BEST_ANSWERS.slice(0, 6));
    const partiallyAnswered = screen.getByRole('button', { name: /Trả lời câu hỏi \(6\/7\)/ });
    expect(partiallyAnswered).toBeDisabled();

    // Answer the last one — button enables with "Tiếp tục" label
    await user.click(screen.getByRole('button', { name: BEST_ANSWERS[6] }));
    const continueBtn = screen.getByRole('button', { name: 'Tiếp tục' });
    expect(continueBtn).toBeEnabled();
  });

  it('should block education step until all 3 docs are completed', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
    await answerQuestions(user, BEST_ANSWERS);
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Education screen visible with the 3 mandatory docs
    expect(screen.getByText('Tài liệu bắt buộc')).toBeInTheDocument();
    expect(screen.getByText(/Bạn cần đọc và hiểu/i)).toBeInTheDocument();
    expect(screen.getByText('Đã đọc')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();

    // Advancing is blocked before reading
    expect(screen.getByRole('button', { name: /Đọc tài liệu \(0\/3\)/ })).toBeDisabled();
  });

  it('should reveal doc content on expand and auto-complete after 3 seconds', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
    await answerQuestions(user, BEST_ANSWERS);
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Expand the first doc — its bullet content appears
    await user.click(screen.getByRole('button', { name: /Copy Trading hoạt động như thế nào/ }));
    expect(screen.getByText(/mọi lệnh của họ sẽ được tự động sao chép/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Slippage: Lệnh của bạn execute sau provider 0\.5-3s/i),
    ).toBeInTheDocument();

    // Not completed yet
    expect(screen.queryByText('Hoàn thành')).not.toBeInTheDocument();

    // Auto-completed after the 3s reading timer
    await waitFor(
      () => {
        expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
      },
      { timeout: 6000 },
    );
    expect(screen.getByText('1/3')).toBeInTheDocument();
  }, 15000);

  it('should grade optimal answers as highly suitable with 20% allocation', async () => {
    const user = userEvent.setup();
    await completeToResults(user, BEST_ANSWERS);

    // Result card ("Điểm đánh giá: 140/140 (100%)" is split by <strong>)
    expect(screen.getByText('Rất phù hợp')).toBeInTheDocument();
    const scoreLine = screen.getByText(/Điểm đánh giá:/);
    expect(scoreLine.textContent).toContain('140/140');
    expect(scoreLine.textContent).toContain('(100%)');

    // Capital allocation recommendation
    expect(screen.getByText('Khuyến nghị phân bổ vốn')).toBeInTheDocument();
    expect(screen.getByText('Số tiền copy khuyến nghị')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText(/Am hiểu sâu, nhưng vẫn nên đa dạng hóa/i)).toBeInTheDocument();
  }, 20000);

  it('should block unsuitable users and send them back to the list', async () => {
    const user = userEvent.setup();
    await completeToResults(user, WORST_ANSWERS);

    expect(screen.getByText('Không phù hợp')).toBeInTheDocument();
    expect(screen.getByText('10/140')).toBeInTheDocument();

    // Warning instead of an allocation
    expect(screen.getByText('Không nên copy chiến lược này')).toBeInTheDocument();
    expect(
      screen.getByText(/không phù hợp với kiến thức và kinh nghiệm hiện tại/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Số tiền copy khuyến nghị')).not.toBeInTheDocument();

    // No cooling-off / next steps for unsuitable users
    expect(screen.queryByText(/Cooling-off Period/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Bước tiếp theo')).not.toBeInTheDocument();

    // CTA returns to the copy trading list instead of configuration
    const backToList = screen.getByRole('button', { name: 'Quay lại danh sách' });
    await user.click(backToList);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/configuration'));
  }, 20000);

  it('should grade medium answers as suitable with 5% allocation', async () => {
    const user = userEvent.setup();
    await completeToResults(user, MEDIUM_ANSWERS);

    expect(screen.getByText('Phù hợp')).toBeInTheDocument();
    const scoreLine = screen.getByText(/Điểm đánh giá:/);
    expect(scoreLine.textContent).toContain('73/140');
    expect(scoreLine.textContent).toContain('(52%)');

    // 52% falls in the 40-55% bucket → conservative 5% recommendation
    expect(screen.getByText('Số tiền copy khuyến nghị')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText(/Bắt đầu với số tiền nhỏ để học hỏi/i)).toBeInTheDocument();

    // CTA continues to provider configuration
    await user.click(screen.getByRole('button', { name: /Tiếp tục cấu hình/ }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/ct001/configuration');
    });
  }, 20000);

  it('should show the 24h cooling-off notice for suitable assessments', async () => {
    const user = userEvent.setup();
    await completeToResults(user, MEDIUM_ANSWERS);

    expect(screen.getByText('Thời gian suy nghĩ (Cooling-off Period)')).toBeInTheDocument();
    // "24 giờ" sits inside a <strong>, so check the notice body as a whole
    const coolingOffBody = screen
      .getByText('Thời gian suy nghĩ (Cooling-off Period)')
      .closest('div');
    expect(coolingOffBody?.textContent).toMatch(/cần chờ 24 giờ trước khi có thể bắt đầu copy/);

    // Next steps
    expect(screen.getByText('Bước tiếp theo')).toBeInTheDocument();
    expect(screen.getByText(/Đánh giá của bạn đã được lưu vào hệ thống/i)).toBeInTheDocument();
    expect(screen.getByText(/Sau 24h, bạn có thể cấu hình và bắt đầu copy/i)).toBeInTheDocument();
    expect(screen.getByText(/Đánh giá sẽ được yêu cầu lại sau 6 tháng/i)).toBeInTheDocument();
  }, 20000);

  it('should show per-question score breakdown on results', async () => {
    const user = userEvent.setup();
    await completeToResults(user, BEST_ANSWERS);

    expect(screen.getByText('Chi tiết điểm số')).toBeInTheDocument();

    // All 7 questions scored full marks (20/20 each)
    expect(screen.getAllByText('20/20').length).toBe(7);
    // Every question title reappears in the breakdown
    expect(screen.getByText('7. Bạn sẽ theo dõi vị thế copy như thế nào?')).toBeInTheDocument();
  }, 20000);

  it('should navigate back within the wizard and via the header', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
    await waitFor(() => {
      expect(screen.getByText('Câu hỏi đánh giá')).toBeInTheDocument();
    });

    // Footer "Quay lại" goes one wizard step back (to welcome).
    // NOTE: the header back button shares the accessible name "Quay lại",
    // so pick the footer one (it has visible text content).
    const footerBack = screen
      .getAllByRole('button', { name: 'Quay lại' })
      .find((btn) => btn.textContent === 'Quay lại');
    expect(footerBack).toBeDefined();
    await user.click(footerBack!);

    await waitFor(() => {
      expect(screen.getByText('Đánh giá rủi ro')).toBeInTheDocument();
    });
    expect(screen.getByText('Đánh giá bắt buộc (MiFID II)')).toBeInTheDocument();

    // Header back button uses router history (navigate(-1))
    const headerBack = screen.getByRole('button', { name: 'Quay lại' });
    await user.click(headerBack);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('should include the mandated risk disclosures in education docs', async () => {
    const user = userEvent.setup();
    renderAssessment('ct001');

    await user.click(screen.getByRole('button', { name: /Bắt đầu đánh giá/ }));
    await answerQuestions(user, BEST_ANSWERS);
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Risks doc
    await user.click(screen.getByRole('button', { name: /Rủi ro của Copy Trading/ }));
    expect(
      screen.getByText(/Hiệu suất quá khứ KHÔNG đảm bảo lợi nhuận tương lai/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/bạn có thể mất 100% vốn đầu tư/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider KHÔNG phải investment advisor/i)).toBeInTheDocument();

    // Best practices doc
    await user.click(screen.getByRole('button', { name: /Nguyên tắc đầu tư an toàn/ }));
    expect(
      screen.getByText(/Không copy quá 20% tổng vốn cho 1 provider duy nhất/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Chỉ copy với số tiền bạn có thể chấp nhận mất hoàn toàn/i),
    ).toBeInTheDocument();
  });

  it('should render nothing for an unknown provider', () => {
    // Routed with a real :providerId — the page guards on COPY_TRADERS lookup
    const { container } = renderAssessment('does-not-exist');

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Đánh giá rủi ro')).not.toBeInTheDocument();
  });
});
