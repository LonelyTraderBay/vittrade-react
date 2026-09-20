/**
 * Onboarding Progress Indicator
 * 
 * Shows current step progress in onboarding flow.
 * 
 * @module components/onboarding/OnboardingProgress
 * @version 1.0 (Phase 3)
 */

import { useThemeColors } from '../../hooks/useThemeColors';
import type { OnboardingStep } from '../../services/OnboardingService';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

interface OnboardingProgressProps {
  /** Current step */
  currentStep: OnboardingStep;
  
  /** Total steps */
  totalSteps?: number;
  
  /** Completed steps */
  completedSteps?: OnboardingStep[];
}

/* ═══════════════════════════════════════════
   STEP CONFIG
   ═══════════════════════════════════════════ */

const STEPS: OnboardingStep[] = [
  'welcome',
  'modules',
  'boundaries',
  'trust',
  'goals',
  'complete',
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export function OnboardingProgress({
  currentStep,
  totalSteps = 6,
  completedSteps = [],
}: OnboardingProgressProps) {
  const c = useThemeColors();
  
  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / totalSteps) * 100;
  
  return (
    <div className="px-5 py-3">
      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: c.divider }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)',
          }}
        />
      </div>
      
      {/* Step indicator */}
      <div className="flex items-center justify-between mt-2">
        <p style={{ color: c.text3, fontSize: 11 }}>
          Bước {currentIndex + 1}/{totalSteps}
        </p>
        <p style={{ color: c.text3, fontSize: 11 }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}
