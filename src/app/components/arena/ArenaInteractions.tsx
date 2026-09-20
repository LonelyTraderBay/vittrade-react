/**
 * ══════════════════════════════════════════════════════════
 *  Arena Interaction Sheets — Enterprise-grade overlays
 * ══════════════════════════════════════════════════════════
 *  1) DisputeSheet — tranh chấp kết quả (khác Report vi phạm)
 *  2) LeaveChallengeSheet — rời challenge + refund preview
 *  3) EvidenceUploadSheet — nộp bằng chứng với preview
 *  4) ChatSafetyBanner — cảnh báo link nguy hiểm in chat
 *  5) MessageReportSheet — báo cáo tin nhắn cụ thể
 *
 *  Tone: rõ ràng, chuyên nghiệp, không hù dọa.
 *  Tất cả sheet có preview + confirm pattern (Safety-by-design).
 */

import React, { useState } from 'react';
import {
  X, AlertTriangle, Shield, Info, ChevronRight,
  Camera, Image, Link2, Video, FileText, Upload,
  CheckCircle2, Clock, Flag, ExternalLink, MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { TOAST } from '../../data/toastMessages';
import { φ } from '../../utils/golden';
import { fmtPoints } from '../../data/arenaData';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════
   1) DISPUTE SHEET — Tranh chấp kết quả
   ═══════════════════════════════════════════ */

const DISPUTE_REASONS = [
  { id: 'wrong_result', label: 'Kết quả không chính xác', desc: 'Dữ liệu nguồn hoặc cách tính bị sai' },
  { id: 'wrong_winner', label: 'Người thắng sai', desc: 'Kết quả đúng nhưng xác định người thắng sai' },
  { id: 'evidence_fraud', label: 'Bằng chứng giả mạo', desc: 'Bằng chứng bị chỉnh sửa hoặc không hợp lệ' },
  { id: 'rule_violation', label: 'Vi phạm luật chơi', desc: 'Bên thắng vi phạm luật nhưng vẫn được công nhận' },
  { id: 'void_condition', label: 'Đáng lẽ phải void', desc: 'Điều kiện void đã xảy ra nhưng challenge không bị void' },
  { id: 'other', label: 'Lý do khác', desc: 'Mô tả chi tiết bên dưới' },
] as const;

interface DisputeSheetProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  challengeId: string;
  prizePool: number;
  currentResult?: string;
}

