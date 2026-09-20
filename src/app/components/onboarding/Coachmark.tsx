/**
 * Coachmark Component
 * 
 * Contextual tooltip shown after onboarding completion.
 * Supports:
 *   - Directional placement (top/bottom)
 *   - Module disclosure badges (§6 boundary compliance)
 *   - Action buttons with optional route
 *   - Auto-dismiss with animation
 *   - Sequence navigation (next/dismiss all)
 * 
 * @module components/onboarding/Coachmark
 * @version 1.0 (Phase 3)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Info, Shield } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  coachmarkService,
  type CoachmarkDef,
  type CoachmarkScreen,
} from '../../services/CoachmarkService';
import { φ, φSpace, φRadius } from '../../utils/golden';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface CoachmarkProps {
  /** Screen context */
  screen: CoachmarkScreen;
  
  /** Optional: callback when action button is pressed */
  onAction?: (route: string) => void;
  
  /** Optional: callback when all tips for this screen are done */
  onComplete?: () => void;
}

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════ */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export function Coachmark({ screen, onAction, onComplete }: CoachmarkProps) {
  const c = useThemeColors();
  const [currentTip, setCurrentTip] = useState<CoachmarkDef | null>(null);
  const [visible, setVisible] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);

  // Load first tip for this screen
  useEffect(() => {
    const tips = coachmarkService.getForScreen(screen);
    if (tips.length > 0) {
      const tip = tips[0];
      setRemainingCount(tips.length);
      const delay = tip.delay || 500;
      const timer = setTimeout(() => {
        setCurrentTip(tip);
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      setCurrentTip(null);
    }
  }, [screen]);

  // Advance to next tip
  const handleNext = useCallback(() => {
    if (!currentTip) return;

    // Mark current as seen
    coachmarkService.markSeen(currentTip.id);

    // Get remaining
    const remaining = coachmarkService.getForScreen(screen);
    if (remaining.length > 0) {
      setRemainingCount(remaining.length);
      setCurrentTip(remaining[0]);
    } else {
      setVisible(false);
      setCurrentTip(null);
      setRemainingCount(0);
      onComplete?.();
    }
  }, [currentTip, screen, onComplete]);

  // Dismiss current tip
  const handleDismiss = useCallback(() => {
    if (!currentTip) return;
    coachmarkService.dismiss(currentTip.id);
    handleNext();
  }, [currentTip, handleNext]);

  // Dismiss all for this screen
  const handleDismissAll = useCallback(() => {
    coachmarkService.dismissAllForScreen(screen);
    setVisible(false);
    setCurrentTip(null);
    setRemainingCount(0);
    onComplete?.();
  }, [screen, onComplete]);

  // Handle action button
  const handleAction = useCallback(() => {
    if (!currentTip?.actionRoute) return;
    coachmarkService.markSeen(currentTip.id);
    onAction?.(currentTip.actionRoute);
    handleNext();
  }, [currentTip, onAction, handleNext]);

  if (!currentTip || !visible) return null;

  const isBottom = currentTip.placement === 'bottom' || currentTip.placement === 'left' || currentTip.placement === 'right';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="coachmark-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: isBottom ? 'flex-end' : 'flex-start',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            padding: φSpace[5],
            paddingBottom: isBottom ? 80 : φSpace[5],
            paddingTop: isBottom ? φSpace[5] : 80,
          }}
          onClick={handleDismiss}
        >
          <motion.div
            key={currentTip.id}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              background: c.surface,
              borderRadius: φRadius.md,
              border: `1px solid ${c.border}`,
              boxShadow: '0 16px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="flex items-start gap-3"
              style={{ padding: `${φSpace[4]}px ${φSpace[4]}px ${φSpace[3]}px` }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: φRadius.xs,
                  background: 'rgba(139,92,246,0.12)',
                  marginTop: 1,
                }}
              >
                <Info size={16} color="#8B5CF6" />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{
                  fontSize: φ.sm,
                  fontWeight: 700,
                  color: c.text1,
                  marginBottom: 4,
                  lineHeight: 1.3,
                }}>
                  {currentTip.title}
                </p>
                <p style={{
                  fontSize: 12,
                  color: c.text2,
                  lineHeight: 1.5,
                }}>
                  {currentTip.description}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: c.surface2,
                }}
              >
                <X size={14} color={c.text3} />
              </button>
            </div>

            {/* Disclosure badge (per Guidelines §6) */}
            {currentTip.disclosure && (
              <div style={{ paddingLeft: φSpace[4], paddingRight: φSpace[4], paddingBottom: φSpace[3] }}>
                <div
                  className="inline-flex items-center gap-1.5"
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  <Shield size={10} color="#F59E0B" />
                  <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600 }}>
                    {currentTip.disclosure}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div
              className="flex items-center gap-2"
              style={{
                padding: `${φSpace[3]}px ${φSpace[4]}px ${φSpace[4]}px`,
                borderTop: `1px solid ${c.divider}`,
              }}
            >
              {/* Remaining count */}
              <p style={{ fontSize: 11, color: c.text3, flex: 1 }}>
                {remainingCount > 1 ? `${remainingCount} mẹo còn lại` : 'Mẹo cuối cùng'}
              </p>

              {/* Dismiss all */}
              {remainingCount > 1 && (
                <button
                  onClick={handleDismissAll}
                  style={{
                    padding: '6px 10px',
                    borderRadius: φRadius.xs,
                    fontSize: 11,
                    color: c.text3,
                    fontWeight: 500,
                  }}
                >
                  Bỏ qua tất cả
                </button>
              )}

              {/* Action or Next button */}
              {currentTip.actionLabel && currentTip.actionRoute ? (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1"
                  style={{
                    padding: '6px 12px',
                    borderRadius: φRadius.xs,
                    background: 'rgba(139,92,246,0.12)',
                    fontSize: 12,
                    color: '#8B5CF6',
                    fontWeight: 600,
                  }}
                >
                  {currentTip.actionLabel}
                  <ChevronRight size={14} color="#8B5CF6" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1"
                  style={{
                    padding: '6px 12px',
                    borderRadius: φRadius.xs,
                    background: 'rgba(139,92,246,0.12)',
                    fontSize: 12,
                    color: '#8B5CF6',
                    fontWeight: 600,
                  }}
                >
                  {remainingCount > 1 ? 'Tiếp theo' : 'Đã hiểu'}
                  {remainingCount > 1 && <ChevronRight size={14} color="#8B5CF6" />}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   COACHMARK TRIGGER HOOK
   ═══════════════════════════════════════════ */

/**
 * Hook to check if coachmarks should be shown for a screen.
 * Only shows after onboarding is completed.
 */
export function useCoachmark(screen: CoachmarkScreen) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if onboarding is completed and there are unseen tips
    const hasUnseen = coachmarkService.hasUnseenForScreen(screen);
    const isDisabled = coachmarkService.isDisabled();
    setShouldShow(hasUnseen && !isDisabled);
  }, [screen]);

  const dismiss = useCallback(() => {
    setShouldShow(false);
  }, []);

  return { shouldShow, dismiss };
}
