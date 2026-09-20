/**
 * ══════════════════════════════════════════════════════════
 *  Arena Enhancements — Important Enterprise Gaps
 * ══════════════════════════════════════════════════════════
 *  6) LockedBalanceBreakdown — Available vs Locked display
 *  7) LiveCountdown — Real-time HH:MM:SS countdown
 *  8) HostActionsPanel — Creator room management
 *  9) NotificationBadge + YourTurnIndicator
 * 10) StepUpAuthSheet — PIN/biometric confirmation placeholder
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Lock, Unlock, Clock, AlertTriangle, Shield, Info,
  ChevronRight, Settings, XCircle, Edit3, Trash2,
  Fingerprint, KeyRound, CheckCircle2, Bell, Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../ui/TrCard';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { TOAST } from '../../data/toastMessages';
import { hexToRgba } from '../../utils/helpers/string';
import { φ } from '../../utils/golden';
import { fmtPoints } from '../../data/arenaData';


/* ═══════════════════════════════════════════
   6) LOCKED BALANCE BREAKDOWN
   ═══════════════════════════════════════════ */

interface LockedBalanceBreakdownProps {
  totalBalance: number;
  lockedBalance: number;
  activeChallenges: number;
}

export function LockedBalanceBreakdown({ totalBalance, lockedBalance, activeChallenges }: LockedBalanceBreakdownProps) {
  const c = useThemeColors();
  const availableBalance = totalBalance - lockedBalance;
  const lockedPct = totalBalance > 0 ? Math.round((lockedBalance / totalBalance) * 100) : 0;

  return (
    <div className="mt-3 relative z-10">
      {/* Balance bar */}
      <div className="h-2 rounded-full flex overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-l-full" style={{ width: `${100 - lockedPct}%`, background: '#10B981' }} />
        <div className="h-full rounded-r-full" style={{ width: `${lockedPct}%`, background: '#F59E0B' }} />
      </div>
      {/* Labels */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Unlock size={10} color="#10B981" />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Khả dụng</span>
          <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtPoints(availableBalance)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock size={10} color="#F59E0B" />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Đang khóa</span>
          <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
            {fmtPoints(lockedBalance)}
          </span>
        </div>
      </div>
      {lockedBalance > 0 && (
        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <Info size={10} color="#F59E0B" />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, lineHeight: 1.4 }}>
            {fmtPoints(lockedBalance)} pts đang tham gia {activeChallenges} challenge
          </span>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   7) LIVE COUNTDOWN TIMER
   ═══════════════════════════════════════════ */

interface LiveCountdownProps {
  endTime: string | Date;
  size?: 'sm' | 'md' | 'lg';
  onExpire?: () => void;
}

export function LiveCountdown({ endTime, size = 'md', onExpire }: LiveCountdownProps) {
  const c = useThemeColors();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const target = new Date(endTime).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpireRef.current?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.hours < 1 && !timeLeft.expired;
  const isCritical = timeLeft.hours === 0 && timeLeft.minutes < 10 && !timeLeft.expired;

  const fontSize = size === 'lg' ? φ.md : size === 'md' ? φ.sm : φ.xs;
  const unitSize = size === 'lg' ? 10 : size === 'md' ? 9 : 8;

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1.5">
        <Clock size={size === 'sm' ? 10 : 12} color="#EF4444" />
        <span style={{ color: '#EF4444', fontSize, fontWeight: 700 }}>Đã hết giờ</span>
      </div>
    );
  }

  const color = isCritical ? '#EF4444' : isUrgent ? '#F59E0B' : '#10B981';

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={size === 'sm' ? 10 : 12} color={color} className={isCritical ? 'animate-pulse' : ''} />
      <div className="flex items-baseline gap-0.5" style={{ fontFamily: 'monospace' }}>
        <span style={{ color, fontSize, fontWeight: 700 }}>{pad(timeLeft.hours)}</span>
        <span style={{ color: hexToRgba(color, 80), fontSize: unitSize }}>h</span>
        <span style={{ color, fontSize, unitSize, marginLeft: 1, marginRight: 1 }}>:</span>
        <span style={{ color, fontSize, fontWeight: 700 }}>{pad(timeLeft.minutes)}</span>
        <span style={{ color: hexToRgba(color, 80), fontSize: unitSize }}>m</span>
        <span style={{ color, fontSize, unitSize, marginLeft: 1, marginRight: 1 }}>:</span>
        <span style={{ color, fontSize, fontWeight: 700 }}>{pad(timeLeft.seconds)}</span>
        <span style={{ color: hexToRgba(color, 80), fontSize: unitSize }}>s</span>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   8) HOST ACTIONS PANEL — Creator Room Management
   ═══════════════════════════════════════════ */

