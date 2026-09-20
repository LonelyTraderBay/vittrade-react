/**
 * ══════════════════════════════════════════════════════════
 *  P2PKYCStatusPage — /p2p/kyc/status
 * ══════════════════════════════════════════════════════════
 *  CRITICAL: Track P2P KYC verification progress
 *  Timeline of verification steps + status + actions
 *  Tone: Clear, reassuring, actionable
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CheckCircle, Clock, XCircle, AlertTriangle, FileText,
  Camera, Video, Upload, RefreshCw, ChevronRight, Info,
  Shield, MessageCircle, ExternalLink, ChevronDown, ChevronUp,
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
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useRefresh } from '../../hooks/useRefresh';

/* ═══════════════════════════════════════════════════════════
   Verification Step Types
   ═══════════════════════════════════════════════════════════ */
type StepStatus = 'completed' | 'pending' | 'rejected' | 'waiting' | 'processing';

interface VerificationStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: StepStatus;
  completedAt?: string;
  rejectedReason?: string;
  rejectedDetails?: string;
  estimatedTime?: string;
  action?: {
    label: string;
    path: string;
  };
}

/* ═══════════════════════════════════════════════════════════
   Mock Verification Data (Tier 2 - Intermediate)
   ═══════════════════════════════════════════════════════════ */
const MOCK_VERIFICATION: {
  tier: number;
  tierName: string;
  overallStatus: 'approved' | 'pending' | 'rejected' | 'incomplete';
  submittedAt: string;
  approvedAt?: string;
  steps: VerificationStep[];
} = {
  tier: 2,
  tierName: 'Intermediate',
  overallStatus: 'pending',
  submittedAt: '2026-03-04 14:30',
  steps: [
    {
      id: 'identity',
      label: 'Identity Verification',
      description: 'CMND/CCCD/Passport + OCR',
      icon: FileText,
      status: 'completed',
      completedAt: '2026-03-04 14:35',
    },
    {
      id: 'face_match',
      label: 'Face Match',
      description: 'So khớp khuôn mặt với ID',
      icon: Camera,
      status: 'completed',
      completedAt: '2026-03-04 14:36',
    },
    {
      id: 'address_proof',
      label: 'Address Proof',
      description: 'Hóa đơn tiện ích / Bank statement',
      icon: Upload,
      status: 'processing',
      estimatedTime: '2-4 giờ',
    },
    {
      id: 'selfie_verification',
      label: 'Selfie Verification',
      description: 'Selfie với ID card',
      icon: Camera,
      status: 'waiting',
      estimatedTime: '10 phút',
      action: {
        label: 'Bắt đầu',
        path: '/p2p/kyc/selfie',
      },
    },
    {
      id: 'compliance_review',
      label: 'Compliance Review',
      description: 'Xem xét cuối cùng',
      icon: Shield,
      status: 'waiting',
      estimatedTime: '1-2 ngày làm việc',
    },
  ],
};

/* ═══════════════════════════════════════════════════════════
   Status Config
   ═══════════════════════════════════════════════════════════ */
const STATUS_CONFIG: Record<StepStatus, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  completed: {
    color: '#10B981',
    bg: hexToRgba('#10B981', 12),
    label: 'Hoàn thành',
    icon: CheckCircle,
  },
  processing: {
    color: '#3B82F6',
    bg: hexToRgba('#3B82F6', 12),
    label: 'Đang xử lý',
    icon: RefreshCw,
  },
  pending: {
    color: '#F59E0B',
    bg: hexToRgba('#F59E0B', 12),
    label: 'Chờ xử lý',
    icon: Clock,
  },
  waiting: {
    color: '#6B7280',
    bg: hexToRgba('#6B7280', 12),
    label: 'Chưa bắt đầu',
    icon: Clock,
  },
  rejected: {
    color: '#EF4444',
    bg: hexToRgba('#EF4444', 12),
    label: 'Từ chối',
    icon: XCircle,
  },
};

/* ═══════════════════════════════════════════════════════════
   Step Timeline Component
   ═══════════════════════════════════════════════════════════ */
