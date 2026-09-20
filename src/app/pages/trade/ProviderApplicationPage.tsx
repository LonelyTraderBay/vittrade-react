/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderApplicationPage — Phase 1 Week 3: Become a Provider
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Apply to become a copy trading provider
 * - Verification tier requirements
 * - Disclosure obligations checklist
 * - Fee structure setup
 * - Terms of service acceptance
 * 
 * Compliance:
 * - KYC/AML requirements
 * - Trading history verification (min 6 months)
 * - Performance disclosure obligations
 * - Conflict of interest declaration
 * - Provider responsibilities
 * - Fiduciary duty acknowledgment
 * 
 * Guidelines:
 * - Multi-step wizard (variant="flush" + StickyFooter)
 * - Trust-first: heavy requirements disclosure
 * - No "get rich quick" messaging
 * - Emphasis on responsibility
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Shield, CheckCircle, AlertTriangle, FileText, DollarSign,
  Users, TrendingUp, Clock, Info, Eye, Lock, Award,
  ChevronRight, XCircle, AlertCircle
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type Step = 'intro' | 'requirements' | 'disclosure' | 'fees' | 'review';

interface ApplicationState {
  hasKYC: boolean;
  tradingMonths: number;
  minCapital: number;
  performanceFee: number;
  agreedToDisclosure: boolean;
  agreedToFiduciary: boolean;
  agreedToTerms: boolean;
  strategyDescription: string;
}

