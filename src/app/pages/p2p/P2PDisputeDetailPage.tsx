import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { CTAButton } from '../../components/ui/CTAButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { P2P_DISPUTES } from '../../data/mockData';
import { φ, φIcon } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import {
  AlertTriangle, CheckCircle, Clock, Upload, Image, MessageCircle,
  FileText, Shield, ChevronRight, Send, Bot, Headphones,
  Scale, Briefcase, ArrowUp, Info, ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useActionToast } from '../../hooks/useActionToast';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TOAST } from '../../data/toastMessages';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';

/* ═══════════════════════════════════════════════════════════
   4-Level Dispute Escalation System
   ═══════════════════════════════════════════════════════════ */
const ESCALATION_LEVELS = [
  {
    level: 1,
    label: 'Bot AI',
    labelVi: 'Xử lý tự động',
    description: 'Hệ thống AI phân tích bằng chứng & đưa ra khuyến nghị',
    icon: Bot,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    avgTime: '~5 phút',
    resolution: 'Tự động phân tích giao dịch, so khớp bằng chứng thanh toán',
  },
  {
    level: 2,
    label: 'Support Agent',
    labelVi: 'Nhân viên hỗ trợ',
    description: 'Nhân viên xem xét chi tiết, liên hệ cả hai bên',
    icon: Headphones,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    avgTime: '~2 giờ',
    resolution: 'Kiểm tra lịch sử giao dịch, yêu cầu thêm bằng chứng nếu cần',
  },
  {
    level: 3,
    label: 'Arbitration',
    labelVi: 'Trọng tài',
    description: 'Trọng tài viên độc lập đánh giá & ra quyết định',
    icon: Scale,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
    avgTime: '~24 giờ',
    resolution: 'Phân xử dựa trên chính sách nền tảng & bằng chứng cả hai bên',
  },
  {
    level: 4,
    label: 'Legal Team',
    labelVi: 'Đội ngũ pháp lý',
    description: 'Xử lý bởi đội ngũ pháp lý — trường hợp nghiêm trọng',
    icon: Briefcase,
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444, #F87171)',
    avgTime: '~48 giờ',
    resolution: 'Can thiệp pháp lý, đóng băng tài khoản nếu phát hiện gian lận',
  },
] as const;

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  submitted: { label: 'Đã gửi', color: '#F59E0B', icon: Clock },
  under_review: { label: 'Đang xem xét', color: '#3B82F6', icon: FileText },
  resolved: { label: 'Đã giải quyết', color: '#10B981', icon: CheckCircle },
  rejected: { label: 'Bị từ chối', color: '#EF4444', icon: AlertTriangle },
};