export function DisputeSheet({ open, onClose, challengeTitle, challengeId, prizePool, currentResult }: DisputeSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [step, setStep] = useState<'reason' | 'detail' | 'preview'>('reason');
  const [confirmed, setConfirmed] = useState(false);

  const canProceedToDetail = selectedReason !== null;
  const canProceedToPreview = detail.trim().length >= 20;
  const canSubmit = confirmed;

  const selectedReasonObj = DISPUTE_REASONS.find(r => r.id === selectedReason);

  const handleSubmit = () => {
    hapticSuccess();
    actionToast.success(TOAST.ARENA.DISPUTE_SUBMITTED);
    setSelectedReason(null);
    setDetail('');
    setStep('reason');
    setConfirmed(false);
    onClose();
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetail('');
    setStep('reason');
    setConfirmed(false);
    onClose();
  };

  return (
    <BottomSheetV2 open={open} onClose={handleClose} title="Tranh chấp kết quả">
        {/* Step indicator */}
        <div className="flex gap-1.5 mb-3">
          {(['reason', 'detail', 'preview'] as const).map((s, i) => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{
              background: step === s ? '#EF4444' : i < ['reason', 'detail', 'preview'].indexOf(step) ? '#EF4444' : c.chipBg,
              opacity: step === s ? 1 : i < ['reason', 'detail', 'preview'].indexOf(step) ? 0.5 : 0.3,
            }} />
          ))}
        </div>

        <div className="px-5 pb-8">
          {/* ─── Step 1: Choose Reason ─── */}
          {step === 'reason' && (
            <div className="flex flex-col gap-3">
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 4 }}>
                Tranh chấp khác với báo cáo vi phạm. Dùng khi bạn tin rằng <strong style={{ color: c.text1 }}>kết quả bị sai</strong>, không phải khi bị lừa đảo.
              </p>

              {/* Challenge info */}
              <TrCard className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }} className="truncate">{challengeTitle}</p>
                    <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>#{challengeId.toUpperCase()}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p style={{ color: '#F59E0B', fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace' }}>{fmtPoints(prizePool)} pts</p>
                    {currentResult && <p style={{ color: c.text3, fontSize: 10 }}>Kết quả: {currentResult}</p>}
                  </div>
                </div>
              </TrCard>

              {/* Reason selection */}
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginTop: 4 }}>Chọn lý do tranh chấp</p>
              {DISPUTE_REASONS.map(r => {
                const active = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedReason(r.id); hapticSelection(); }}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left active:opacity-70 w-full"
                    style={{
                      background: active ? 'rgba(239,68,68,0.06)' : c.surface2,
                      border: active ? '1.5px solid rgba(239,68,68,0.3)' : `1.5px solid transparent`,
                      minHeight: 52,
                    }}
                  >
                    <div className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center" style={{
                      border: active ? '2px solid #EF4444' : `2px solid ${c.borderSolid}`,
                      background: active ? '#EF4444' : 'transparent',
                    }}>
                      {active && <CheckCircle2 size={12} color="#fff" />}
                    </div>
                    <div>
                      <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, marginBottom: 2 }}>{r.label}</p>
                      <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>{r.desc}</p>
                    </div>
                  </button>
                );
              })}

              <CTAButton onClick={() => { setStep('detail'); hapticSelection(); }} disabled={!canProceedToDetail}>
                Tiếp tục
              </CTAButton>
            </div>
          )}

          {/* ─── Step 2: Detail ─── */}
          {step === 'detail' && (
            <div className="flex flex-col gap-3">
              <button onClick={() => setStep('reason')} className="flex items-center gap-1 active:opacity-70 self-start" style={{ color: c.text3, fontSize: φ.xs, minHeight: 28 }}>
                <ChevronRight size={12} className="rotate-180" /> Quay lại
              </button>

              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Mô tả chi tiết</p>
              <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
                Giải thích vì sao bạn cho rằng kết quả không đúng. Cung cấp càng nhiều thông tin càng tốt (ít nhất 20 ký tự).
              </p>

              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="VD: Giá BTC tại thời điểm kết thúc theo CoinGecko là $68,421 nhưng kết quả ghi $67,200..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl resize-none"
                style={{
                  background: c.searchBg, border: `1.5px solid ${c.searchBorder}`,
                  color: c.text1, fontSize: φ.xs, lineHeight: 1.6, outline: 'none',
                }}
              />
              <p style={{ color: detail.trim().length >= 20 ? '#10B981' : c.text3, fontSize: 10 }}>
                {detail.trim().length}/20 ký tự tối thiểu
              </p>

              <CTAButton onClick={() => { setStep('preview'); hapticSelection(); }} disabled={!canProceedToPreview}>
                Xem lại trước khi gửi
              </CTAButton>
            </div>
          )}

          {/* ─── Step 3: Preview + Confirm ─── */}
          {step === 'preview' && (
            <div className="flex flex-col gap-3">
              <button onClick={() => setStep('detail')} className="flex items-center gap-1 active:opacity-70 self-start" style={{ color: c.text3, fontSize: φ.xs, minHeight: 28 }}>
                <ChevronRight size={12} className="rotate-180" /> Quay lại
              </button>

              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Xác nhận tranh chấp</p>

              {/* Preview card */}
              <TrCard className="p-4" accentBorder="rgba(239,68,68,0.2)">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Challenge</span>
                    <span className="text-right max-w-[200px] truncate" style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{challengeTitle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: c.text3, fontSize: φ.xs }}>Lý do</span>
                    <span style={{ color: '#EF4444', fontSize: φ.xs, fontWeight: 600 }}>{selectedReasonObj?.label}</span>
                  </div>
                  <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }}>
                    <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Chi tiết</p>
                    <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5 }}>{detail}</p>
                  </div>
                </div>
              </TrCard>

              {/* What happens next */}
              <TrCard className="p-3 flex items-start gap-2" accentBorder="rgba(245,158,11,0.2)">
                <Info size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
                <div>
                  <p style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>Khi gửi tranh chấp:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'Điểm prize pool sẽ tạm giữ cho đến khi giải quyết xong',
                      'Đội ngũ kiểm duyệt xem xét trong 48 giờ',
                      'Bạn sẽ nhận thông báo khi có kết luận',
                      'Nếu tranh chấp hợp lệ: kết quả sẽ được sửa lại',
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ background: '#F59E0B' }} />
                        <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.4 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TrCard>

              {/* Confirm checkbox */}
              <button
                onClick={() => { setConfirmed(!confirmed); hapticSelection(); }}
                className="flex items-start gap-3 w-full text-left active:opacity-70"
                style={{ minHeight: 44 }}
              >
                <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center" style={{
                  background: confirmed ? '#EF4444' : 'transparent',
                  border: confirmed ? '2px solid #EF4444' : `2px solid ${c.borderSolid}`,
                }}>
                  {confirmed && <CheckCircle2 size={14} color="#fff" />}
                </div>
                <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                  Tôi xác nhận thông tin trên là chính xác. Tôi hiểu rằng tranh chấp vô căn cứ có thể ảnh hưởng đến điểm Trust Score.
                </span>
              </button>

              <CTAButton onClick={handleSubmit} disabled={!canSubmit}>
                <div className="flex items-center gap-2 justify-center">
                  <AlertTriangle size={16} /> Gửi tranh chấp
                </div>
              </CTAButton>
            </div>
          )}
        </div>
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   2) LEAVE CHALLENGE SHEET — Rời + Refund Preview
   ═══════════════════════════════════════════ */

