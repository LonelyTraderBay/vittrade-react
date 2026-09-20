/**
 * ══════════════════════════════════════════════════════════
 *  P2PIdentityVerificationPage — /p2p/kyc/identity
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Upload ID document (CMND/CCCD/Passport)
 *  OCR + Face match + Document quality check
 *  Tone: Clear, reassuring, privacy-focused
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Upload, Camera, CheckCircle, AlertTriangle, Info,
  FileText, X, Eye, Shield, Scan, Sparkles, ChevronRight,
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

/* ═══════════════════════════════════════════════════════════
   Document Types
   ═══════════════════════════════════════════════════════════ */
type DocumentType = 'cccd' | 'cmnd' | 'passport';

interface DocumentTypeOption {
  id: DocumentType;
  label: string;
  description: string;
  icon: string;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    id: 'cccd',
    label: 'Căn cước công dân',
    description: 'CCCD gắn chip (12 số)',
    icon: '🪪',
  },
  {
    id: 'cmnd',
    label: 'Chứng minh nhân dân',
    description: 'CMND cũ (9 số)',
    icon: '📇',
  },
  {
    id: 'passport',
    label: 'Hộ chiếu',
    description: 'Passport quốc tế',
    icon: '🛂',
  },
];

/* ═══════════════════════════════════════════════════════════
   Upload Guidelines
   ═══════════════════════════════════════════════════════════ */
const GUIDELINES = [
  'Đảm bảo ảnh rõ nét, không bị mờ hoặc nhòe',
  'Chụp toàn bộ giấy tờ, không bị cắt góc',
  'Không chụp qua màn hình hoặc ảnh photocopy',
  'Ánh sáng đủ, không bị lóa hoặc bóng tối',
  'Thông tin cá nhân phải đọc được rõ ràng',
];

const SECURITY_NOTES = [
  'Tài liệu được mã hóa end-to-end',
  'Chỉ team Compliance được xem',
  'Tự động xóa sau 90 ngày nếu không approve',
  'Tuân thủ GDPR & Privacy Policy',
];

/* ═══════════════════════════════════════════════════════════
   Upload State
   ═══════════════════════════════════════════════════════════ */
type UploadSide = 'front' | 'back';

interface UploadedDocument {
  side: UploadSide;
  file: File;
  preview: string;
  ocrData?: {
    idNumber: string;
    fullName: string;
    dateOfBirth: string;
    issueDate: string;
    expiryDate?: string;
  };
  qualityCheck?: {
    score: number;
    issues: string[];
  };
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PIdentityVerificationPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [uploads, setUploads] = useState<Map<UploadSide, UploadedDocument>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState<UploadSide | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = async (side: UploadSide, file: File) => {
    if (!file.type.startsWith('image/')) {
      hapticError();
      return;
    }

    hapticSelection();

    // Create preview
    const preview = URL.createObjectURL(file);

    // Simulate OCR processing
    if (mountedRef.current) setProcessing(true);
    
    await new Promise(res => {
      timeoutRef.current = setTimeout(res, 2000);
    });

    // Mock OCR data (front side only)
    const ocrData = side === 'front' ? {
      idNumber: '001234567890',
      fullName: 'NGUYỄN VĂN A',
      dateOfBirth: '01/01/1990',
      issueDate: '01/01/2020',
      expiryDate: '01/01/2035',
    } : undefined;

    // Mock quality check
    const qualityCheck = {
      score: 92,
      issues: [] as string[],
    };

    if (qualityCheck.score < 70) {
      qualityCheck.issues.push('Ảnh bị mờ');
    }

    if (!mountedRef.current) return;

    const newUploads = new Map(uploads);
    newUploads.set(side, { side, file, preview, ocrData, qualityCheck });
    setUploads(newUploads);
    setProcessing(false);
    hapticSuccess();
  };

  const handleRemove = (side: UploadSide) => {
    hapticSelection();
    const newUploads = new Map(uploads);
    const upload = newUploads.get(side);
    if (upload) {
      URL.revokeObjectURL(upload.preview);
      newUploads.delete(side);
      setUploads(newUploads);
    }
  };

  const handleSubmit = () => {
    if (uploads.size < 2) {
      hapticError();
      return;
    }

    hapticSuccess();
    // Navigate to face match
    navigate(`${prefix}/p2p/kyc/face-match`);
  };

  const frontUpload = uploads.get('front');
  const backUpload = uploads.get('back');
  const canSubmit = uploads.size === 2 && !processing;

