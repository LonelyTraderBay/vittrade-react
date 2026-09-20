import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * useTourProgress — Persistent onboarding tour state with resume capability
 */

export interface TourProgress {
  currentStep: number;
  completedSteps: number[];
  lastVisit: string; // ISO timestamp
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  variant?: 'A' | 'B'; // A/B test variant if applicable
}

interface UseTourProgressConfig {
  tourId: string;
  totalSteps: number;
  resumeWindowHours?: number; // If last visit within this window, resume; else restart
  variant?: 'A' | 'B';
}

const DEFAULT_RESUME_WINDOW = 24; // 24 hours

export function useTourProgress({
  tourId,
  totalSteps,
  resumeWindowHours = DEFAULT_RESUME_WINDOW,
  variant,
}: UseTourProgressConfig) {
  const storageKey = `tour_progress_${tourId}`;
  
  const [progress, setProgress, clearProgress] = useLocalStorage<TourProgress | null>(
    storageKey,
    null,
  );

  // Initialize or resume progress
  const initProgress = useCallback((): TourProgress => {
    const now = new Date();
    
    // If no existing progress, start fresh
    if (!progress) {
      const newProgress: TourProgress = {
        currentStep: 0,
        completedSteps: [],
        lastVisit: now.toISOString(),
        totalSteps,
        completed: false,
        skipped: false,
        variant,
      };
      setProgress(newProgress);
      return newProgress;
    }

    // Check if should resume or restart
    const lastVisit = new Date(progress.lastVisit);
    const hoursSinceLastVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);
    
    // If completed or skipped, offer fresh start
    if (progress.completed || progress.skipped) {
      const freshProgress: TourProgress = {
        currentStep: 0,
        completedSteps: [],
        lastVisit: now.toISOString(),
        totalSteps,
        completed: false,
        skipped: false,
        variant,
      };
      setProgress(freshProgress);
      return freshProgress;
    }

    // If within resume window, continue from where left off
    if (hoursSinceLastVisit <= resumeWindowHours) {
      const resumed: TourProgress = {
        ...progress,
        lastVisit: now.toISOString(),
        totalSteps, // Update in case tour structure changed
      };
      setProgress(resumed);
      return resumed;
    }

    // Outside resume window, restart
    const restarted: TourProgress = {
      currentStep: 0,
      completedSteps: [],
      lastVisit: now.toISOString(),
      totalSteps,
      completed: false,
      skipped: false,
      variant,
    };
    setProgress(restarted);
    return restarted;
  }, [progress, totalSteps, resumeWindowHours, variant, setProgress]);

  // Go to next step
  const goToNextStep = useCallback(() => {
    const current = progress || initProgress();
    if (current.currentStep >= totalSteps - 1) {
      // Reached the end, mark as completed
      const completed: TourProgress = {
        ...current,
        currentStep: totalSteps - 1,
        completedSteps: Array.from(new Set([...current.completedSteps, current.currentStep])),
        completed: true,
        lastVisit: new Date().toISOString(),
      };
      setProgress(completed);
      return completed;
    }

    const next: TourProgress = {
      ...current,
      currentStep: current.currentStep + 1,
      completedSteps: Array.from(new Set([...current.completedSteps, current.currentStep])),
      lastVisit: new Date().toISOString(),
    };
    setProgress(next);
    return next;
  }, [progress, totalSteps, initProgress, setProgress]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    const current = progress || initProgress();
    if (current.currentStep <= 0) return current;

    const prev: TourProgress = {
      ...current,
      currentStep: current.currentStep - 1,
      lastVisit: new Date().toISOString(),
    };
    setProgress(prev);
    return prev;
  }, [progress, initProgress, setProgress]);

  // Jump to specific step
  const goToStep = useCallback((stepIndex: number) => {
    const current = progress || initProgress();
    if (stepIndex < 0 || stepIndex >= totalSteps) return current;

    const updated: TourProgress = {
      ...current,
      currentStep: stepIndex,
      lastVisit: new Date().toISOString(),
    };
    setProgress(updated);
    return updated;
  }, [progress, totalSteps, initProgress, setProgress]);

  // Mark as skipped
  const markSkipped = useCallback(() => {
    const current = progress || initProgress();
    const skipped: TourProgress = {
      ...current,
      skipped: true,
      lastVisit: new Date().toISOString(),
    };
    setProgress(skipped);
    return skipped;
  }, [progress, initProgress, setProgress]);

  // Mark as completed (force completion)
  const markCompleted = useCallback(() => {
    const current = progress || initProgress();
    const completed: TourProgress = {
      ...current,
      completed: true,
      completedSteps: Array.from({ length: totalSteps }, (_, i) => i),
      lastVisit: new Date().toISOString(),
    };
    setProgress(completed);
    return completed;
  }, [progress, totalSteps, initProgress, setProgress]);

  // Check if should show resume prompt
  const shouldShowResumePrompt = useCallback((): boolean => {
    if (!progress || progress.completed || progress.skipped) return false;
    if (progress.currentStep === 0) return false;
    
    const now = new Date();
    const lastVisit = new Date(progress.lastVisit);
    const hoursSinceLastVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastVisit <= resumeWindowHours && progress.currentStep > 0;
  }, [progress, resumeWindowHours]);

  // Reset to beginning (keep history for analytics)
  const resetToBeginning = useCallback(() => {
    const current = progress || initProgress();
    const reset: TourProgress = {
      ...current,
      currentStep: 0,
      lastVisit: new Date().toISOString(),
    };
    setProgress(reset);
    return reset;
  }, [progress, initProgress, setProgress]);

  return {
    progress: progress || initProgress(),
    initProgress,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    markSkipped,
    markCompleted,
    clearProgress,
    shouldShowResumePrompt,
    resetToBeginning,
  };
}
