import React, { useState } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Clock, Lock,
  ChevronDown, ChevronUp, Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CTAButton } from '../ui/CTAButton';
import { BottomSheetV2 } from '../ui/BottomSheetV2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { φ } from '../../utils/golden';
import { hexToRgba } from '../../utils/helpers/string';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
export interface ConfirmSummaryRow {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  color?: string;
}

export interface ConfirmWarning {
  text: string;
  type: 'warning' | 'info' | 'danger';
}

interface P2PConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;

  // Content
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;

  // Summary rows
  summaryRows: ConfirmSummaryRow[];
  totalRow?: ConfirmSummaryRow;

  // Warnings
  warnings?: ConfirmWarning[];

  // Features
  showEscrow?: boolean;
  escrowText?: string;
  showTimeLimit?: boolean;
  timeLimitText?: string;
  showAgreement?: boolean;
  agreementText?: string;

  // CTA
  confirmLabel: string;
  confirmVariant?: 'primary' | 'success' | 'danger';
  cancelLabel?: string;

  /** Analytics callback — fires after open animation completes */
  onAfterOpen?: () => void;
}

/* ═══════════════════════════════════════════════════════════
   P2P Confirmation Modal
   Enterprise-grade confirmation with multi-layer security UX
   ═══════════════════════════════════════════════════════════ */
export function P2PConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  subtitle,
  icon: IconComp = Shield,
  iconColor = '#3B82F6',
  summaryRows,
  totalRow,
  warnings = [],
  showEscrow = false,
  escrowText,
  showTimeLimit = false,
  timeLimitText,
  showAgreement = true,
  agreementText = 'Tôi xác nhận thông tin chính xác và đồng ý với Điều khoản giao dịch P2P',
  confirmLabel,
  confirmVariant = 'primary',
  cancelLabel = 'Hủy',
  onAfterOpen,
}: P2PConfirmationModalProps) {
  const c = useThemeColors();
  const { hapticSelection, hapticSuccess } = useHaptic();
  const [agreed, setAgreed] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const warningStyles = {
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#D97706', icon: AlertTriangle },
    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#3B82F6', icon: Shield },
    danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#EF4444', icon: AlertTriangle },
  };

  const canConfirm = showAgreement ? agreed && !isLoading : !isLoading;

  /* ─── Custom header with icon + title ─── */
  const customHeader = (
    <div className="flex items-center gap-3 mb-4 px-5 shrink-0">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3, type: 'spring', stiffness: 200 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: hexToRgba(iconColor, 12) }}
      >
        <IconComp size={22} color={iconColor} />
      </motion.div>
      <div className="flex-1 min-w-0">
        <h2 style={{ color: c.text1, fontSize: φ.md, fontWeight: 700 }}>{title}</h2>
        {subtitle && (
          <p style={{ color: c.text2, fontSize: φ.xs, marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <BottomSheetV2
      open={isOpen}
      onClose={onClose}
      maxHeight="88vh"
      customHeader={customHeader}
      preventClose={isLoading}
      ariaLabel={title}
      onAfterOpen={onAfterOpen}
    >

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <Fingerprint size={14} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                  Xác minh bảo mật · Mã hóa đầu cuối · Escrow bảo vệ
                </span>
              </motion.div>

              {/* Summary Section */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <button
                  onClick={() => { setShowDetails(!showDetails); hapticSelection(); }}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                    Chi tiết giao dịch
                  </span>
                  {showDetails ? (
                    <ChevronUp size={14} color={c.text3} />
                  ) : (
                    <ChevronDown size={14} color={c.text3} />
                  )}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="rounded-2xl overflow-hidden mb-4"
                        style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
                      >
                        {summaryRows.map((row, i) => (
                          <div
                            key={row.label}
                            className="flex items-center justify-between px-4 py-2.5"
                            style={{
                              borderBottom: i < summaryRows.length - 1 ? `1px solid ${c.divider}` : 'none',
                            }}
                          >
                            <span style={{ color: c.text3, fontSize: φ.xs }}>{row.label}</span>
                            <span style={{
                              color: row.color || (row.highlight ? c.text1 : c.text2),
                              fontSize: row.highlight ? φ.sm : φ.xs,
                              fontWeight: row.highlight ? 700 : 500,
                              fontFamily: row.mono ? 'monospace' : 'inherit',
                            }}>
                              {row.value}
                            </span>
                          </div>
                        ))}

                        {/* Total Row */}
                        {totalRow && (
                          <div
                            className="flex items-center justify-between px-4 py-3"
                            style={{
                              borderTop: `1.5px solid ${hexToRgba(totalRow.color || iconColor, 30)}`,
                              background: hexToRgba(totalRow.color || iconColor, 8),
                            }}
                          >
                            <span style={{
                              color: totalRow.color || iconColor,
                              fontSize: φ.sm,
                              fontWeight: 700,
                            }}>
                              {totalRow.label}
                            </span>
                            <span style={{
                              color: totalRow.color || iconColor,
                              fontSize: φ.base,
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}>
                              {totalRow.value}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Escrow Protection */}
              {showEscrow && escrowText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-2.5 mb-3 px-3.5 py-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                  <Lock size={14} color="#10B981" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#10B981', fontSize: φ.xs, lineHeight: 1.6 }}>{escrowText}</p>
                </motion.div>
              )}

              {/* Time Limit */}
              {showTimeLimit && timeLimitText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-start gap-2.5 mb-3 px-3.5 py-3 rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
                >
                  <Clock size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
                  <p style={{ color: '#3B82F6', fontSize: φ.xs, lineHeight: 1.6 }}>{timeLimitText}</p>
                </motion.div>
              )}

              {/* Warnings */}
              {warnings.map((w, i) => {
                const ws = warningStyles[w.type];
                const WIcon = ws.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-start gap-2.5 mb-3 px-3.5 py-3 rounded-xl"
                    style={{ background: ws.bg, border: `1px solid ${ws.border}` }}
                  >
                    <WIcon size={13} color={ws.color} className="shrink-0 mt-0.5" />
                    <p style={{ color: ws.color, fontSize: 11, lineHeight: 1.6 }}>{w.text}</p>
                  </motion.div>
                );
              })}

              {/* Agreement Checkbox */}
              {showAgreement && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => { setAgreed(!agreed); hapticSelection(); }}
                  className="w-full flex items-start gap-3 mb-5 px-1 py-2 text-left"
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: agreed ? '#3B82F6' : 'transparent',
                      border: `2px solid ${agreed ? '#3B82F6' : c.borderSolid}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <AnimatePresence>
                      {agreed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <CheckCircle size={12} color="#fff" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span style={{ color: c.text2, fontSize: φ.xs, lineHeight: 1.6 }}>
                    {agreementText}
                  </span>
                </motion.button>
              )}

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex gap-3"
              >
                <CTAButton
                  onClick={onClose}
                  variant="ghost"
                  bg={c.surface2}
                  textColor={c.text2}
                  fullWidth={false}
                  className="flex-1"
                  style={{ border: `1px solid ${c.borderSolid}`, boxShadow: 'none' }}
                >
                  {cancelLabel}
                </CTAButton>
                <CTAButton
                  onClick={() => {
                    if (canConfirm) {
                      hapticSuccess();
                      onConfirm();
                    }
                  }}
                  variant={confirmVariant}
                  fullWidth={false}
                  className="flex-1"
                  disabled={!canConfirm}
                  loading={isLoading}
                >
                  {confirmLabel}
                </CTAButton>
              </motion.div>
    </BottomSheetV2>
  );
}