  return (
    <PageLayout>
      <Header
        title="Identity Verification"
        subtitle="KYC · P2P"
        back
      />

      {/* Hero */}
      <div className="px-5 py-4">
        <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#3B82F6' }}
            >
              <FileText size={24} color="#FFFFFF" />
            </div>
            <div className="flex-1">
              <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                Xác minh danh tính
              </h2>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Upload CMND/CCCD/Passport để xác minh. Quá trình xử lý tự động qua OCR.
              </p>
            </div>
          </div>
        </TrCard>
      </div>

      {/* Document Type Selection */}
      {!selectedType && (
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Chọn loại giấy tờ
          </h3>

          <div className="flex flex-col gap-3">
            {DOCUMENT_TYPES.map(doc => (
              <button
                key={doc.id}
                onClick={() => {
                  hapticSelection();
                  setSelectedType(doc.id);
                }}
                className="p-4 rounded-xl text-left flex items-center gap-3"
                style={{ background: c.surface1, border: `1px solid ${c.borderSolid}` }}
              >
                <div className="text-3xl">{doc.icon}</div>
                <div className="flex-1">
                  <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
                    {doc.label}
                  </h4>
                  <p style={{ color: c.text3, fontSize: 11 }}>
                    {doc.description}
                  </p>
                </div>
                <ChevronRight size={18} color={c.text3} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {selectedType && (
        <>
          {/* Guidelines */}
          <div className="px-5 mb-6">
            <TrCard rounded="md" className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
                <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Hướng dẫn chụp ảnh
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                {GUIDELINES.map((guide, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      {guide}
                    </p>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>

          {/* Upload Cards */}
          <div className="px-5 mb-6">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
              Upload hình ảnh
            </h3>

            {/* Front Side */}
            <div className="mb-4">
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                Mặt trước
              </p>

              {!frontUpload ? (
                <>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect('front', file);
                    }}
                  />
                  <button
                    onClick={() => {
                      hapticSelection();
                      frontInputRef.current?.click();
                    }}
                    className="w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                    style={{ borderColor: c.borderSolid, background: c.surface1 }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: hexToRgba('#3B82F6', 12) }}
                    >
                      <Camera size={28} color="#3B82F6" />
                    </div>
                    <div className="text-center">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                        Chụp hoặc tải ảnh mặt trước
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        JPG, PNG • Tối đa 10MB
                      </p>
                    </div>
                  </button>
                </>
              ) : (
                <div className="relative">
                  <div
                    className="w-full h-48 rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${c.borderSolid}` }}
                  >
                    <img
                      src={frontUpload.preview}
                      alt="Front"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemove('front')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={16} color="#FFFFFF" />
                  </button>
                  <button
                    onClick={() => {
                      hapticSelection();
                      setShowPreview('front');
                    }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <Eye size={16} color="#FFFFFF" />
                  </button>

                  {/* OCR Result */}
                  {frontUpload.ocrData && (
                    <div className="mt-3 p-3 rounded-lg" style={{ background: hexToRgba('#10B981', 10) }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Scan size={14} color="#10B981" />
                        <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                          OCR thành công
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Số ID</p>
                          <p style={{ color: c.text1, fontWeight: 600, fontFamily: 'monospace' }}>
                            {frontUpload.ocrData.idNumber}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Họ tên</p>
                          <p style={{ color: c.text1, fontWeight: 600 }}>
                            {frontUpload.ocrData.fullName}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Ngày sinh</p>
                          <p style={{ color: c.text1, fontWeight: 600 }}>
                            {frontUpload.ocrData.dateOfBirth}
                          </p>
                        </div>
                        <div>
                          <p style={{ color: c.text3, fontSize: 10 }}>Hết hạn</p>
                          <p style={{ color: c.text1, fontWeight: 600 }}>
                            {frontUpload.ocrData.expiryDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quality Check */}
                  {frontUpload.qualityCheck && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${frontUpload.qualityCheck.score}%`,
                            background: frontUpload.qualityCheck.score >= 70 ? '#10B981' : '#EF4444',
                          }}
                        />
                      </div>
                      <p style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
                        {frontUpload.qualityCheck.score}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Back Side */}
            <div>
              <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                Mặt sau
              </p>

              {!backUpload ? (
                <>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect('back', file);
                    }}
                  />
                  <button
                    onClick={() => {
                      hapticSelection();
                      backInputRef.current?.click();
                    }}
                    disabled={!frontUpload}
                    className="w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3"
                    style={{
                      borderColor: frontUpload ? c.borderSolid : c.surface2,
                      background: frontUpload ? c.surface1 : c.surface2,
                      opacity: frontUpload ? 1 : 0.5,
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: hexToRgba('#3B82F6', 12) }}
                    >
                      <Camera size={28} color="#3B82F6" />
                    </div>
                    <div className="text-center">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                        Chụp hoặc tải ảnh mặt sau
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>
                        {frontUpload ? 'JPG, PNG • Tối đa 10MB' : 'Upload mặt trước trước'}
                      </p>
                    </div>
                  </button>
                </>
              ) : (
                <div className="relative">
                  <div
                    className="w-full h-48 rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${c.borderSolid}` }}
                  >
                    <img
                      src={backUpload.preview}
                      alt="Back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemove('back')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={16} color="#FFFFFF" />
                  </button>
                  <button
                    onClick={() => {
                      hapticSelection();
                      setShowPreview('back');
                    }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}
                  >
                    <Eye size={16} color="#FFFFFF" />
                  </button>

                  {backUpload.qualityCheck && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${backUpload.qualityCheck.score}%`,
                            background: backUpload.qualityCheck.score >= 70 ? '#10B981' : '#EF4444',
                          }}
                        />
                      </div>
                      <p style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>
                        {backUpload.qualityCheck.score}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="px-5 mb-6">
            <TrCard rounded="md" className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Shield size={16} color="#10B981" className="shrink-0 mt-0.5" />
                <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Bảo mật & Quyền riêng tư
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                {SECURITY_NOTES.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                    <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </TrCard>
          </div>

          {/* Processing Indicator */}
          {processing && (
            <div className="px-5 mb-6">
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ background: hexToRgba('#3B82F6', 10) }}
              >
                <div className="animate-spin">
                  <Sparkles size={20} color="#3B82F6" />
                </div>
                <p style={{ color: '#3B82F6', fontSize: φ.sm, fontWeight: 600 }}>
                  Đang xử lý OCR...
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="px-5">
            <CTAButton
              label="Tiếp tục"
              onClick={handleSubmit}
              disabled={!canSubmit}
              icon={ChevronRight}
            />
          </div>
        </>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-5"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setShowPreview(null)}
          >
            <img
              src={uploads.get(showPreview)?.preview}
              alt="Preview"
              className="max-w-full max-h-full rounded-lg"
            />
            <button
              onClick={() => setShowPreview(null)}
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