interface LeaveChallengeSheetProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  entryPoints: number;
  isBeforeDeadline: boolean;
  deadline?: string;
}

export function LeaveChallengeSheet({ open, onClose, challengeTitle, entryPoints, isBeforeDeadline, deadline }: LeaveChallengeSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [confirmed, setConfirmed] = useState(false);

  const refundPercent = isBeforeDeadline ? 100 : 50;
  const refundAmount = Math.floor(entryPoints * refundPercent / 100);
  const lostAmount = entryPoints - refundAmount;

  const handleLeave = () => {
    hapticSuccess();
    actionToast.success(isBeforeDeadline ? TOAST.ARENA.CHALLENGE_LEFT_FULL_REFUND : TOAST.ARENA.CHALLENGE_LEFT_PARTIAL_REFUND);
    setConfirmed(false);
    onClose();
  };

  const handleClose = () => { setConfirmed(false); onClose(); };

  return (
    <BottomSheetV2 open={open} onClose={handleClose} title="Rời challenge">
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 12 }}>
          Bạn sắp rời khỏi <strong style={{ color: c.text1 }}>{challengeTitle}</strong>. Hành động này không thể hoàn tác.
        </p>

        {/* Refund breakdown */}
        <TrCard className="p-4 mb-3">
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 12 }}>Thông tin hoàn điểm</p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Entry Points đã trả</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtPoints(entryPoints)} pts
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Tỷ lệ hoàn</span>
              <span style={{ color: isBeforeDeadline ? '#10B981' : '#F59E0B', fontSize: φ.sm, fontWeight: 700 }}>
                {refundPercent}%
              </span>
            </div>
            <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }} className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Số điểm nhận lại</span>
              <span style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                +{fmtPoints(refundAmount)} pts
              </span>
            </div>
            {lostAmount > 0 && (
              <div className="flex items-center justify-between">
                <span style={{ color: c.text3, fontSize: φ.xs }}>Mất (phí rời muộn)</span>
                <span style={{ color: '#EF4444', fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                  -{fmtPoints(lostAmount)} pts
                </span>
              </div>
            )}
          </div>
        </TrCard>

        {/* Policy info */}
        <TrCard className="p-3 flex items-start gap-2 mb-4" accentBorder={isBeforeDeadline ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}>
          <Info size={13} color={isBeforeDeadline ? '#10B981' : '#F59E0B'} className="shrink-0 mt-0.5" />
          <div>
            <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
              {isBeforeDeadline
                ? 'Bạn đang rời trước deadline — hoàn 100% entry points.'
                : `Deadline đã qua${deadline ? ` (${deadline})` : ''}. Chỉ hoàn 50% entry points theo chính sách.`
              }
            </p>
          </div>
        </TrCard>

        {/* Confirm checkbox */}
        <button
          onClick={() => { setConfirmed(!confirmed); hapticSelection(); }}
          className="flex items-start gap-3 w-full text-left active:opacity-70 mb-4"
          style={{ minHeight: 44 }}
        >
          <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center" style={{
            background: confirmed ? '#F59E0B' : 'transparent',
            border: confirmed ? '2px solid #F59E0B' : `2px solid ${c.borderSolid}`,
          }}>
            {confirmed && <CheckCircle2 size={14} color="#fff" />}
          </div>
          <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
            Tôi hiểu rằng sau khi rời, tôi không thể tham gia lại challenge này.
          </span>
        </button>

        <div className="flex gap-3">
          <button onClick={handleClose} className="flex-1 py-3 rounded-xl active:opacity-70"
            style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 48 }}>
            Hủy
          </button>
          <div className="flex-1">
            <CTAButton onClick={handleLeave} disabled={!confirmed}>
              Rời challenge
            </CTAButton>
          </div>
        </div>
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   3) EVIDENCE UPLOAD SHEET — Nộp bằng chứng
   ═══════════════════════════════════════════ */

