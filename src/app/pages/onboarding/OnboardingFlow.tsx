/**
 * Onboarding Flow Orchestrator
 * 
 * Manages the complete onboarding flow with animated transitions:
 *   welcome → modules → boundaries → trust → goals → complete
 * 
 * Uses Motion (AnimatePresence) for smooth directional page transitions.
 * Integrates with OnboardingService for state persistence.
 * 
 * @module pages/onboarding/OnboardingFlow
 * @version 2.0 (Phase 3 — with Motion transitions)
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  onboardingService,
  type OnboardingStep,
  type UserGoal,
} from '../../services/OnboardingService';
import OnboardingWelcome from './OnboardingWelcome';
import OnboardingModules from './OnboardingModules';
import OnboardingBoundaries from './OnboardingBoundaries';
import OnboardingTrust from './OnboardingTrust';
import OnboardingGoals from './OnboardingGoals';
import OnboardingComplete from './OnboardingComplete';

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */

const DEMO_USER_ID = 'demo-user';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'modules',
  'boundaries',
  'trust',
  'goals',
  'complete',
];

/* ═══════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════ */

const SLIDE_OFFSET = 80;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? SLIDE_OFFSET : -SLIDE_OFFSET,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -SLIDE_OFFSET : SLIDE_OFFSET,
    opacity: 0,
  }),
};

const springTransition = {
  x: { type: 'spring' as const, stiffness: 350, damping: 32, mass: 0.8 },
  opacity: { duration: 0.2, ease: 'easeOut' as const },
};

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function OnboardingFlow() {
  const navigate = useNavigate();

  // Initialize state from service
  const existingState = onboardingService.getState(DEMO_USER_ID);
  const initialStep = existingState?.currentStep || 'welcome';

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(initialStep);
  const [selectedGoals, setSelectedGoals] = useState<UserGoal[]>(
    existingState?.selectedGoals || []
  );

  // Direction: 1 = forward, -1 = backward
  const directionRef = useRef<number>(1);

  // Ensure onboarding is started
  if (!existingState) {
    onboardingService.startOnboarding(DEMO_USER_ID);
  }

  /* ─── Navigation helpers ─── */

  const goToStep = useCallback((step: OnboardingStep, direction: number = 1) => {
    directionRef.current = direction;
    setCurrentStep(step);
    onboardingService.setStep(DEMO_USER_ID, step);
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      goToStep(STEP_ORDER[currentIndex + 1], 1);
    }
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1], -1);
    }
  }, [currentStep, goToStep]);

  const handleSkip = useCallback(() => {
    onboardingService.skipOnboarding(DEMO_USER_ID);
    navigate('/home');
  }, [navigate]);

  const handleGoalsNext = useCallback((goals: UserGoal[]) => {
    setSelectedGoals(goals);
    onboardingService.setGoals(DEMO_USER_ID, goals);
    goToStep('complete', 1);
  }, [goToStep]);

  const handleFinish = useCallback(() => {
    onboardingService.completeOnboarding(DEMO_USER_ID);
  }, []);

  const handleGoToRoute = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  /* ─── Render step content ─── */

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <OnboardingWelcome
            onNext={goNext}
            onSkip={handleSkip}
          />
        );
      case 'modules':
        return (
          <OnboardingModules
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'boundaries':
        return (
          <OnboardingBoundaries
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'trust':
        return (
          <OnboardingTrust
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 'goals':
        return (
          <OnboardingGoals
            onNext={handleGoalsNext}
            onBack={goBack}
            initialGoals={selectedGoals}
          />
        );
      case 'complete':
        return (
          <OnboardingComplete
            selectedGoals={selectedGoals}
            onFinish={handleFinish}
            onGoToRoute={handleGoToRoute}
          />
        );
      default:
        return (
          <OnboardingWelcome
            onNext={goNext}
            onSkip={handleSkip}
          />
        );
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      <AnimatePresence mode="wait" custom={directionRef.current}>
        <motion.div
          key={currentStep}
          custom={directionRef.current}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={springTransition}
          style={{ width: '100%' }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