interface HostActionsPanelProps {
  isHost: boolean;
  challengeState: string;
  challengeId: string;
  onEdit: () => void;
  onCancel: () => void;
  onVoid: () => void;
}

export function HostActionsPanel({ isHost, challengeState, challengeId, onEdit, onCancel, onVoid }: HostActionsPanelProps) {
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  if (!isHost) return null;

  const canEdit = challengeState === 'open';
  const canCancel = challengeState === 'open' || challengeState === 'full';
  const canVoid = challengeState === 'live' || challengeState === 'pending_result';

  if (!canEdit && !canCancel && !canVoid) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={12} color={c.accent} />
        <span style={{ color: c.accent, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
          Quản lý phòng (Host)
        </span>
      </div>
      <TrCard className="p-3">
        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={() => { hapticSelection(); onEdit(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
              style={{ background: c.accentAlpha08, border: `1px solid ${c.accentAlpha15}`, color: c.accent, fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
            >
              <Edit3 size={13} /> Sửa luật
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => { hapticSelection(); onCancel(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#EF4444', fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
            >
              <Trash2 size={13} /> Hủy phòng
            </button>
          )}
          {canVoid && (
            <button
              onClick={() => { hapticSelection(); onVoid(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:opacity-70"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: φ.xs, fontWeight: 600, minHeight: 44 }}
            >
              <XCircle size={13} /> Void
            </button>
          )}
        </div>
      </TrCard>
    </div>
  );
}

/* Cancel Room Confirmation Sheet */
interface CancelRoomSheetProps {
  open: boolean;
  onClose: () => void;
  challengeTitle: string;
  slotsFilled: number;
  entryPoints: number;
  type: 'cancel' | 'void';
}

export function CancelRoomSheet({ open, onClose, challengeTitle, slotsFilled, entryPoints, type }: CancelRoomSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const actionToast = useActionToast();
  const [confirmed, setConfirmed] = useState(false);

  const refundTotal = slotsFilled * entryPoints;
  const isVoid = type === 'void';

  const handleConfirm = () => {
    hapticSuccess();
    actionToast.success(isVoid
      ? 'Đã void challenge. Tất cả entry points được hoàn trả.'
      : 'Đã hủy phòng. Tất cả entry points được hoàn trả.'
    );
    setConfirmed(false);
    onClose();
  };

  const handleClose = () => { setConfirmed(false); onClose(); };

  return (
    <BottomSheetV2
      open={open}
      onClose={handleClose}
      title={isVoid ? 'Void challenge' : 'Hủy phòng'}
    >
        <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5, marginBottom: 12 }}>
          {isVoid
            ? `Void sẽ hủy kết quả challenge "${challengeTitle}". Tất cả điểm sẽ được hoàn trả cho người tham gia.`
            : `Bạn sắp hủy phòng "${challengeTitle}". Hành động này không thể hoàn tác.`
          }
        </p>

        <TrCard className="p-4 mb-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Người tham gia</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{slotsFilled} người</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Entry points/người</span>
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace' }}>{fmtPoints(entryPoints)} pts</span>
            </div>
            <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: 12 }} className="flex items-center justify-between">
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Tổng hoàn trả</span>
              <span style={{ color: '#10B981', fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                {fmtPoints(refundTotal)} pts
              </span>
            </div>
          </div>
        </TrCard>

        <TrCard className="p-3 flex items-start gap-2 mb-4" accentBorder="rgba(245,158,11,0.2)">
          <Info size={13} color="#F59E0B" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.5 }}>
            {isVoid
              ? 'Void không ảnh hưởng Trust Score nếu có lý do hợp lệ (VD: điều kiện void đã xảy ra).'
              : 'Hủy phòng sẽ hoàn 100% entry points cho tất cả. Trust Score có thể bị ảnh hưởng nếu hủy thường xuyên.'
            }
          </p>
        </TrCard>

        <button
          onClick={() => { setConfirmed(!confirmed); hapticSelection(); }}
          className="flex items-start gap-3 w-full text-left active:opacity-70 mb-4"
          style={{ minHeight: 44 }}
        >
          <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center" style={{
            background: confirmed ? (isVoid ? '#F59E0B' : '#EF4444') : 'transparent',
            border: confirmed ? `2px solid ${isVoid ? '#F59E0B' : '#EF4444'}` : `2px solid ${c.borderSolid}`,
          }}>
            {confirmed && <CheckCircle2 size={14} color="#fff" />}
          </div>
          <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
            Tôi hiểu rằng {isVoid ? 'void' : 'hủy'} sẽ hoàn trả tất cả entry points và không thể hoàn tác.
          </span>
        </button>

        <div className="flex gap-3">
          <button onClick={handleClose} className="flex-1 py-3 rounded-xl active:opacity-70"
            style={{ background: c.chipBg, border: `1px solid ${c.chipBorder}`, color: c.chipText, fontSize: φ.sm, fontWeight: 600, minHeight: 48 }}>
            Quay lại
          </button>
          <div className="flex-1">
            <CTAButton onClick={handleConfirm} disabled={!confirmed}>
              {isVoid ? 'Void challenge' : 'Hủy phòng'}
            </CTAButton>
          </div>
        </div>
    </BottomSheetV2>
  );
}


/* ═══════════════════════════════════════════
   9) NOTIFICATION BADGE + YOUR TURN INDICATOR
   ═══════════════════════════════════════════ */

interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export function NotificationBadge({ count, size = 'sm' }: NotificationBadgeProps) {
  if (count <= 0) return null;
  const sz = size === 'md' ? 20 : 16;
  return (
    <div
      className="absolute flex items-center justify-center rounded-full"
      style={{
        top: -4, right: -4,
        width: sz, height: sz,
        background: '#EF4444',
        boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
        fontSize: count > 9 ? 7 : 8,
        fontWeight: 700,
        color: '#fff',
        lineHeight: 1,
      }}
    >
      {count > 99 ? '99+' : count}
    </div>
  );
}

interface YourTurnIndicatorProps {
  show: boolean;
  label?: string;
}

export function YourTurnIndicator({ show, label = 'Đến lượt bạn' }: YourTurnIndicatorProps) {
  const c = useThemeColors();
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}
    >
      <Zap size={11} color={c.accent} className="animate-pulse" />
      <span style={{ color: c.accent, fontSize: 10, fontWeight: 700 }}>{label}</span>
    </motion.div>
  );
}

/* Notification Bell Button (for headers) */
interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export function NotificationBell({ count, onClick }: NotificationBellProps) {
  const c = useThemeColors();
  return (
    <button
      onClick={onClick}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center active:opacity-70"
      style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
      aria-label={`${count} thông báo`}
    >
      <Bell size={18} color={c.text2} />
      <NotificationBadge count={count} />
    </button>
  );
}


/* ═══════════════════════════════════════════
   10) STEP-UP AUTH SHEET — PIN/Biometric Placeholder
   ═══════════════════════════════════════════ */

interface StepUpAuthSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionLabel: string;
  riskLevel?: 'medium' | 'high';
}