type EvidenceType = 'screenshot' | 'photo' | 'video' | 'link';

interface EvidenceItem {
  id: string;
  type: EvidenceType;
  label: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
}

const EVIDENCE_TYPES: { id: EvidenceType; label: string; icon: typeof Camera; desc: string }[] = [
  { id: 'screenshot', label: 'Ảnh chụp màn hình', icon: Image, desc: 'Screenshot kết quả từ nguồn chính thức' },
  { id: 'photo', label: 'Ảnh chụp', icon: Camera, desc: 'Ảnh chụp bằng camera (bàn phím, sự kiện…)' },
  { id: 'video', label: 'Video', icon: Video, desc: 'Video ngắn làm bằng chứng (tối đa 30 giây)' },
  { id: 'link', label: 'Đường link', icon: Link2, desc: 'Link đến nguồn dữ liệu chính thức' },
];

interface EvidenceUploadSheetProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  requiredTypes?: string[];
}

export function EvidenceUploadSheet({ open, onClose, challengeTitle, requiredTypes }: EvidenceUploadSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [step, setStep] = useState<'select' | 'preview'>('select');

  const simulateUpload = (type: EvidenceType) => {
    hapticSelection();
    const id = `ev_${Date.now()}`;
    const labels: Record<EvidenceType, string> = {
      screenshot: 'Screenshot_' + new Date().toISOString().slice(5, 16).replace(/[-T:]/g, ''),
      photo: 'Photo_' + new Date().toISOString().slice(5, 16).replace(/[-T:]/g, ''),
      video: 'Video_' + new Date().toISOString().slice(5, 16).replace(/[-T:]/g, ''),
      link: linkInput || 'Link bằng chứng',
    };
    const newItem: EvidenceItem = {
      id,
      type,
      label: labels[type],
      status: 'uploading',
      progress: 0,
    };
    setItems(prev => [...prev, newItem]);

    // Simulate upload progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += Math.random() * 35;
      if (prog >= 100) {
        prog = 100;
        clearInterval(interval);
        setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'uploaded', progress: 100 } : it));
      } else {
        setItems(prev => prev.map(it => it.id === id ? { ...it, progress: Math.min(100, prog) } : it));
      }
    }, 400);

    if (type === 'link') setLinkInput('');
  };

  const removeItem = (id: string) => {
    hapticSelection();
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSubmit = () => {
    hapticSuccess();
    actionToast.success(TOAST.ARENA.EVIDENCE_FILE_ADDED);
    setItems([]);
    setStep('select');
    onClose();
  };

  const handleClose = () => {
    setItems([]);
    setStep('select');
    setLinkInput('');
    onClose();
  };

  const allUploaded = items.length > 0 && items.every(it => it.status === 'uploaded');

  const EVIDENCE_ICONS: Record<EvidenceType, typeof Camera> = { screenshot: Image, photo: Camera, video: Video, link: Link2 };

  return (
    <BottomSheetV2 open={open} onClose={handleClose} title="Nộp bằng chứng">
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 8 }}>
          {challengeTitle}
        </p>

        <div className="px-5 pb-8">
          {step === 'select' && (
            <div className="flex flex-col gap-3">
              {/* File type selection */}
              <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginTop: 4 }}>Chọn loại bằng chứng</p>
              <div className="grid grid-cols-2 gap-2">
                {EVIDENCE_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => t.id === 'link' ? null : simulateUpload(t.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-center active:opacity-70"
                    style={{ background: c.surface2, border: `1px solid ${c.borderSolid}`, minHeight: 80 }}
                  >
                    <t.icon size={20} color="#3B82F6" />
                    <span style={{ color: c.text1, fontSize: 10, fontWeight: 600 }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Link input */}
              <div>
                <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, marginBottom: 4 }}>Hoặc dán link</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2.5 rounded-xl"
                    style={{ background: c.searchBg, border: `1.5px solid ${c.searchBorder}`, color: c.text1, fontSize: φ.xs, outline: 'none', minHeight: 44 }}
                  />
                  <button
                    onClick={() => linkInput.trim() && simulateUpload('link')}
                    disabled={!linkInput.trim()}
                    className="px-4 rounded-xl flex items-center justify-center active:opacity-70"
                    style={{
                      background: linkInput.trim() ? '#3B82F6' : c.surface2,
                      color: linkInput.trim() ? '#fff' : c.text3,
                      fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                      opacity: linkInput.trim() ? 1 : 0.5,
                    }}
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Uploaded items */}
              {items.length > 0 && (
                <div>
                  <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, marginBottom: 8 }}>
                    Đã thêm ({items.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {items.map(item => {
                      const Icon = EVIDENCE_ICONS[item.type];
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.surface2 }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: item.status === 'uploaded' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)' }}>
                            <Icon size={16} color={item.status === 'uploaded' ? '#10B981' : '#3B82F6'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ color: c.text1, fontSize: 10, fontWeight: 600 }} className="truncate">{item.label}</p>
                            {item.status === 'uploading' && (
                              <div className="mt-1.5 h-1.5 rounded-full" style={{ background: c.chipBg }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${item.progress}%`, background: '#3B82F6' }} />
                              </div>
                            )}
                            {item.status === 'uploaded' && (
                              <p style={{ color: '#10B981', fontSize: 9, fontWeight: 600, marginTop: 2 }}>Hoàn tất</p>
                            )}
                          </div>
                          <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-md flex items-center justify-center active:opacity-70" style={{ background: c.chipBg }}>
                            <X size={12} color={c.text3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File size warning */}
              <TrCard className="p-2.5 flex items-start gap-2">
                <Info size={12} color={c.text3} className="shrink-0 mt-0.5" />
                <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.4 }}>
                  Ảnh tối đa 10MB, video tối đa 30 giây. Không chấp nhận file đã chỉnh sửa metadata.
                </p>
              </TrCard>

              <CTAButton onClick={handleSubmit} disabled={!allUploaded}>
                <div className="flex items-center gap-2 justify-center">
                  <Upload size={16} /> Nộp bằng chứng ({items.filter(i => i.status === 'uploaded').length})
                </div>
              </CTAButton>
            </div>
          )}
        </div>
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   4) CHAT SAFETY — URL detection + warning
   ═══════════════════════════════════════════ */

const URL_REGEX = /https?:\/\/[^\s<]+|www\.[^\s<]+/gi;
const SAFE_DOMAINS = ['coingecko.com', 'coinmarketcap.com', 'tradingview.com', 'binance.com'];

export function detectLinksInText(text: string): { hasLinks: boolean; isRisky: boolean; urls: string[] } {
  const urls = text.match(URL_REGEX) || [];
  if (urls.length === 0) return { hasLinks: false, isRisky: false, urls: [] };
  const isRisky = urls.some(url => {
    try {
      const hostname = new URL(url.startsWith('www.') ? `https://${url}` : url).hostname;
      return !SAFE_DOMAINS.some(d => hostname.endsWith(d));
    } catch {
      return true;
    }
  });
  return { hasLinks: true, isRisky, urls };
}

export function ChatSafetyBanner({ type = 'warning' }: { type?: 'warning' | 'info' }) {
  const c = useThemeColors();
  const color = type === 'warning' ? '#F59E0B' : '#3B82F6';
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-xl mx-2 mb-2"
      style={{ background: hexToRgba(color, 8), border: `1px solid ${hexToRgba(color, 15)}` }}>
      <AlertTriangle size={11} color={color} className="shrink-0 mt-0.5" />
      <p style={{ color, fontSize: 9, lineHeight: 1.4, fontWeight: 500 }}>
        {type === 'warning'
          ? 'Tin nhắn chứa link bên ngoài. Không nhấn vào link lạ hoặc chia sẻ thông tin cá nhân.'
          : 'Không chia sẻ link cá nhân, mật khẩu hoặc thông tin nhạy cảm trong chat.'
        }
      </p>
    </div>
  );
}

