/**
 * ══════════════════════════════════════════════════════════
 *  P2PSelfieVerificationPage — /p2p/kyc/selfie
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Selfie with ID card verification
 *  Liveness detection + Face match với ID
 *  Tone: Clear, reassuring, step-by-step guidance
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Camera, CheckCircle, AlertTriangle, Info, ChevronRight,
  User, Shield, Sparkles, RefreshCw, X,
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
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Verification Steps
   ═══════════════════════════════════════════════════════════ */
type VerificationStep = 'guide' | 'selfie' | 'liveness' | 'result';

interface LivenessAction {
  id: string;
  type: 'smile' | 'blink' | 'turn_left' | 'turn_right' | 'nod';
  instruction: string;
  icon: string;
  completed: boolean;
}

const LIVENESS_ACTIONS: LivenessAction[] = [
  { id: '1', type: 'smile', instruction: 'Mỉm cười', icon: '😊', completed: false },
  { id: '2', type: 'blink', instruction: 'Chớp mắt 2 lần', icon: '👁️', completed: false },
  { id: '3', type: 'turn_left', instruction: 'Quay mặt sang trái', icon: '👈', completed: false },
  { id: '4', type: 'turn_right', instruction: 'Quay mặt sang phải', icon: '👉', completed: false },
];

/* ═══════════════════════════════════════════════════════════
   Guidelines
   ═══════════════════════════════════════════════════════════ */
const GUIDELINES = [
  'Giữ ID card cạnh khuôn mặt',
  'Đảm bảo khuôn mặt và ID rõ nét',
  'Ánh sáng đủ, không chói ngược',
  'Không đeo kính đen, khẩu trang',
  'Nhìn thẳng vào camera',
];