export function P2PDisputeDetailPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess, hapticWarning } = useHaptic();
  const actionToast = useActionToast();
  const prefix = useRoutePrefix();
  const { id: disputeId } = useParams();
  const dispute = P2P_DISPUTES.find(d => d.orderId === disputeId || d.id === disputeId) || P2P_DISPUTES[0];
  const statusInfo = STATUS_MAP[dispute.status];
  const StatusIcon = statusInfo.icon;

  const [supportMsg, setSupportMsg] = useState('');
  const [messages, setMessages] = useState(dispute.supportMessages);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(dispute.evidence);

  /* ─── 4-Level Escalation State ─── */
  const [currentLevel, setCurrentLevel] = useState(
    dispute.status === 'submitted' ? 1 : dispute.status === 'under_review' ? 2 : 2
  );
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  /* ─── Scroll lock now handled by BottomSheetV2 internally ─── */

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onUploadSheetOpen } = useSheetAnalytics('p2p-dispute-upload-evidence');
  const { onAfterOpen: onEscalateSheetOpen } = useSheetAnalytics('p2p-dispute-escalate-confirm');

  const canEscalate = currentLevel < 4 && dispute.status !== 'resolved' && dispute.status !== 'rejected';
  const currentLevelData = ESCALATION_LEVELS[currentLevel - 1];
  const nextLevelData = currentLevel < 4 ? ESCALATION_LEVELS[currentLevel] : null;

  /* ─── Escalate Handler ─── */
  const handleEscalate = useCallback(() => {
    if (!canEscalate) return;
    setIsEscalating(true);

    setTimeout(() => {
      const nextLevel = currentLevel + 1;
      setCurrentLevel(nextLevel);
      setShowEscalateConfirm(false);
      setIsEscalating(false);
      hapticSuccess();
      actionToast.success(TOAST.P2P.DISPUTE_ESCALATED(nextLevel));

      // Simulate system message
      const time = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' });
      const nextData = ESCALATION_LEVELS[nextLevel - 1];
      setMessages(prev => [...prev, {
        sender: 'support' as const,
        text: `Khiếu nại đã được chuyển lên Cấp ${nextLevel} (${nextData.labelVi}). ${nextData.description}. Thời gian xử lý dự kiến: ${nextData.avgTime}.`,
        time,
      }]);
    }, 1200);
  }, [canEscalate, currentLevel, hapticSuccess, actionToast]);

  const handleSendMessage = () => {
    const text = supportMsg.trim();
    if (!text) return;
    const newMsg = { sender: 'user' as const, text, time: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, newMsg]);
    setSupportMsg('');
    actionToast.success(TOAST.P2P.MESSAGE_SENT, { haptic: 'selection' });
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'support' as const,
        text: 'Cảm ơn bạn đã cung cấp thêm thông tin. Chúng tôi đang tiếp tục xem xét.',
        time: new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 3000);
  };

  const handleUploadProof = () => {
    const newFile = `proof_${Date.now()}.jpg`;
    setUploadedFiles(prev => [...prev, newFile]);
    setShowUpload(false);
    actionToast.success(TOAST.P2P.PROOF_UPLOADED, { haptic: 'success' });
  };

  return (
    <PageLayout>
      <Header title="Chi tiết khiếu nại" subtitle="Tranh chấp · P2P" back />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4 pb-6">
        {/* Status Banner */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${statusInfo.color}10`, border: `1px solid ${statusInfo.color}25` }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: `${statusInfo.color}15` }}>
            <StatusIcon size={24} color={statusInfo.color} />
          </div>
          <div className="flex-1">
            <p style={{ color: statusInfo.color, fontSize: φ.base, fontWeight: 700 }}>{statusInfo.label}</p>
            <p style={{ color: c.text2, fontSize: φ.xs }}>Đơn hàng #{dispute.orderNumber}</p>
          </div>
        </div>

        {/* ═══ 4-Level Escalation Progress ═══ */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              <Shield size={14} className="inline mr-1.5" />Cấp độ xử lý
            </h3>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ background: `${currentLevelData.color}15`, color: currentLevelData.color, fontSize: 10, fontWeight: 700 }}
            >
              Cấp {currentLevel}/4
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="flex items-center gap-1 mb-4">
            {ESCALATION_LEVELS.map((level, i) => {
              const isActive = i + 1 === currentLevel;
              const isCompleted = i + 1 < currentLevel;
              const isPending = i + 1 > currentLevel;
              const LevelIcon = level.icon;

              return (
                <div key={level.level} className="flex items-center" style={{ flex: i < 3 ? 1 : undefined }}>
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isPending ? 0.4 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: isActive ? level.gradient
                          : isCompleted ? `${level.color}15`
                          : c.surface2,
                        border: isActive ? 'none' : `1.5px solid ${isCompleted ? level.color : c.borderSolid}`,
                        minWidth: 36, minHeight: 36,
                      }}
                    >
                      {isCompleted
                        ? <CheckCircle size={14} color={level.color} />
                        : <LevelIcon size={14} color={isActive ? '#fff' : isPending ? c.text3 : level.color} />}
                    </div>
                    <span style={{
                      color: isActive ? level.color : isPending ? c.text3 : c.text2,
                      fontSize: 8, fontWeight: isActive ? 700 : 500,
                      textAlign: 'center', maxWidth: 56,
                    }}>
                      {level.labelVi}
                    </span>
                  </motion.div>
                  {i < 3 && (
                    <div
                      className="flex-1 h-0.5 mx-1"
                      style={{
                        background: isCompleted ? level.color : c.borderSolid,
                        opacity: isPending ? 0.3 : isCompleted ? 0.5 : 1,
                        marginBottom: 18,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Level Detail */}
          <div
            className="rounded-xl p-3"
            style={{ background: `${currentLevelData.color}08`, border: `1px solid ${currentLevelData.color}15` }}
          >
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: currentLevelData.gradient }}
              >
                <currentLevelData.icon size={14} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                  Cấp {currentLevel}: {currentLevelData.labelVi}
                </p>
                <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.5, marginTop: 2 }}>
                  {currentLevelData.description}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock size={10} color={c.text3} />
                    <span style={{ color: c.text3, fontSize: 10 }}>
                      Dự kiến: {currentLevelData.avgTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Escalate Button */}
          {canEscalate && nextLevelData && (
            <button
              onClick={() => { setShowEscalateConfirm(true); hapticSelection(); }}
              className="w-full flex items-center justify-between mt-3 px-3 py-3 rounded-xl"
              style={{
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
                minHeight: 48,
              }}
            >
              <div className="flex items-center gap-2">
                <ArrowUp size={14} color="#F59E0B" />
                <span style={{ color: '#D97706', fontSize: φ.sm, fontWeight: 600 }}>
                  Chuyển lên Cấp {currentLevel + 1}: {nextLevelData.labelVi}
                </span>
              </div>
              <ChevronRight size={14} color="#F59E0B" />
            </button>
          )}
        </TrCard>

        {/* Dispute Info */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 8 }}>Lý do khiếu nại</h3>
          <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{dispute.reason}</p>
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <h4 style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>Mô tả chi tiết</h4>
            <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{dispute.description}</p>
          </div>
        </TrCard>

        {/* Evidence */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
              Bằng chứng ({uploadedFiles.length})
            </h3>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', minHeight: 32 }}>
              <Upload size={12} /> Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="w-20 h-20 rounded-xl flex items-center justify-center relative"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <Image size={24} color={c.text3} />
                <span className="absolute bottom-1 left-1 right-1 text-center truncate"
                  style={{ color: c.text3, fontSize: 8 }}>{file}</span>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Timeline */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>Tiến trình</h3>
          <div className="flex flex-col gap-0">
            {dispute.timeline.map((event, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: i === dispute.timeline.length - 1 ? '#3B82F6' : '#10B981', border: `2px solid ${i === dispute.timeline.length - 1 ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}` }} />
                  {i < dispute.timeline.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[24px]" style={{ background: c.borderSolid }} />
                  )}
                </div>
                <div className="pb-4">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{event.event}</p>
                  {event.detail && <p style={{ color: c.text3, fontSize: φ.xs }}>{event.detail}</p>}
                  <p style={{ color: c.text3, fontSize: 10, marginTop: 2 }}>{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </TrCard>

        {/* Support Chat */}
        <TrCard overflow>
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: c.surface, borderBottom: `1px solid ${c.divider}` }}>
            <MessageCircle size={φIcon.sm} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Chat với hỗ trợ</span>
            <span
              className="ml-auto px-1.5 py-0.5 rounded"
              style={{ background: `${currentLevelData.color}15`, color: currentLevelData.color, fontSize: 9, fontWeight: 600 }}
            >
              Cấp {currentLevel}
            </span>
          </div>
          <div className="px-4 py-3 flex flex-col gap-3 max-h-64 overflow-y-auto" style={{ background: c.bg }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="rounded-2xl px-3 py-2 max-w-[80%]"
                  style={{
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #3B82F6, #1d4ed8)' : c.surface2,
                    borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  }}>
                  {msg.sender === 'support' && (
                    <p style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                      <Shield size={8} className="inline mr-1" />Hỗ trợ VitTrade
                    </p>
                  )}
                  <p style={{ color: msg.sender === 'user' ? '#fff' : c.text1, fontSize: φ.sm, lineHeight: 1.5 }}>{msg.text}</p>
                  <p style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : c.text3, fontSize: 9, marginTop: 2, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: c.surface, borderTop: `1px solid ${c.divider}` }}>
            <input value={supportMsg} onChange={e => setSupportMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Nhập tin nhắn cho hỗ trợ..."
              className="flex-1"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: φ.sm }} />
            <button onClick={handleSendMessage} disabled={!supportMsg.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: supportMsg.trim() ? c.primary : c.surface2, minWidth: 36, minHeight: 36 }}>
              <Send size={16} color={supportMsg.trim() ? '#fff' : c.text3} />
            </button>
          </div>
        </TrCard>

        {/* Resolution (if resolved) */}
        {dispute.resolution && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h3 style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 700, marginBottom: 4 }}>Kết quả giải quyết</h3>
            <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.6 }}>{dispute.resolution}</p>
          </div>
        )}

        {/* ═══ Quick Actions — Evidence & Resolution ═══ */}
        <TrCard className="p-4">
          <h3 style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700, marginBottom: 12 }}>
            <FileText size={14} className="inline mr-1.5" />Hành động
          </h3>
          <div className="flex flex-col gap-2">
            {/* Manage Evidence */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/dispute/evidence/${dispute.id}`);
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl"
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                minHeight: 52,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59,130,246,0.12)' }}>
                  <Upload size={16} color="#3B82F6" />
                </div>
                <div className="text-left">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Quản lý bằng chứng</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Upload & xem tài liệu đã gửi</p>
                </div>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>

            {/* View Resolution — show when resolved */}
            {dispute.status === 'resolved' && (
              <button
                onClick={() => {
                  hapticSelection();
                  navigate(`${prefix}/p2p/dispute/resolution/${dispute.id}`);
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  minHeight: 52,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <ShieldCheck size={16} color="#10B981" />
                  </div>
                  <div className="text-left">
                    <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Xem kết quả giải quyết</p>
                    <p style={{ color: c.text3, fontSize: 10 }}>Chi tiết quyết định & quyền kháng cáo</p>
                  </div>
                </div>
                <ChevronRight size={16} color={c.text3} />
              </button>
            )}

            {/* Back to disputes list */}
            <button
              onClick={() => {
                hapticSelection();
                navigate(`${prefix}/p2p/disputes`);
              }}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                minHeight: 52,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: c.surface2 }}>
                  <Scale size={16} color={c.text2} />
                </div>
                <div className="text-left">
                  <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Danh sách tranh chấp</p>
                  <p style={{ color: c.text3, fontSize: 10 }}>Xem tất cả tranh chấp của bạn</p>
                </div>
              </div>
              <ChevronRight size={16} color={c.text3} />
            </button>
          </div>
        </TrCard>

        {/* Upload Modal → BottomSheetV2 center */}
        <BottomSheetV2
          open={showUpload}
          onClose={() => setShowUpload(false)}
          variant="center"
          title="Tải lên bằng chứng"
          ariaLabel="Tải lên bằng chứng tranh chấp"
          onAfterOpen={onUploadSheetOpen}
        >
          <div className="rounded-2xl p-8 flex flex-col items-center gap-3 mb-4"
            style={{ background: c.surface2, border: `2px dashed ${c.borderSolid}` }}>
            <Upload size={32} color={c.text3} />
            <p style={{ color: c.text2, fontSize: φ.sm }}>Chọn ảnh chụp giao dịch</p>
            <p style={{ color: c.text3, fontSize: φ.xs }}>JPG, PNG tối đa 5MB</p>
          </div>
          <CTAButton onClick={handleUploadProof}>
            Tải lên (Demo)
          </CTAButton>
        </BottomSheetV2>

        {/* ═══ Escalation Confirm Bottom Sheet → BottomSheetV2 ═══ */}
        <BottomSheetV2
          open={showEscalateConfirm && !!nextLevelData}
          onClose={() => !isEscalating && setShowEscalateConfirm(false)}
          variant="bottom"
          title={`Nâng lên ${nextLevelData?.label || ''}`}
          preventClose={isEscalating}
          ariaLabel="Xác nhận nâng cấp tranh chấp"
          onAfterOpen={onEscalateSheetOpen}
        >
          {nextLevelData && (
            <div>
              <div className="flex flex-col items-center gap-3 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: nextLevelData.gradient }}
                >
                  <nextLevelData.icon size={24} color="#fff" />
                </div>
                <h3 style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, textAlign: 'center' }}>
                  Chuyển lên Cấp {currentLevel + 1}
                </h3>
                <p style={{ color: c.text2, fontSize: φ.sm, textAlign: 'center', lineHeight: 1.6 }}>
                  {nextLevelData.description}
                </p>
              </div>

              {/* Info rows */}
              <div className="rounded-xl p-3 mb-4" style={{ background: c.surface2 }}>
                {[
                  { label: 'Cấp hiện tại', value: `Cấp ${currentLevel}: ${currentLevelData.labelVi}` },
                  { label: 'Chuyển đến', value: `Cấp ${currentLevel + 1}: ${nextLevelData.labelVi}`, bold: true },
                  { label: 'Thời gian xử lý', value: nextLevelData.avgTime },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
                    <span style={{ color: c.text3, fontSize: φ.sm }}>{row.label}</span>
                    <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-start gap-2">
                  <Info size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#D97706', fontSize: 11, lineHeight: 1.6 }}>
                    Sau khi chuyển cấp, bạn không thể quay lại cấp thấp hơn.
                    Vui lòng cung cấp đầy đủ bằng chứng để quá trình xử lý nhanh hơn.
                  </p>
                </div>
              </div>

              <CTAButton
                onClick={handleEscalate}
                variant="primary"
                disabled={isEscalating}
              >
                {isEscalating ? 'Đang chuyển cấp...' : `Xác nhận chuyển lên Cấp ${currentLevel + 1}`}
              </CTAButton>

              {!isEscalating && (
                <button
                  onClick={() => setShowEscalateConfirm(false)}
                  className="w-full py-3 mt-2 text-center"
                  style={{ color: c.text2, fontSize: φ.sm }}
                >
                  Hủy
                </button>
              )}
            </div>
          )}
        </BottomSheetV2>
      </div>
    </PageLayout>
  );
}