function StepTimeline({ step, isLast }: { step: VerificationStep; isLast: boolean }) {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const [expanded, setExpanded] = useState(false);

  const statusConfig = STATUS_CONFIG[step.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative">
      {/* Timeline Line */}
      {!isLast && (
        <div
          className="absolute left-6 top-12 w-0.5 h-full"
          style={{
            background: step.status === 'completed' ? '#10B981' : c.borderSolid,
          }}
        />
      )}

      {/* Step Content */}
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10"
          style={{
            background: statusConfig.bg,
            border: `2px solid ${statusConfig.color}`,
          }}
        >
          <step.icon size={20} color={statusConfig.color} />
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 2 }}>
                {step.label}
              </h3>
              <p style={{ color: c.text3, fontSize: 11, lineHeight: 1.5 }}>
                {step.description}
              </p>
            </div>

            {/* Status Badge */}
            <div
              className="px-2 py-1 rounded-md flex items-center gap-1 shrink-0 ml-2"
              style={{ background: statusConfig.bg }}
            >
              <StatusIcon size={10} color={statusConfig.color} />
              <span style={{ color: statusConfig.color, fontSize: 9, fontWeight: 700 }}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Completed Info */}
          {step.status === 'completed' && step.completedAt && (
            <p style={{ color: c.text3, fontSize: 10 }}>
              <CheckCircle size={10} className="inline mr-1" />
              Hoàn thành lúc {step.completedAt}
            </p>
          )}

          {/* Processing Info */}
          {step.status === 'processing' && step.estimatedTime && (
            <div className="flex items-center gap-1 mt-2">
              <Clock size={10} color="#3B82F6" />
              <p style={{ color: '#3B82F6', fontSize: 10 }}>
                Ước tính: {step.estimatedTime}
              </p>
            </div>
          )}

          {/* Waiting + Action */}
          {step.status === 'waiting' && step.action && (
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}${step.action!.path}`);
              }}
              className="mt-2 px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1"
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
              }}
            >
              {step.action.label}
              <ChevronRight size={12} />
            </button>
          )}

          {step.status === 'waiting' && !step.action && step.estimatedTime && (
            <p style={{ color: c.text3, fontSize: 10, marginTop: 8 }}>
              <Clock size={10} className="inline mr-1" />
              Thời gian xử lý: {step.estimatedTime}
            </p>
          )}

          {/* Rejected Details */}
          {step.status === 'rejected' && (
            <div className="mt-2">
              <button
                onClick={() => {
                  hapticSelection();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-1 mb-2"
                style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Xem lý do từ chối
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-3 rounded-lg"
                      style={{ background: hexToRgba('#EF4444', 10), border: `1px solid ${hexToRgba('#EF4444', 30)}` }}
                    >
                      <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                        {step.rejectedReason || 'Tài liệu không hợp lệ'}
                      </p>
                      <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
                        {step.rejectedDetails || 'Vui lòng tải lại tài liệu rõ nét, không bị mờ hoặc che khuất.'}
                      </p>
                      <button
                        onClick={() => {
                          hapticSelection();
                          // Navigate to resubmit
                        }}
                        className="mt-2 text-xs font-semibold flex items-center gap-1"
                        style={{ color: '#EF4444' }}
                      >
                        Gửi lại
                        <ChevronRight size={10} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function P2PKYCStatusPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const prefix = useRoutePrefix();
  const { isRefreshing, handleRefresh } = useRefresh({
    onRefresh: async () => {
      await new Promise(res => setTimeout(res, 1000));
      hapticSuccess();
    },
  });

  const data = MOCK_VERIFICATION;
  const completedSteps = data.steps.filter(s => s.status === 'completed').length;
  const totalSteps = data.steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <PageLayout>
        <Header
          title="KYC Status"
          subtitle="KYC · P2P"
          back
        />

        {/* Overall Status Card */}
        <div className="px-5 py-4">
          <TrCard rounded="lg" className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#3B82F6' }}
              >
                <Shield size={24} color="#FFFFFF" />
              </div>
              <div className="flex-1">
                <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, marginBottom: 2 }}>
                  Tier {data.tier} - {data.tierName}
                </h2>
                <p style={{ color: c.text3, fontSize: 11 }}>
                  Gửi lúc {data.submittedAt}
                </p>
              </div>
              <div
                className="px-2 py-1 rounded-md"
                style={{ background: hexToRgba('#F59E0B', 15) }}
              >
                <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700 }}>
                  Đang xử lý
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: c.text2, fontSize: 11, fontWeight: 600 }}>
                  Tiến độ
                </span>
                <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 700 }}>
                  {completedSteps}/{totalSteps} bước
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: c.surface2 }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                  }}
                />
              </div>
            </div>

            {/* Info */}
            <div
              className="p-3 rounded-lg flex items-start gap-2"
              style={{ background: hexToRgba('#3B82F6', 8) }}
            >
              <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
                Chúng tôi đang xem xét hồ sơ của bạn. Bạn sẽ nhận được thông báo qua email khi hoàn tất.
              </p>
            </div>
          </TrCard>
        </div>

        {/* Timeline */}
        <div className="px-5">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            Chi tiết các bước
          </h3>

          <TrCard rounded="lg" className="p-4">
            {data.steps.map((step, idx) => (
              <StepTimeline
                key={step.id}
                step={step}
                isLast={idx === data.steps.length - 1}
              />
            ))}
          </TrCard>
        </div>

        {/* Help Section */}
        <div className="px-5 mt-6">
          <TrCard rounded="md" className="p-4">
            <div className="flex items-start gap-3">
              <MessageCircle size={20} color={c.text3} className="shrink-0" />
              <div className="flex-1">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 4 }}>
                  Cần hỗ trợ?
                </p>
                <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6, marginBottom: 8 }}>
                  Nếu bạn có thắc mắc về quá trình xác minh, vui lòng liên hệ Support.
                </p>
                <button
                  onClick={() => {
                    hapticSelection();
                    navigate(`${prefix}/support`);
                  }}
                  className="text-sm font-semibold flex items-center gap-1"
                  style={{ color: '#3B82F6' }}
                >
                  Mở Support Chat
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </TrCard>
        </div>
      </PageLayout>
    </PullToRefresh>
  );
}