export function ProviderApplicationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [step, setStep] = useState<Step>('intro');
  const [formData, setFormData] = useState<ApplicationState>({
    hasKYC: false,
    tradingMonths: 0,
    minCapital: 10000,
    performanceFee: 10,
    agreedToDisclosure: false,
    agreedToFiduciary: false,
    agreedToTerms: false,
    strategyDescription: '',
  });

  const canProceedFromIntro = true;
  const canProceedFromRequirements = 
    formData.hasKYC && 
    formData.tradingMonths >= 6 && 
    formData.minCapital >= 10000;
  const canProceedFromDisclosure = 
    formData.agreedToDisclosure && 
    formData.agreedToFiduciary;
  const canProceedFromFees = 
    formData.performanceFee >= 0 && 
    formData.performanceFee <= 30 &&
    formData.strategyDescription.length >= 100;
  const canSubmit = formData.agreedToTerms;

  const handleNext = () => {
    if (step === 'intro') setStep('requirements');
    else if (step === 'requirements' && canProceedFromRequirements) setStep('disclosure');
    else if (step === 'disclosure' && canProceedFromDisclosure) setStep('fees');
    else if (step === 'fees' && canProceedFromFees) setStep('review');
  };

  const handleSubmit = () => {
    if (canSubmit) {
      // TODO: Submit application to backend
      alert('Đơn đăng ký đã được gửi! Chúng tôi sẽ xem xét trong 2-3 ngày làm việc.');
      navigate(`${prefix}/trade/copy-trading`);
    }
  };

  return (
    <PageLayout variant="flush">
      <Header 
        title="Đăng ký Provider" 
        back
        breadcrumb={false}
      />

      <PageContent grow padding="default" gap="relaxed">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          {['intro', 'requirements', 'disclosure', 'fees', 'review'].map((s, i) => (
            <React.Fragment key={s}>
              <div 
                className="flex-1 h-1 rounded-full transition-all"
                style={{ 
                  background: ['intro', 'requirements', 'disclosure', 'fees', 'review'].indexOf(step) >= i 
                    ? c.primary 
                    : c.border
                }}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        {step === 'intro' && (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: c.primary + '22' }}
              >
                <Users size={40} color={c.primary} />
              </div>
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                Trở thành Copy Trading Provider
              </h2>
              <p style={{ color: c.text3, fontSize: 13, lineHeight: 1.5 }}>
                Chia sẻ chiến lược giao dịch và kiếm performance fee từ những người copy bạn
              </p>
            </div>

            {/* Benefits */}
            <PageSection label="Lợi ích" accentColor="#10B981">
              <div className="space-y-3">
                {[
                  { icon: DollarSign, title: 'Performance Fee', desc: 'Nhận 10-30% từ lợi nhuận của copiers' },
                  { icon: Users, title: 'Xây dựng danh tiếng', desc: 'Trở thành trader được công nhận' },
                  { icon: TrendingUp, title: 'Không giới hạn thu nhập', desc: 'Thu nhập tăng theo số người copy' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: '#F0FDF4' }}
                      >
                        <Icon size={20} color="#10B981" />
                      </div>
                      <div>
                        <p style={{ color: c.text1, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                          {item.title}
                        </p>
                        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageSection>

            {/* Responsibilities Warning */}
            <div className="p-4 rounded-2xl" style={{ background: c.warningBg, border: `2px solid ${c.warningBorder}` }}>
              <div className="flex gap-3">
                <AlertTriangle size={20} color={c.warningText} className="shrink-0" />
                <div>
                  <h4 style={{ color: c.warningText, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                    Trách nhiệm quan trọng
                  </h4>
                  <ul className="space-y-1">
                    {[
                      'Bạn phải công khai tất cả rủi ro và strategy changes',
                      'Bạn chịu trách nhiệm với chất lượng trading',
                      'Không được market manipulation hoặc wash trading',
                      'Vi phạm sẽ bị cấm vĩnh viễn và xử lý pháp lý',
                    ].map((item, i) => (
                      <li key={i} style={{ color: c.warningText, fontSize: 10, lineHeight: 1.4, paddingLeft: 12 }}>
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Requirements Preview */}
            <PageSection label="Yêu cầu cơ bản" accentColor={c.primary}>
              <div className="space-y-2">
                {[
                  { label: 'KYC Level 2', met: false },
                  { label: 'Trading history ≥6 tháng', met: false },
                  { label: 'Vốn tối thiểu $10,000', met: false },
                  { label: 'Sharpe Ratio >1.0', met: false },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <span style={{ color: c.text2, fontSize: 11 }}>{item.label}</span>
                    {item.met ? (
                      <CheckCircle size={14} color="#10B981" />
                    ) : (
                      <XCircle size={14} color={c.text3} />
                    )}
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        )}

        {step === 'requirements' && (
          <div className="space-y-4">
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Kiểm tra điều kiện
            </h3>

            {/* KYC Status */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} color={c.primary} />
                  <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>KYC Level 2</span>
                </div>
                {formData.hasKYC ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Provider phải hoàn thành KYC Level 2 (ID + Selfie + Proof of address)
              </p>
              <button
                onClick={() => setFormData({ ...formData, hasKYC: !formData.hasKYC })}
                className="px-4 py-2 rounded-xl w-full"
                style={{
                  background: formData.hasKYC ? '#10B981' : c.primary,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {formData.hasKYC ? 'Đã hoàn thành KYC' : 'Hoàn thành KYC ngay'}
              </button>
            </div>

            {/* Trading History */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} color={c.primary} />
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Trading History</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Tài khoản phải có lịch sử giao dịch ít nhất 6 tháng
              </p>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                Số tháng giao dịch
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={formData.tradingMonths}
                onChange={(e) => setFormData({ ...formData, tradingMonths: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${formData.tradingMonths >= 6 ? '#10B981' : c.border}`,
                  color: c.text1,
                  fontSize: 14,
                }}
              />
              {formData.tradingMonths > 0 && formData.tradingMonths < 6 && (
                <p style={{ color: '#EF4444', fontSize: 10, marginTop: 4 }}>
                  Cần ít nhất 6 tháng (hiện tại: {formData.tradingMonths} tháng)
                </p>
              )}
            </div>

            {/* Minimum Capital */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} color={c.primary} />
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Vốn tối thiểu</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Provider phải duy trì vốn tối thiểu $10,000 trong tài khoản
              </p>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                Vốn hiện tại (USD)
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={formData.minCapital}
                onChange={(e) => setFormData({ ...formData, minCapital: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${formData.minCapital >= 10000 ? '#10B981' : c.border}`,
                  color: c.text1,
                  fontSize: 14,
                }}
              />
              {formData.minCapital > 0 && formData.minCapital < 10000 && (
                <p style={{ color: '#EF4444', fontSize: 10, marginTop: 4 }}>
                  Thiếu ${(10000 - formData.minCapital).toLocaleString()}
                </p>
              )}
            </div>

            {/* Requirements Summary */}
            {!canProceedFromRequirements && (
              <div className="p-3 rounded-xl" style={{ background: c.dangerBg }}>
                <p style={{ color: c.dangerText, fontSize: 11, textAlign: 'center', lineHeight: 1.5 }}>
                  Bạn chưa đáp ứng tất cả các yêu cầu. Hoàn thành KYC, trading history, và vốn tối thiểu để tiếp tục.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 'disclosure' && (
          <div className="space-y-4">
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Nghĩa vụ công khai
            </h3>

            <div className="p-4 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Info size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 11, lineHeight: 1.5 }}>
                  Là provider, bạn phải công khai đầy đủ thông tin để copiers đưa ra quyết định sáng suốt.
                </p>
              </div>
            </div>

            {/* Disclosure Checklist */}
            <PageSection label="Bạn đồng ý công khai" accentColor="#F59E0B">
              <div className="space-y-3">
                {[
                  'Tất cả hiệu suất giao dịch (ROI, Win Rate, Max DD, Sharpe)',
                  'Mọi thay đổi chiến lược (phải thông báo trước 7 ngày)',
                  'Conflict of interest (nếu trade coin mình hold)',
                  'Slippage trung bình và execution quality',
                  'Tất cả phí và chi phí (performance fee, platform fee)',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: c.surface2 }}>
                    <CheckCircle size={14} color="#10B981" className="shrink-0 mt-0.5" />
                    <span style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Consent Checkboxes */}
            <button
              onClick={() => setFormData({ ...formData, agreedToDisclosure: !formData.agreedToDisclosure })}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: formData.agreedToDisclosure ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${formData.agreedToDisclosure ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: formData.agreedToDisclosure ? c.primary : c.border,
                  background: formData.agreedToDisclosure ? c.primary : 'transparent'
                }}
              >
                {formData.agreedToDisclosure && <CheckCircle size={14} color="#fff" />}
              </div>
              <p style={{ color: c.text1, fontSize: 11, lineHeight: 1.5 }}>
                Tôi cam kết công khai tất cả thông tin trên và cập nhật liên tục. 
                Vi phạm sẽ dẫn đến đình chỉ và truy cứu pháp lý.
              </p>
            </button>

            <button
              onClick={() => setFormData({ ...formData, agreedToFiduciary: !formData.agreedToFiduciary })}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: formData.agreedToFiduciary ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${formData.agreedToFiduciary ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: formData.agreedToFiduciary ? c.primary : c.border,
                  background: formData.agreedToFiduciary ? c.primary : 'transparent'
                }}
              >
                {formData.agreedToFiduciary && <CheckCircle size={14} color="#fff" />}
              </div>
              <p style={{ color: c.text1, fontSize: 11, lineHeight: 1.5 }}>
                Tôi hiểu rằng hành động của tôi ảnh hưởng trực tiếp đến tài sản của copiers. 
                Tôi cam kết hành động vì lợi ích tốt nhất của họ (fiduciary duty).
              </p>
            </button>
          </div>
        )}

        {step === 'fees' && (
          <div className="space-y-4">
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Cấu trúc phí
            </h3>

            {/* Performance Fee */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={16} color={c.primary} />
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Performance Fee</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Bạn nhận % từ lợi nhuận của copiers (chỉ khi copier lời, high-water mark)
              </p>
              <label style={{ color: c.text2, fontSize: 11, display: 'block', marginBottom: 6 }}>
                Performance Fee (0-30%)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={formData.performanceFee}
                onChange={(e) => setFormData({ ...formData, performanceFee: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 14,
                }}
              />
              <div className="mt-3 p-2 rounded-lg" style={{ background: c.surface2 }}>
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                  Ví dụ: Copier lời $100 → bạn nhận ${(100 * formData.performanceFee / 100).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Strategy Description */}
            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={16} color={c.primary} />
                <span style={{ color: c.text1, fontSize: 13, fontWeight: 600 }}>Mô tả chiến lược</span>
              </div>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                Giải thích rõ chiến lược giao dịch (tối thiểu 100 ký tự)
              </p>
              <textarea
                value={formData.strategyDescription}
                onChange={(e) => setFormData({ ...formData, strategyDescription: e.target.value })}
                placeholder="VD: Tôi sử dụng chiến lược swing trading kết hợp phân tích kỹ thuật và fundamentals. Tập trung vào BTC/ETH/SOL với holding period 3-7 ngày. Risk/reward ratio 1:2, stop-loss luôn được đặt..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl"
                style={{
                  background: c.surface2,
                  border: `1px solid ${c.border}`,
                  color: c.text1,
                  fontSize: 12,
                  lineHeight: 1.5,
                  resize: 'none',
                }}
              />
              <p style={{ 
                color: formData.strategyDescription.length >= 100 ? '#10B981' : c.text3,
                fontSize: 10,
                marginTop: 4
              }}>
                {formData.strategyDescription.length}/100 ký tự
              </p>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h3 style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>
              Xem lại đơn đăng ký
            </h3>

            <div className="p-4 rounded-2xl" style={{ background: c.surface, border: `1px solid ${c.border}` }}>
              <h4 style={{ color: c.text1, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Thông tin cơ bản
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>KYC Level 2</span>
                  <CheckCircle size={14} color="#10B981" />
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>Trading history</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{formData.tradingMonths} tháng</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>Vốn hiện tại</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>${formData.minCapital.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: c.text3, fontSize: 11 }}>Performance fee</span>
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{formData.performanceFee}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ background: c.surface2 }}>
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Chiến lược</p>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
                {formData.strategyDescription}
              </p>
            </div>

            <button
              onClick={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })}
              className="w-full p-3 rounded-xl text-left flex items-start gap-3 transition-all"
              style={{
                background: formData.agreedToTerms ? c.primary + '15' : c.surface2,
                border: `1.5px solid ${formData.agreedToTerms ? c.primary : c.border}`,
              }}
            >
              <div 
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ 
                  borderColor: formData.agreedToTerms ? c.primary : c.border,
                  background: formData.agreedToTerms ? c.primary : 'transparent'
                }}
              >
                {formData.agreedToTerms && <CheckCircle size={14} color="#fff" />}
              </div>
              <p style={{ color: c.text1, fontSize: 11, lineHeight: 1.5 }}>
                Tôi đã đọc và đồng ý với <button className="underline" style={{ color: c.primary }}>Điều khoản Provider</button>, 
                <button className="underline ml-1" style={{ color: c.primary }}>Code of Conduct</button>, và 
                <button className="underline ml-1" style={{ color: c.primary }}>Disclosure Requirements</button>.
              </p>
            </button>

            <div className="p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
              <div className="flex items-start gap-2">
                <Clock size={14} color={c.primary} className="shrink-0 mt-0.5" />
                <p style={{ color: c.primary, fontSize: 10, lineHeight: 1.5 }}>
                  Sau khi gửi, chúng tôi sẽ xem xét đơn trong 2-3 ngày làm việc. 
                  Bạn sẽ nhận email thông báo kết quả.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="h-24" /> {/* Spacer */}
      </PageContent>

      <StickyFooter>
        {step !== 'review' ? (
          <button
            onClick={handleNext}
            disabled={
              (step === 'requirements' && !canProceedFromRequirements) ||
              (step === 'disclosure' && !canProceedFromDisclosure) ||
              (step === 'fees' && !canProceedFromFees)
            }
            className="w-full rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: c.primary,
              color: '#fff',
              height: 48,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <span>Tiếp tục</span>
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: '#10B981',
              color: '#fff',
              height: 48,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <Award size={16} />
            <span>Gửi đơn đăng ký</span>
          </button>
        )}
      </StickyFooter>
    </PageLayout>
  );
}
