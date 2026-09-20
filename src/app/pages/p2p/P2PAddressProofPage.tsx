/**
 * ══════════════════════════════════════════════════════════
 *  P2PAddressProofPage — /p2p/kyc/address-proof
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Upload proof of address (utility bill, bank statement)
 *  Document verification for Tier 2+
 *  Tone: Clear, reassuring, privacy-focused
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText, Upload, CheckCircle, AlertTriangle, Info, X, Eye,
  Home, CreditCard, Receipt, Calendar, MapPin, Shield, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

/* ═══════════════════════════════════════════════════════════
   Document Types
   ═══════════════════════════════════════════════════════════ */
type DocumentType = 'utility' | 'bank_statement' | 'gov_letter' | 'lease';

interface DocumentOption {
  id: DocumentType;
  label: string;
  description: string;
  examples: string[];
  icon: React.ElementType;
}

const DOCUMENT_TYPES: DocumentOption[] = [
  {
    id: 'utility',
    label: 'Hóa đơn tiện ích',
    description: 'Điện, nước, gas, internet',
    examples: ['Hóa đơn điện EVN', 'Hóa đơn nước', 'Hóa đơn internet FPT/Viettel'],
    icon: Receipt,
  },
  {
    id: 'bank_statement',
    label: 'Sao kê ngân hàng',
    description: 'Bank statement 3 tháng gần nhất',
    examples: ['Sao kê Vietcombank', 'Sao kê BIDV', 'Sao kê Techcombank'],
    icon: CreditCard,
  },
  {
    id: 'gov_letter',
    label: 'Giấy tờ chính phủ',
    description: 'Giấy xác nhận tạm trú, hộ khẩu',
    examples: ['Giấy xác nhận tạm trú', 'Sổ hộ khẩu'],
    icon: FileText,
  },
  {
    id: 'lease',
    label: 'Hợp đồng thuê nhà',
    description: 'Lease agreement có công chứng',
    examples: ['Hợp đồng thuê nhà công chứng'],
    icon: Home,
  },
];

/* ═══════════════════════════════════════════════════════════
   Requirements
   ═══════════════════════════════════════════════════════════ */
const REQUIREMENTS = [
  'Tài liệu phải trong vòng 3 tháng',
  'Địa chỉ phải khớp với thông tin đã khai báo',
  'Tên phải khớp với CMND/CCCD',
  'Tài liệu phải rõ nét, đầy đủ thông tin',
  'Chấp nhận cả bản scan và ảnh chụp',
];

/* ═══════════════════════════════════════════════════════════
   Upload State
   ═══════════════════════════════════════════════════════════ */
