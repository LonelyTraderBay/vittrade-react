import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, ScanFace, ShieldCheck, X, Loader2 } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ, φRadius } from '../../utils/golden';

/**
 * ══════════════════════════════════════════════════════════
 *  BiometricPrompt — Simulated biometric auth for high-risk actions
 * ══════════════════════════════════════════════════════════
 *
 *  For prototype: simulates Face ID / Touch ID / fingerprint auth.
 *  Shows overlay → scanning animation → success/failure.
 *
 *  High-risk actions requiring biometric (per Guidelines §14.3):
 *  - Withdraw crypto
 *  - Release escrow (P2P)
 *  - Change password / disable 2FA
 *  - Add withdrawal address
 *  - Change P2P payment method
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  const { requestBiometric } = useBiometricPrompt();
 *
 *  const handleWithdraw = async () => {
 *    const success = await requestBiometric('withdraw');
 *    if (success) { // proceed with withdraw }
 *  };
 */

type BiometricType = 'face' | 'fingerprint';
type BiometricState = 'idle' | 'scanning' | 'success' | 'failed';

interface BiometricPromptProps {
  /** Whether the prompt is visible */
  open: boolean;
  /** Type of biometric (auto-detected, but overridable) */
  type?: BiometricType;
  /** Action description (shown to user) */
  actionLabel?: string;
  /** Called with success/failure result */
  onResult: (success: boolean) => void;
  /** Close handler */
  onClose: () => void;
  /** Simulate failure (for testing) */
  simulateFailure?: boolean;
}

/* ─── Scanning animation duration ─── */
const SCAN_DURATION = 1800;
const SUCCESS_DELAY = 600;

export function BiometricPrompt({
  open,
  type = 'face',
  actionLabel = 'Xác nhận hành động',
  onResult,
  onClose,
  simulateFailure = false,
}: BiometricPromptProps) {
  const c = useThemeColors();
  const { hapticSuccess, hapticError, hapticMedium } = useHaptic();
  const [state, setState] = useState<BiometricState>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  // Auto-start scanning when opened
  useEffect(() => {
    if (!open) {
      setState('idle');
      setScanProgress(0);
      return;
    }

    hapticMedium();
    setState('scanning');

    // Animate scan progress
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / SCAN_DURATION);
      setScanProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);

        if (simulateFailure) {
          setState('failed');
          hapticError();
          setTimeout(() => {
            onResult(false);
          }, 1200);
        } else {
          setState('success');
          hapticSuccess();
          setTimeout(() => {
            onResult(true);
          }, SUCCESS_DELAY);
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [open, simulateFailure, hapticMedium, hapticSuccess, hapticError, onResult]);

  if (!open) return null;

  const isFace = type === 'face';
  const BiometricIcon = isFace ? ScanFace : Fingerprint;

  const stateConfig = {
    idle: { ringColor: c.text3, label: 'Chuẩn bị...' },
    scanning: {
      ringColor: '#3B82F6',
      label: isFace ? 'Đang nhận diện khuôn mặt...' : 'Đang quét vân tay...',
    },
    success: { ringColor: '#10B981', label: 'Xác thực thành công' },
    failed: { ringColor: '#EF4444', label: 'Không nhận diện được. Thử lại.' },
  }[state];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (state === 'failed') onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-12 right-5 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        aria-label="Đóng"
      >
        <X size={18} color="rgba(255,255,255,0.6)" />
      </button>

      {/* Biometric icon with animated ring */}
      <div className="relative mb-8">
        {/* Progress ring */}
        <svg width={120} height={120} className="absolute inset-0">
          <circle
            cx={60}
            cy={60}
            r={54}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={3}
          />
          <circle
            cx={60}
            cy={60}
            r={54}
            fill="none"
            stroke={stateConfig.ringColor}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - scanProgress)}`}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
          />
        </svg>

        {/* Icon */}
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center"
          style={{
            background: state === 'success'
              ? 'rgba(16,185,129,0.12)'
              : state === 'failed'
                ? 'rgba(239,68,68,0.12)'
                : 'rgba(59,130,246,0.08)',
            transition: 'background 0.3s ease',
          }}
        >
          {state === 'success' ? (
            <ShieldCheck size={44} color="#10B981" strokeWidth={1.8} />
          ) : state === 'scanning' ? (
            <BiometricIcon
              size={44}
              color="#3B82F6"
              strokeWidth={1.8}
              style={{
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ) : state === 'failed' ? (
            <BiometricIcon size={44} color="#EF4444" strokeWidth={1.8} />
          ) : (
            <BiometricIcon size={44} color={c.text3} strokeWidth={1.8} />
          )}
        </div>
      </div>

      {/* Status text */}
      <p
        style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {isFace ? 'Face ID' : 'Touch ID'}
      </p>

      <p
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: φ.sm,
          textAlign: 'center',
          marginBottom: 24,
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        {actionLabel}
      </p>

      <p
        style={{
          color: stateConfig.ringColor,
          fontSize: φ.sm,
          fontWeight: 600,
          textAlign: 'center',
          transition: 'color 0.3s ease',
        }}
      >
        {stateConfig.label}
      </p>

      {/* Retry button on failure */}
      {state === 'failed' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setState('idle');
            setScanProgress(0);
            // Re-trigger by toggling
            setTimeout(() => setState('scanning'), 100);
          }}
          className="mt-6 px-6 py-3 rounded-2xl font-semibold"
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            fontSize: φ.sm,
          }}
        >
          Thử lại
        </button>
      )}

      {/* Security note */}
      <p
        className="absolute bottom-12"
        style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: φ.xs,
          textAlign: 'center',
        }}
      >
        Dữ liệu sinh trắc học không bao giờ rời khỏi thiết bị
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   useBiometricPrompt — Hook for imperative biometric auth
   ═══════════════════════════════════════════════════════════ */

interface UseBiometricOptions {
  type?: BiometricType;
}

interface BiometricRequest {
  /** Show biometric prompt, returns promise resolving to success */
  requestBiometric: (actionLabel?: string) => Promise<boolean>;
  /** Current prompt state for rendering */
  promptProps: BiometricPromptProps;
}

export function useBiometricPrompt(
  options: UseBiometricOptions = {}
): BiometricRequest {
  const [open, setOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState('Xác nhận hành động');
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const requestBiometric = useCallback((label?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setActionLabel(label ?? 'Xác nhận hành động');
      setOpen(true);
    });
  }, []);

  const handleResult = useCallback((success: boolean) => {
    setOpen(false);
    resolverRef.current?.(success);
    resolverRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  return {
    requestBiometric,
    promptProps: {
      open,
      type: options.type ?? 'face',
      actionLabel,
      onResult: handleResult,
      onClose: handleClose,
    },
  };
}
