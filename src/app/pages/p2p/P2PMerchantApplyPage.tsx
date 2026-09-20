import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import {
  Award, Shield, TrendingUp, Clock, CheckCircle, ChevronRight,
  Upload, FileText, Camera, Star, Users, Zap, ArrowRight,
  AlertTriangle, CircleDot, X, BadgeCheck, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';

/* ═══════════════════════════════════════════════════════════
   P2P Merchant Application — Multi-step Wizard
   ═══════════════════════════════════════════════════════════ */

const STEPS = ['Yêu cầu', 'Thông tin', 'Xác minh', 'Lịch sử', 'Hoàn tất'] as const;
type StepIdx = 0 | 1 | 2 | 3 | 4;

/* ─── Mock user trading history ─── */
const USER_STATS = {
  totalTrades: 156,
  completionRate: 97.2,
  avgResponseTime: '2m 15s',
  accountAge: 247,
  volume30d: 125_400_000,
  disputes: 1,
  kycLevel: 2,
};

const REQUIREMENTS = [
  { label: 'Tài khoản >= 30 ngày', met: USER_STATS.accountAge >= 30, value: `${USER_STATS.accountAge} ngày`, icon: Clock },
  { label: '>= 100 đơn hoàn thành', met: USER_STATS.totalTrades >= 100, value: `${USER_STATS.totalTrades} đơn`, icon: TrendingUp },
  { label: 'Tỷ lệ HT >= 95%', met: USER_STATS.completionRate >= 95, value: `${USER_STATS.completionRate}%`, icon: Shield },
  { label: 'KYC cấp 2+', met: USER_STATS.kycLevel >= 2, value: `Cấp ${USER_STATS.kycLevel}`, icon: BadgeCheck },
  { label: '<= 2 tranh chấp', met: USER_STATS.disputes <= 2, value: `${USER_STATS.disputes} vụ`, icon: AlertTriangle },
];

const BENEFITS = [
  { icon: Star, label: 'Huy hiệu Merchant', desc: 'Tăng uy tín & thứ hạng hiển thị', color: '#F59E0B' },
  { icon: Zap, label: 'Phí ưu đãi', desc: 'Giảm 50% phí giao dịch P2P', color: '#10B981' },
  { icon: Users, label: 'Ưu tiên hiển thị', desc: 'Quảng cáo xuất hiện đầu danh sách', color: '#3B82F6' },
  { icon: Shield, label: 'Hỗ trợ VIP', desc: 'Kênh hỗ trợ Merchant riêng 24/7', color: '#8B5CF6' },
];

export function P2PMerchantApplyPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [step, setStep] = useState<StepIdx>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ─── Step 2: Business Info ─── */
  const [bizName, setBizName] = useState('');
  const [bizType, setBizType] = useState('');
  const [bizDesc, setBizDesc] = useState('');

  /* ─── Step 3: Documents ─── */
  const [docId, setDocId] = useState(false);
  const [docBiz, setDocBiz] = useState(false);
  const [docSelfie, setDocSelfie] = useState(false);

  /* ─── Step 5: Agreement ─── */
  const [agreed, setAgreed] = useState(false);

  const allReqMet = REQUIREMENTS.every(r => r.met);
  const bizValid = bizName.trim().length > 0 && bizType.length > 0;
  const docsValid = docId && docSelfie;

  const canProceed = () => {
    if (step === 0) return allReqMet;
    if (step === 1) return bizValid;
    if (step === 2) return docsValid;
    if (step === 3) return true;
    if (step === 4) return agreed;
    return false;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as StepIdx);
      hapticSelection();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    hapticSuccess();
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <PageLayout>
      <Header title="Đăng ký Merchant" subtitle="Merchant · P2P" back />

      {/* ─── Progress Steps ─── */}
      {!submitted && (
        <div className="px-5 py-3" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}` }}>
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: i < step ? '#10B981' : i === step ? '#3B82F6' : c.surface2,
                      border: `1.5px solid ${i < step ? '#10B981' : i === step ? '#3B82F6' : c.borderSolid}`,
                    }}
                  >
                    {i < step ? (
                      <CheckCircle size={12} color="#fff" />
                    ) : (
                      <span style={{ color: i === step ? '#fff' : c.text3, fontSize: 9, fontWeight: 700 }}>{i + 1}</span>
                    )}
                  </div>
                  <span style={{ color: i <= step ? c.text1 : c.text3, fontSize: 8, fontWeight: 600, maxWidth: 50, textAlign: 'center' }}>
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-4 h-0.5 mx-0.5 rounded-full -mt-4"
                    style={{ background: i < step ? '#10B981' : c.surface2 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step Content ─── */}
      <PageContent>
        <AnimatePresence mode="wait">
          {/* ═══ SUCCESS STATE ═══ */}
          {submitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 py-8">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.12)' }}
              >
                <BadgeCheck size={40} color="#10B981" />
              </motion.div>
              <div className="text-center">
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 8 }}>
                  Đơn đã gửi thành công!
                </h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6, maxWidth: 280 }}>
                  Đội ngũ VitTrade sẽ xem xét trong vòng 1-3 ngày làm việc. Bạn sẽ nhận thông báo khi có kết quả.
                </p>
              </div>
              <TrCard className="w-full p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Clock size={14} color="#F59E0B" />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Trạng thái: Đang xét duyệt</span>
                </div>
                <div className="flex flex-col gap-2">
                  {['Nhận đơn đăng ký', 'Xác minh tài liệu', 'Đánh giá lịch sử', 'Phê duyệt'].map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: i === 0 ? '#10B981' : c.surface2 }}>
                        {i === 0 ? <CheckCircle size={10} color="#fff" /> : <CircleDot size={10} color={c.text3} />}
                      </div>
                      <span style={{ color: i === 0 ? '#10B981' : c.text3, fontSize: 12, fontWeight: i === 0 ? 600 : 400 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </TrCard>
              <CTAButton onClick={() => navigate(`${prefix}/p2p`)} variant="primary">
                Quay về P2P
              </CTAButton>
            </motion.div>
          ) : step === 0 ? (
            /* ═══ STEP 1: Requirements ═══ */
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div>
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Trở thành Merchant
                </h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>
                  Nâng cấp tài khoản để nhận ưu đãi độc quyền và tăng uy tín.
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-2.5">
                {BENEFITS.map((b, i) => (
                  <motion.div key={b.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <TrCard className="p-3 h-full">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: b.color + '14' }}>
                        <b.icon size={14} color={b.color} />
                      </div>
                      <p style={{ color: c.text1, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{b.label}</p>
                      <p style={{ color: c.text3, fontSize: 9, lineHeight: 1.5 }}>{b.desc}</p>
                    </TrCard>
                  </motion.div>
                ))}
              </div>

              {/* Requirements Checklist */}
              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 10 }}>
                  Yêu cầu tối thiểu
                </p>
                <div className="flex flex-col gap-3">
                  {REQUIREMENTS.map((r, i) => (
                    <motion.div key={r.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                      className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: r.met ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                        {r.met ? <CheckCircle size={13} color="#10B981" /> : <X size={13} color="#EF4444" />}
                      </div>
                      <div className="flex-1">
                        <p style={{ color: r.met ? c.text1 : '#EF4444', fontSize: 12, fontWeight: 600 }}>{r.label}</p>
                      </div>
                      <span style={{ color: r.met ? '#10B981' : '#EF4444', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
                        {r.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </TrCard>
            </motion.div>
          ) : step === 1 ? (
            /* ═══ STEP 2: Business Info ═══ */
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div>
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Thông tin doanh nghiệp</h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>Cung cấp thông tin để xác minh tài khoản Merchant.</p>
              </div>

              <TrCard className="p-4 flex flex-col gap-4">
                <div>
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Tên doanh nghiệp / Tên hiển thị *</p>
                  <InputField placeholder="VD: CryptoTrader VN" value={bizName} onChange={e => setBizName(e.target.value)} style={{ fontSize: 14 }} />
                </div>
                <div>
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Loại hình *</p>
                  <div className="flex flex-wrap gap-2">
                    {['Cá nhân', 'Hộ kinh doanh', 'Công ty', 'OTC Desk'].map(t => (
                      <button key={t} onClick={() => { setBizType(t); hapticSelection(); }}
                        className="px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: bizType === t ? c.chipActiveBg : c.chipBg,
                          color: bizType === t ? c.chipActiveText : c.chipText,
                          border: `1px solid ${bizType === t ? c.chipActiveBorder : c.chipBorder}`,
                          fontWeight: 700,
                        }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Mô tả (tùy chọn)</p>
                  <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)}
                    placeholder="Giới thiệu ngắn về hoạt động giao dịch của bạn..." rows={3}
                    className="w-full rounded-2xl px-4 py-3"
                    style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6 }} />
                </div>
              </TrCard>
            </motion.div>
          ) : step === 2 ? (
            /* ═══ STEP 3: Document Verification ═══ */
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div>
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Xác minh tài liệu</h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>Tải lên các tài liệu cần thiết để xác minh.</p>
              </div>

              {[
                { label: 'CMND / CCCD / Hộ chiếu', desc: 'Ảnh 2 mặt rõ nét', icon: FileText, done: docId, toggle: () => setDocId(!docId), required: true },
                { label: 'Giấy phép kinh doanh', desc: 'Bản scan hoặc ảnh chụp', icon: Award, done: docBiz, toggle: () => setDocBiz(!docBiz), required: false },
                { label: 'Ảnh selfie xác minh', desc: 'Cầm CMND + giấy ghi ngày', icon: Camera, done: docSelfie, toggle: () => setDocSelfie(!docSelfie), required: true },
              ].map((doc, i) => (
                <motion.div key={doc.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                  <TrCard
                    as="button"
                    onClick={() => { doc.toggle(); hapticSelection(); }}
                    className="w-full p-4"
                    accentBorder={doc.done ? 'rgba(16,185,129,0.3)' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: doc.done ? 'rgba(16,185,129,0.1)' : c.surface2 }}>
                        {doc.done ? <CheckCircle size={20} color="#10B981" /> : <Upload size={20} color={c.text3} />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{doc.label}</p>
                          {doc.required && <span style={{ color: '#EF4444', fontSize: 10 }}>*</span>}
                        </div>
                        <p style={{ color: doc.done ? '#10B981' : c.text3, fontSize: 10, marginTop: 2 }}>
                          {doc.done ? 'Đã tải lên (Demo)' : doc.desc}
                        </p>
                      </div>
                      {!doc.done && <Upload size={14} color={c.text3} />}
                    </div>
                  </TrCard>
                </motion.div>
              ))}

              <div className="rounded-2xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="flex items-start gap-2">
                  <Shield size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#3B82F6', fontSize: 10, lineHeight: 1.6 }}>
                    Tài liệu được mã hóa AES-256 và chỉ dùng cho mục đích xác minh. Tự động xóa sau 90 ngày.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : step === 3 ? (
            /* ═══ STEP 4: Trading History ═══ */
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div>
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Đánh giá lịch sử</h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>Hệ thống tự động kiểm tra lịch sử giao dịch.</p>
              </div>

              <TrCard className="p-4">
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Tổng đơn hoàn thành', value: `${USER_STATS.totalTrades}`, color: '#3B82F6', icon: TrendingUp },
                    { label: 'Tỷ lệ hoàn thành', value: `${USER_STATS.completionRate}%`, color: '#10B981', icon: Shield },
                    { label: 'Thời gian phản hồi TB', value: USER_STATS.avgResponseTime, color: '#F59E0B', icon: Clock },
                    { label: 'Tuổi tài khoản', value: `${USER_STATS.accountAge} ngày`, color: '#8B5CF6', icon: Clock },
                    { label: 'KL giao dịch 30 ngày', value: `${(USER_STATS.volume30d / 1e6).toFixed(1)}M VND`, color: '#3B82F6', icon: TrendingUp },
                    { label: 'Tranh chấp', value: `${USER_STATS.disputes}`, color: USER_STATS.disputes <= 2 ? '#10B981' : '#EF4444', icon: AlertTriangle },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                      className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: stat.color + '14' }}>
                        <stat.icon size={12} color={stat.color} />
                      </div>
                      <span className="flex-1" style={{ color: c.text2, fontSize: 12 }}>{stat.label}</span>
                      <span style={{ color: stat.color, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{stat.value}</span>
                    </motion.div>
                  ))}
                </div>
              </TrCard>

              <div className="rounded-2xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} color="#10B981" />
                  <p style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                    Tất cả tiêu chí đánh giá đều đạt yêu cầu!
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ═══ STEP 5: Agreement & Submit ═══ */
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4">
              <div>
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>Xác nhận & Gửi đơn</h2>
                <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>Kiểm tra lại thông tin trước khi nộp đơn đăng ký.</p>
              </div>

              {/* Summary */}
              <TrCard className="p-4">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 10 }}>Tóm tắt đơn đăng ký</p>
                {[
                  { label: 'Tên', value: bizName || '—' },
                  { label: 'Loại hình', value: bizType || '—' },
                  { label: 'Tổng đơn', value: `${USER_STATS.totalTrades}` },
                  { label: 'Tỷ lệ HT', value: `${USER_STATS.completionRate}%` },
                  { label: 'KYC', value: `Cấp ${USER_STATS.kycLevel}` },
                  { label: 'Tài liệu', value: `${[docId, docBiz, docSelfie].filter(Boolean).length}/3 đã tải` },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <span style={{ color: c.text3, fontSize: 12 }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </TrCard>

              {/* Agreement */}
              <button onClick={() => { setAgreed(!agreed); hapticSelection(); }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: agreed ? 'rgba(16,185,129,0.06)' : c.surface2, border: `1.5px solid ${agreed ? 'rgba(16,185,129,0.3)' : c.borderSolid}`, transition: 'all 0.25s' }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: agreed ? '#10B981' : 'transparent', border: `1.5px solid ${agreed ? '#10B981' : c.text3}` }}>
                  {agreed && <CheckCircle size={11} color="#fff" />}
                </div>
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, textAlign: 'left' }}>
                  Tôi xác nhận thông tin là chính xác, đồng ý với <span style={{ color: '#3B82F6', fontWeight: 600 }}>Điều khoản Merchant</span> và <span style={{ color: '#3B82F6', fontWeight: 600 }}>Chính sách P2P</span> của VitTrade. Tôi hiểu rằng vi phạm có thể dẫn đến thu hồi tư cách Merchant.
                </p>
              </button>

              <div className="rounded-2xl p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#F59E0B', fontSize: 10, lineHeight: 1.6 }}>
                    Quá trình xét duyệt thường mất 1-3 ngày làm việc. Trong thời gian chờ, bạn vẫn có thể giao dịch bình thường.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Navigation Buttons ─── */}
        {!submitted && (
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => { setStep((step - 1) as StepIdx); hapticSelection(); }}
                className="flex-1 py-3 rounded-2xl"
                style={{ background: c.surface2, color: c.text2, fontWeight: 700, fontSize: 14, border: `1px solid ${c.borderSolid}` }}>
                Quay lại
              </button>
            )}
            {step < 4 ? (
              <CTAButton onClick={handleNext} disabled={!canProceed()} fullWidth={step === 0}>
                Tiếp tục
              </CTAButton>
            ) : (
              <CTAButton onClick={handleSubmit} disabled={!agreed} loading={isSubmitting} variant="success">
                {isSubmitting ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
              </CTAButton>
            )}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}