interface UploadedDoc {
  file: File;
  preview: string;
  extractedData?: {
    address: string;
    name: string;
    date: string;
  };
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PAddressProofPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [upload, setUpload] = useState<UploadedDoc | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      hapticError();
      toast.error('Chỉ chấp nhận file ảnh hoặc PDF');
      return;
    }

    hapticSelection();
    const preview = URL.createObjectURL(file);

    // Simulate OCR
    if (mountedRef.current) setProcessing(true);
    
    await new Promise(res => {
      timeoutRef.current = setTimeout(res, 2000);
    });

    if (!mountedRef.current) return;

    const extractedData = {
      address: '123 Đường Láng, Đống Đa, Hà Nội',
      name: 'NGUYỄN VĂN A',
      date: '15/02/2026',
    };

    setUpload({ file, preview, extractedData });
    setManualAddress(extractedData.address);
    setProcessing(false);
    hapticSuccess();
  };

  const handleRemove = () => {
    if (upload) {
      URL.revokeObjectURL(upload.preview);
      setUpload(null);
      setManualAddress('');
    }
    hapticSelection();
  };

  const handleSubmit = () => {
    if (!upload || !manualAddress.trim()) {
      hapticError();
      toast.error('Vui lòng upload tài liệu và xác nhận địa chỉ');
      return;
    }

    hapticSuccess();
    toast.success('Đã gửi proof of address');
    navigate(`${prefix}/p2p/kyc/status`);
  };

  const canSubmit = !!upload && !!manualAddress.trim() && !processing;

  return (
    <PageLayout>
      <Header title="Proof of Address" subtitle="KYC · P2P" back />

      {/* Hero */}
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#3B82F6' }}
            >
              <MapPin size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Xác minh địa chỉ
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Upload tài liệu chứng minh địa chỉ cư trú của bạn. Yêu cầu cho Tier 2+.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Requirements */}
      <div className="px-5 mb-6">
        <TrCard rounded="md" className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
            <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Yêu cầu tài liệu
            </h4>
          </div>
          <div className="flex flex-col gap-2">
            {REQUIREMENTS.map((req, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{req}</p>
              </div>
            ))}
          </div>
        </TrCard>
      </div>

      {/* Document Type Selection */}
      {!selectedType && (
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Chọn loại tài liệu
          </h3>

          <div className="flex flex-col gap-3">
            {DOCUMENT_TYPES.map(doc => {
              const DocIcon = doc.icon;
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    hapticSelection();
                    setSelectedType(doc.id);
                  }}
                  className="p-4 rounded-xl text-left"
                  style={{ background: c.surface1, border: `1px solid ${c.borderSolid}` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba('#3B82F6', 12) }}
                    >
                      <DocIcon size={18} color="#3B82F6" />
                    </div>
                    <div className="flex-1">
                      <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
                        {doc.label}
                      </h4>
                      <p style={{ color: c.text3, fontSize: 11 }}>{doc.description}</p>
                    </div>
                    <ChevronRight size={18} color={c.text3} />
                  </div>

                  {/* Examples */}
                  <div className="pl-13 flex flex-wrap gap-2">
                    {doc.examples.map((ex, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md text-xs"
                        style={{ background: c.surface2, color: c.text3 }}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {selectedType && (
        <>
          <div className="px-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Upload tài liệu
              </h3>
              <button
                onClick={() => {
                  hapticSelection();
                  setSelectedType(null);
                  handleRemove();
                }}
                className="text-xs font-semibold"
                style={{ color: '#3B82F6' }}
              >
                Đổi loại tài liệu
              </button>
            </div>

            {!upload ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <button
                  onClick={() => {
                    hapticSelection();
                    fileInputRef.current?.click();
                  }}
                  className="w-full h-64 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                  style={{ borderColor: c.borderSolid, background: c.surface1 }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: hexToRgba('#3B82F6', 12) }}
                  >
                    <Upload size={28} color="#3B82F6" />
                  </div>
                  <div className="text-center px-4">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                      Chụp hoặc tải tài liệu
                    </p>
                    <p style={{ color: c.text3, fontSize: 11 }}>
                      JPG, PNG, PDF • Tối đa 10MB
                    </p>
                  </div>
                </button>
              </>
            ) : (
              <div className="relative">
                <div
                  className="w-full h-64 rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${c.borderSolid}` }}
                >
                  {upload.file.type === 'application/pdf' ? (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{ background: c.surface2 }}
                    >
                      <FileText size={48} color={c.text3} />
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginTop: 8 }}>
                        {upload.file.name}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={upload.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}
                >
                  <X size={16} color="#FFFFFF" />
                </button>

                {upload.file.type !== 'application/pdf' && (
                  <button
                    onClick={() => {
                      hapticSelection();
                      setShowPreview(true);
                    }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <Eye size={16} color="#FFFFFF" />
                  </button>
                )}

                {/* Extracted Data */}
                {upload.extractedData && (
                  <div className="mt-3 p-3 rounded-lg" style={{ background: hexToRgba('#10B981', 10) }}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={14} color="#10B981" />
                      <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                        Đã trích xuất thông tin
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div>
                        <p style={{ color: c.text3, fontSize: 10 }}>Tên</p>
                        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                          {upload.extractedData.name}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: c.text3, fontSize: 10 }}>Ngày phát hành</p>
                        <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                          {upload.extractedData.date}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Address Input */}
          {upload && (
            <div className="px-5 mb-6">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
                Xác nhận địa chỉ
              </h3>

              <InputField
                label="Địa chỉ cư trú"
                placeholder="Nhập địa chỉ đầy đủ"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                icon={MapPin}
              />

              <div
                className="mt-3 p-3 rounded-lg flex items-start gap-2"
                style={{ background: hexToRgba('#F59E0B', 10) }}
              >
                <AlertTriangle size={14} color="#F59E0B" className="shrink-0 mt-0.5" />
                <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                  Địa chỉ này phải khớp với địa chỉ trên tài liệu và CMND/CCCD của bạn.
                </p>
              </div>
            </div>
          )}

          {/* Processing */}
          {processing && (
            <div className="px-5 mb-6">
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: hexToRgba('#3B82F6', 10) }}
              >
                <div className="animate-spin">
                  <FileText size={20} color="#3B82F6" />
                </div>
                <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600 }}>
                  Đang xử lý tài liệu...
                </p>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="px-5 mb-6">
            <TrCard rounded="md" className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Shield size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Bảo mật thông tin
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  'Tài liệu được mã hóa AES-256',
                  'Chỉ Compliance team được xem',
                  'Tự động xóa sau 90 ngày nếu không approve',
                  'Tuân thủ GDPR & PDPA',
                ].map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{note}</p>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>

          {/* Submit */}
          <div className="px-5">
            <CTAButton
              label="Gửi tài liệu"
              onClick={handleSubmit}
              disabled={!canSubmit}
              icon={ChevronRight}
            />
          </div>
        </>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && upload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setShowPreview(false)}
          >
            <img
              src={upload.preview}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg"
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <X size={20} color="#FFFFFF" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}