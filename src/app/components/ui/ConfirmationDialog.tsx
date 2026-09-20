import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { BottomSheetV2 } from './BottomSheetV2';

/**
 * ══════════════════════════════════════════════════════════
 *  ConfirmationDialog — Shared Enterprise Confirmation Modal
 * ══════════════════════════════════════════════════════════
 *  Now powered by BottomSheetV2 (variant='center') for
 *  consistent animation, scroll lock, focus trap, and a11y.
 *
 *  Variants:
 *  - danger  (red)   — delete, remove, report
 *  - warning (amber) — block, disable, suspend
 *  - success (green) — unblock, enable, restore
 *  - info    (blue)  — general confirmation
 */

export type ConfirmationVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmationDialogProps {
  /** Controls visibility */
  open: boolean;
  /** Called when dialog should close */
  onClose: () => void;
  /** Called when confirm button is clicked */
  onConfirm: () => void;

  /** Visual variant */
  variant?: ConfirmationVariant;

  /** Icon to display at top */
  icon: React.ReactNode;
  /** Dialog title */
  title: string;
  /** Description text or ReactNode */
  description: React.ReactNode;

  /** Cancel button text (default: 'Huỷ') */
  cancelText?: string;
  /** Confirm button text (default: 'Xác nhận') */
  confirmText?: string;

  /** Close on backdrop tap (default: true) */
  dismissOnBackdrop?: boolean;

  /** Additional content below description */
  children?: React.ReactNode;

  /** Analytics callback — fires after open animation completes */
  onAfterOpen?: () => void;
}

const VARIANT_COLORS: Record<ConfirmationVariant, {
  bg: string;
  border: string;
  btnBg: string;
  btnBorder: string;
  btnColor: string;
  iconBg: string;
}> = {
  danger: {
    bg: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    btnBg: 'linear-gradient(135deg, #EF4444, #dc2626)',
    btnBorder: 'none',
    btnColor: '#fff',
    iconBg: 'rgba(239,68,68,0.1)',
  },
  warning: {
    bg: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.2)',
    btnBg: 'linear-gradient(135deg, #F59E0B, #d97706)',
    btnBorder: 'none',
    btnColor: '#fff',
    iconBg: 'rgba(245,158,11,0.1)',
  },
  success: {
    bg: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    btnBg: 'linear-gradient(135deg, #10B981, #059669)',
    btnBorder: 'none',
    btnColor: '#fff',
    iconBg: 'rgba(16,185,129,0.12)',
  },
  info: {
    bg: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.2)',
    btnBg: 'linear-gradient(135deg, #3B82F6, #1d4ed8)',
    btnBorder: 'none',
    btnColor: '#fff',
    iconBg: 'rgba(59,130,246,0.1)',
  },
};

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  variant = 'danger',
  icon,
  title,
  description,
  cancelText = 'Huỷ',
  confirmText = 'Xác nhận',
  dismissOnBackdrop = true,
  children,
  onAfterOpen,
}: ConfirmationDialogProps) {
  const c = useThemeColors();
  const colors = VARIANT_COLORS[variant];

  return (
    <BottomSheetV2
      open={open}
      onClose={onClose}
      variant="center"
      showHandle={false}
      showCloseButton={false}
      ariaLabel={title}
      preventClose={!dismissOnBackdrop}
      onAfterOpen={onAfterOpen}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
        style={{ background: colors.iconBg, border: colors.border }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="text-center"
        style={{ color: c.text1, fontSize: 17, fontWeight: 700, marginBottom: 8 }}
      >
        {title}
      </h3>

      {/* Description */}
      <div
        className="text-center"
        style={{ color: c.text2, fontSize: 13, lineHeight: 1.6, marginBottom: children ? 12 : 20 }}
      >
        {description}
      </div>

      {/* Optional extra content */}
      {children && (
        <div className="mb-5">
          {children}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{ background: c.surface2, color: c.text2, border: `1px solid ${c.borderSolid}` }}
        >
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{ background: colors.btnBg, color: colors.btnColor }}
        >
          {confirmText}
        </button>
      </div>
    </BottomSheetV2>
  );
}
