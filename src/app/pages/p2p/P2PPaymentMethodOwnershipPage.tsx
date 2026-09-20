/**
 * P2PPaymentMethodOwnershipPage
 * /p2p/payment-methods/:id/ownership
 * CRITICAL: Prove ownership of payment method with documents
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { CreditCard, Upload, CheckCircle, Camera, ChevronRight, X } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { toast } from 'sonner';

const REQUIRED_DOCS = [
  { id: 'bank_card', label: 'Ảnh thẻ ATM', uploaded: false },
  { id: 'selfie_card', label: 'Selfie với thẻ', uploaded: false },
  { id: 'statement', label: 'Bank statement (optional)', uploaded: false, optional: true },
];

export function P2PPaymentMethodOwnershipPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const c = useThemeColors();
  const { hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const [docs, setDocs] = useState(REQUIRED_DOCS);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleUpload = (docId: string) => {
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, uploaded: true } : d));
    hapticSuccess();
    toast.success('Đã upload tài liệu');
  };

  const handleSubmit = () => {
    const requiredUploaded = docs.filter(d => !d.optional).every(d => d.uploaded);
    if (!requiredUploaded) {
      toast.error('Vui lòng upload đủ tài liệu bắt buộc');
      return;
    }
    hapticSuccess();
    toast.success('Đã gửi xác minh. Chờ duyệt 24-48h');
    navigate(`${prefix}/p2p/payment-methods`);
  };

  const canSubmit = docs.filter(d => !d.optional).every(d => d.uploaded);

  return (
    <PageLayout>
      <Header title="Proof of Ownership" subtitle="Thanh toán · P2P" back />

      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#3B82F6' }}>
              <CreditCard size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Xác minh sở hữu
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Upload tài liệu chứng minh tài khoản thuộc sở hữu của bạn
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      <div className="px-5 mb-6">
        <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
          Tài liệu cần thiết
        </h3>
        <div className="flex flex-col gap-3">
          {docs.map(doc => (
            <TrCard key={doc.id} rounded="md" className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: doc.uploaded ? hexToRgba('#10B981', 12) : hexToRgba('#3B82F6', 12) }}
                >
                  {doc.uploaded ? (
                    <CheckCircle size={18} color="#10B981" />
                  ) : (
                    <Camera size={18} color="#3B82F6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{doc.label}</p>
                    {doc.optional && (
                      <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: c.surface2, color: c.text3 }}>
                        Optional
                      </span>
                    )}
                  </div>
                  {doc.uploaded && (
                    <p style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>✓ Đã upload</p>
                  )}
                </div>
                {!doc.uploaded ? (
                  <button
                    onClick={() => handleUpload(doc.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: hexToRgba('#3B82F6', 12), color: '#3B82F6' }}
                  >
                    Upload
                  </button>
                ) : (
                  <button
                    onClick={() => setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, uploaded: false } : d))}
                    className="p-2"
                  >
                    <X size={16} color={c.text3} />
                  </button>
                )}
              </div>
            </TrCard>
          ))}
        </div>
      </div>

      <div className="px-5">
        <CTAButton
          label="Gửi xác minh"
          onClick={handleSubmit}
          disabled={!canSubmit}
          icon={ChevronRight}
        />
      </div>
    </PageLayout>
  );
}