export function ChatLinkWarningInline() {
  const c = useThemeColors();
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-1 inline-flex"
      style={{ background: 'rgba(245,158,11,0.08)' }}>
      <AlertTriangle size={9} color="#F59E0B" />
      <span style={{ color: '#F59E0B', fontSize: 8, fontWeight: 600 }}>Chứa link — cẩn thận</span>
    </div>
  );
}


/* ═══════════════════════════════════════════
   5) MESSAGE REPORT SHEET
   ═══════════════════════════════════════════ */

const MSG_REPORT_REASONS = [
  'Lừa đảo / scam',
  'Giao dịch ngoài nền tảng',
  'Ngôn ngữ xúc phạm',
  'Spam / quảng cáo',
  'Chia sẻ thông tin nhạy cảm',
  'Khác',
];

interface MessageReportSheetProps {
  open: boolean;
  onClose: () => void;
  messageText: string;
  senderName: string;
}

export function MessageReportSheet({ open, onClose, messageText, senderName }: MessageReportSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleSubmit = () => {
    hapticSuccess();
    actionToast.success(TOAST.ARENA.MESSAGE_REPORTED);
    setSelectedReason(null);
    onClose();
  };

  const handleClose = () => { setSelectedReason(null); onClose(); };

  return (
    <BottomSheetV2 open={open} onClose={handleClose} title="Báo cáo tin nhắn">
        {/* Message preview */}
        <TrCard className="p-3 mb-4">
          <p style={{ color: c.text3, fontSize: 10, marginBottom: 4 }}>Tin nhắn của {senderName}:</p>
          <p style={{ color: c.text1, fontSize: φ.xs, lineHeight: 1.5, fontStyle: 'italic' }} className="line-clamp-3">
            "{messageText}"
          </p>
        </TrCard>

        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginBottom: 8 }}>Lý do báo cáo</p>
        <div className="flex flex-col gap-2 mb-4">
          {MSG_REPORT_REASONS.map(reason => {
            const active = selectedReason === reason;
            return (
              <button
                key={reason}
                onClick={() => { setSelectedReason(reason); hapticSelection(); }}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left active:opacity-70 w-full"
                style={{
                  background: active ? 'rgba(239,68,68,0.06)' : c.surface2,
                  border: active ? '1.5px solid rgba(239,68,68,0.3)' : `1.5px solid transparent`,
                  minHeight: 44,
                }}
              >
                <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center" style={{
                  border: active ? '2px solid #EF4444' : `2px solid ${c.borderSolid}`,
                  background: active ? '#EF4444' : 'transparent',
                }}>
                  {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff' }} />}
                </div>
                <span style={{ color: c.text1, fontSize: φ.xs }}>{reason}</span>
              </button>
            );
          })}
        </div>

        <CTAButton onClick={handleSubmit} disabled={!selectedReason}>
          <div className="flex items-center gap-2 justify-center">
            <Flag size={16} /> Gửi báo cáo
          </div>
        </CTAButton>
    </BottomSheetV2>
  );
}