export function StepUpAuthSheet({ open, onClose, onSuccess, actionLabel, riskLevel = 'high' }: StepUpAuthSheetProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const [pin, setPin] = useState('');
  const [authMethod, setAuthMethod] = useState<'pin' | 'biometric'>('pin');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handlePinInput = (digit: string) => {
    if (pin.length >= 6) return;
    hapticSelection();
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 6) {
      // Simulate verification
      setVerifying(true);
      setTimeout(() => {
        setVerifying(false);
        setPin('');
        hapticSuccess();
        onSuccess();
        onClose();
      }, 800);
    }
  };

  const handleDelete = () => {
    hapticSelection();
    setPin(prev => prev.slice(0, -1));
  };

  const handleBiometric = () => {
    hapticSelection();
    setAuthMethod('biometric');
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      hapticSuccess();
      onSuccess();
      onClose();
    }, 1200);
  };

  const handleClose = () => {
    setPin('');
    setError('');
    setVerifying(false);
    setAuthMethod('pin');
    onClose();
  };

  const riskColor = riskLevel === 'high' ? '#EF4444' : '#F59E0B';

  return (
    <BottomSheetV2
      open={open}
      onClose={handleClose}
      title="Xác minh bảo mật"
      preventClose={verifying}
    >
        {/* Risk level indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4" style={{ background: hexToRgba(riskColor, 8), border: `1px solid ${hexToRgba(riskColor, 20)}` }}>
          <AlertTriangle size={12} color={riskColor} />
          <span style={{ color: riskColor, fontSize: φ.xs, fontWeight: 600 }}>
            Hành động {riskLevel === 'high' ? 'quan trọng' : 'nhạy cảm'} — cần xác minh
          </span>
        </div>

        <p style={{ color: c.text3, fontSize: 10, marginBottom: 12 }}>{actionLabel}</p>

        {verifying ? (
          <div className="flex flex-col items-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-t-transparent mb-4"
              style={{ borderColor: `${c.chipActiveBorder}`, borderTopColor: 'transparent' }}
            />
            <p style={{ color: c.text2, fontSize: φ.sm }}>Đang xác minh...</p>
          </div>
        ) : (
          <div className="contents">
            {/* Auth method tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => { setAuthMethod('pin'); hapticSelection(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                style={{
                  background: authMethod === 'pin' ? c.chipActiveBg : c.chipBg,
                  border: `1.5px solid ${authMethod === 'pin' ? c.chipActiveBorder : c.chipBorder}`,
                  color: authMethod === 'pin' ? c.chipActiveText : c.chipText,
                  fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                }}
              >
                <KeyRound size={14} /> Mã PIN
              </button>
              <button
                onClick={handleBiometric}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                style={{
                  background: authMethod === 'biometric' ? c.chipActiveBg : c.chipBg,
                  border: `1.5px solid ${authMethod === 'biometric' ? c.chipActiveBorder : c.chipBorder}`,
                  color: authMethod === 'biometric' ? c.chipActiveText : c.chipText,
                  fontSize: φ.xs, fontWeight: 600, minHeight: 44,
                }}
              >
                <Fingerprint size={14} /> Sinh trắc học
              </button>
            </div>

            {authMethod === 'pin' && (
              <div className="contents">
                {/* PIN dots */}
                <div className="flex justify-center gap-3 mb-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{
                        background: i < pin.length ? c.chipActiveText : c.surface2,
                        border: i < pin.length ? 'none' : `1.5px solid ${c.borderSolid}`,
                        transition: 'all 0.15s',
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <p style={{ color: '#EF4444', fontSize: φ.xs, textAlign: 'center', marginBottom: 8 }}>{error}</p>
                )}

                {/* Numeric keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(key => {
                    if (key === '') return <div key="empty" />;
                    return (
                      <button
                        key={key}
                        onClick={() => key === 'del' ? handleDelete() : handlePinInput(key)}
                        className="flex items-center justify-center rounded-xl active:opacity-60"
                        style={{
                          height: 52,
                          background: key === 'del' ? 'transparent' : c.surface2,
                          color: c.text1,
                          fontSize: key === 'del' ? φ.xs : 20,
                          fontWeight: key === 'del' ? 600 : 500,
                        }}
                      >
                        {key === 'del' ? <X size={18} color={c.text3} /> : key}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
    </BottomSheetV2>
  );
}