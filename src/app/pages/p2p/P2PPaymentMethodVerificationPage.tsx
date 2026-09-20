/**
 * ══════════════════════════════════════════════════════════
 *  P2PPaymentMethodVerificationPage
 *  /p2p/payment-methods/verify
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Verify ownership of payment method
 *  Micro-deposit verification, photo verification
 *  Tone: Clear, trust-building, step-by-step
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CreditCard, Upload, CheckCircle, Clock, Info, Camera,
  AlertTriangle, Shield, ChevronRight,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { toast } from 'sonner';

type VerificationMethod = 'micro_deposit' | 'photo' | 'statement';

const VERIFICATION_METHODS = [
  {
    id: 'micro_deposit' as VerificationMethod,
    label: 'Micro-deposit',
    description: 'Chúng tôi gửi 1-2 VND, bạn xác nhận số tiền',
    duration: '1-2 ngày làm việc',
    icon: CreditCard,
    recommended: true,
  },
  {
    id: 'photo' as VerificationMethod,
    label: 'Upload ảnh',
    description: 'Chụp ảnh thẻ ATM/CCCD cùng tên',
    duration: '10 phút',
    icon: Camera,
    recommended: false,
  },
  {
    id: 'statement' as VerificationMethod,
    label: 'Bank statement',
    description: 'Tải lên sao kê có tên tài khoản',
    duration: '30 phút',
    icon: Upload,
    recommended: false,
  },
];

export function P2PPaymentMethodVerificationPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();

  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = () => {
    hapticSuccess();
    toast.success('Đã gửi yêu cầu xác minh');
    navigate(`${prefix}/p2p/payment-methods`);
  };

  if (!selectedMethod) {
    return (
      <PageLayout>
        <Header title="Xác minh phương thức" subtitle="Thanh toán · P2P" back />

        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#3B82F6' }}
              >
                <Shield size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Xác minh sở hữu
                </h2>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                  Xác minh tài khoản ngân hàng thuộc sở hữu của bạn để đảm bảo an toàn giao dịch.
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Chọn phương thức xác minh
          </h3>

          <div className="flex flex-col gap-3">
            {VERIFICATION_METHODS.map(method => {
              const MethodIcon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => {
                    hapticSelection();
                    setSelectedMethod(method.id);
                  }}
                  className="p-4 rounded-xl text-left"
                  style={{ background: c.surface1, border: `1px solid ${c.borderSolid}` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba('#3B82F6', 12) }}
                    >
                      <MethodIcon size={18} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                          {method.label}
                        </h4>
                        {method.recommended && (
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-bold"
                            style={{ background: hexToRgba('#10B981', 15), color: '#10B981' }}
                          >
                            Đề xuất
                          </span>
                        )}
                      </div>
                      <p style={{ color: c.text3, fontSize: 11, marginBottom: 4 }}>
                        {method.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <Clock size={10} color={c.text3} />
                        <p style={{ color: c.text3, fontSize: 10 }}>{method.duration}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} color={c.text3} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5">
          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{ background: hexToRgba('#F59E0B', 10) }}
          >
            <Info size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Phương thức thanh toán chưa xác minh sẽ có giới hạn giao dịch thấp hơn và có thể bị từ
              chối bởi một số merchant.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Micro-deposit flow
  if (selectedMethod === 'micro_deposit') {
    return (
      <PageLayout>
        <Header title="Micro-deposit Verification" back onBack={() => setSelectedMethod(null)} />

        <div className="px-5 py-6">
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: hexToRgba('#3B82F6', 12) }}
            >
              <CreditCard size={32} color="#3B82F6" />
            </div>
            <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
              Xác minh qua Micro-deposit
            </h2>
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              Chúng tôi sẽ gửi 1-2 VND vào tài khoản của bạn
            </p>
          </div>

          <TrCard rounded="lg" className="p-4 mb-6">
            <div className="flex flex-col gap-3">
              {[
                'Chúng tôi gửi 1-2 VND vào tài khoản',
                'Kiểm tra bank statement (1-2 ngày)',
                'Nhập chính xác số tiền nhận được',
                'Xác minh hoàn tất',
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}
                  >
                    {idx + 1}
                  </div>
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6, flex: 1 }}>{step}</p>
                </div>
              ))}
            </div>
          </TrCard>

          <div className="mb-6">
            <InputField
              label="Số tiền nhận được (VND)"
              placeholder="Nhập số tiền (VD: 1 hoặc 2)"
              type="number"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </div>

          <CTAButton
            label="Xác nhận số tiền"
            onClick={handleSubmit}
            disabled={!verificationCode}
            icon={CheckCircle}
          />
        </div>
      </PageLayout>
    );
  }

  return null;
}