const TIPS = [
  'Sử dụng môi trường đủ sáng',
  'Giữ điện thoại ổn định',
  'Làm theo hướng dẫn từng bước',
  'Khuôn mặt nên ở chính giữa khung hình',
];

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PSelfieVerificationPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [step, setStep] = useState<VerificationStep>('guide');
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [livenessActions, setLivenessActions] = useState<LivenessAction[]>(LIVENESS_ACTIONS);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    matchScore: number;
    livenessScore: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, []);

  const handleStartSelfie = () => {
    hapticSelection();
    setStep('selfie');
  };

  const handleTakeSelfie = async (file: File) => {
    const preview = URL.createObjectURL(file);
    if (!mountedRef.current) return;
    
    setSelfieImage(preview);
    hapticSelection();
    setStep('liveness');

    // Auto-complete liveness actions
    for (let i = 0; i < livenessActions.length; i++) {
      await new Promise<void>(res => {
        const timeout = setTimeout(() => {
          if (mountedRef.current) res();
        }, 2000);
        timeoutsRef.current.push(timeout);
      });
      
      if (!mountedRef.current) return;
      
      setCurrentActionIndex(i);
      setLivenessActions(prev =>
        prev.map((action, idx) => (idx === i ? { ...action, completed: true } : action))
      );
      hapticSuccess();
    }

    // Process result
    if (!mountedRef.current) return;
    
    setProcessing(true);
    
    await new Promise<void>(res => {
      const timeout = setTimeout(() => {
        if (mountedRef.current) res();
      }, 2000);
      timeoutsRef.current.push(timeout);
    });

    if (!mountedRef.current) return;

    const result = {
      success: true,
      matchScore: 96.5,
      livenessScore: 98.2,
    };

    setVerificationResult(result);
    setProcessing(false);
    setStep('result');
  };

  const handleRetry = () => {
    hapticSelection();
    setSelfieImage(null);
    setLivenessActions(LIVENESS_ACTIONS);
    setCurrentActionIndex(0);
    setVerificationResult(null);
    setStep('guide');
  };

  const handleComplete = () => {
    hapticSuccess();
    toast.success('Selfie verification hoàn tất');
    navigate(`${prefix}/p2p/kyc/status`);
  };

  // Guide Step
  if (step === 'guide') {
    return (
      <PageLayout>
        <Header title="Selfie Verification" subtitle="KYC · P2P" back />

        {/* Hero */}
        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4" style={{ background: hexToRgba('#3B82F6', 8) }}>
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#3B82F6' }}
              >
                <Camera size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 4 }}>
                  Selfie với ID
                </h2>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                  Chụp ảnh selfie cầm ID card để xác minh danh tính. Bao gồm liveness detection.
                </p>
              </div>
            </div>
          </TrCard>
        </div>

        {/* Example Image */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Ví dụ mẫu
          </h3>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: `2px solid ${c.borderSolid}` }}
          >
            <div
              className="aspect-[4/3] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <div className="text-center text-white">
                <User size={80} strokeWidth={1.5} />
                <p className="mt-4 text-sm font-semibold">Ảnh mẫu selfie với ID</p>
                <p className="text-xs mt-2 opacity-80">Giữ ID cạnh khuôn mặt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="px-5 mb-6">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Hướng dẫn chụp ảnh
          </h3>

          <TrCard rounded="md" className="p-4">
            <div className="flex flex-col gap-2">
              {GUIDELINES.map((guide, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle size={12} color="#10B981" className="shrink-0 mt-1" />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{guide}</p>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* Tips */}
        <div className="px-5 mb-6">
          <TrCard rounded="md" className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <Info size={16} color="#3B82F6" className="shrink-0 mt-0.5" />
              <h4 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Mẹo để thành công
              </h4>
            </div>
            <div className="flex flex-col gap-2">
              {TIPS.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Sparkles size={12} color="#F59E0B" className="shrink-0 mt-1" />
                  <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>{tip}</p>
                </div>
              ))}
            </div>
          </TrCard>
        </div>

        {/* Start Button */}
        <div className="px-5">
          <CTAButton
            label="Bắt đầu chụp ảnh"
            onClick={handleStartSelfie}
            icon={Camera}
          />
        </div>
      </PageLayout>
    );
  }

  // Selfie Capture Step
  if (step === 'selfie') {
    return (
      <PageLayout>
        <Header title="Chụp ảnh Selfie" subtitle="KYC · P2P" back onBack={handleRetry} />

        <div className="px-5 py-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTakeSelfie(file);
            }}
          />

          <button
            onClick={() => {
              hapticSelection();
              fileInputRef.current?.click();
            }}
            className="w-full aspect-[3/4] rounded-2xl border-4 border-dashed flex flex-col items-center justify-center gap-4"
            style={{ borderColor: '#3B82F6', background: hexToRgba('#3B82F6', 5) }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: '#3B82F6' }}
            >
              <Camera size={48} color="#FFFFFF" />
            </div>
            <div className="text-center px-6">
              <p style={{ color: '#3B82F6', fontSize: φ.md, fontWeight: 700, marginBottom: 8 }}>
                Nhấn để chụp ảnh
              </p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                Đảm bảo khuôn mặt và ID card rõ nét trong khung hình
              </p>
            </div>
          </button>
        </div>
      </PageLayout>
    );
  }

  // Liveness Check Step
  if (step === 'liveness') {
    const currentAction = livenessActions[currentActionIndex];
    const completedCount = livenessActions.filter(a => a.completed).length;

    return (
      <PageLayout>
        <Header title="Liveness Detection" subtitle="KYC · P2P" />

        <div className="px-5 py-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                Tiến độ
              </span>
              <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                {completedCount}/{livenessActions.length}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: c.surface2 }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / livenessActions.length) * 100}%`,
                  background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                }}
              />
            </div>
          </div>

          {/* Current Action */}
          {currentAction && (
            <TrCard rounded="xl" className="p-8 text-center mb-6">
              <div className="text-7xl mb-4">{currentAction.icon}</div>
              <h3 style={{ color: c.text1, fontSize: φ.lg, fontWeight: 700, marginBottom: 8 }}>
                {currentAction.instruction}
              </h3>
              <p style={{ color: c.text3, fontSize: φ.xs }}>
                Làm theo hướng dẫn để tiếp tục
              </p>
            </TrCard>
          )}

          {/* Action List */}
          <div className="grid grid-cols-2 gap-3">
            {livenessActions.map(action => (
              <div
                key={action.id}
                className="p-3 rounded-xl text-center"
                style={{
                  background: action.completed
                    ? hexToRgba('#10B981', 12)
                    : c.surface2,
                  border: `1px solid ${action.completed ? '#10B981' : c.borderSolid}`,
                }}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <p
                  style={{
                    color: action.completed ? '#10B981' : c.text3,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {action.instruction}
                </p>
                {action.completed && (
                  <CheckCircle size={14} color="#10B981" className="mx-auto mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Result Step
  if (step === 'result' && verificationResult) {
    const isSuccess = verificationResult.success;

    return (
      <PageLayout>
        <Header title="Kết quả xác minh" subtitle="KYC · P2P" />

        <div className="px-5 py-6">
          {/* Result Icon */}
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isSuccess
                  ? hexToRgba('#10B981', 12)
                  : hexToRgba('#EF4444', 12),
              }}
            >
              {isSuccess ? (
                <CheckCircle size={40} color="#10B981" />
              ) : (
                <X size={40} color="#EF4444" />
              )}
            </div>
            <h2
              style={{
                color: isSuccess ? '#10B981' : '#EF4444',
                fontSize: φ.lg,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {isSuccess ? 'Xác minh thành công!' : 'Xác minh thất bại'}
            </h2>
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              {isSuccess
                ? 'Khuôn mặt của bạn đã được xác minh'
                : 'Vui lòng thử lại'}
            </p>
          </div>

          {/* Scores */}
          <TrCard rounded="lg" className="mb-6">
            <div className="p-4 border-b" style={{ borderColor: c.borderSolid }}>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                  Face Match Score
                </span>
                <span
                  style={{
                    color: verificationResult.matchScore >= 90 ? '#10B981' : '#F59E0B',
                    fontSize: φ.sm,
                    fontWeight: 700,
                  }}
                >
                  {verificationResult.matchScore}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: c.surface2 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${verificationResult.matchScore}%`,
                    background:
                      verificationResult.matchScore >= 90
                        ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
                  }}
                />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                  Liveness Score
                </span>
                <span
                  style={{
                    color: verificationResult.livenessScore >= 90 ? '#10B981' : '#F59E0B',
                    fontSize: φ.sm,
                    fontWeight: 700,
                  }}
                >
                  {verificationResult.livenessScore}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: c.surface2 }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${verificationResult.livenessScore}%`,
                    background:
                      verificationResult.livenessScore >= 90
                        ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)',
                  }}
                />
              </div>
            </div>
          </TrCard>

          {/* Security Notice */}
          <div
            className="p-3 rounded-lg flex items-start gap-2 mb-6"
            style={{ background: hexToRgba('#3B82F6', 10) }}
          >
            <Shield size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
              Dữ liệu biometric được mã hóa và xóa sau khi xác minh. Chúng tôi không lưu trữ ảnh
              selfie của bạn.
            </p>
          </div>

          {/* Actions */}
          {isSuccess ? (
            <CTAButton label="Hoàn tất" onClick={handleComplete} icon={ChevronRight} />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  hapticSelection();
                  navigate(`${prefix}/support`);
                }}
                className="py-3 rounded-xl font-semibold text-sm"
                style={{ background: c.surface2, color: c.text1 }}
              >
                Liên hệ hỗ trợ
              </button>
              <CTAButton label="Thử lại" onClick={handleRetry} icon={RefreshCw} />
            </div>
          )}
        </div>
      </PageLayout>
    );
  }

  return null;
}