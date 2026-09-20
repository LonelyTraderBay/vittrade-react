/**
 * Conversion Funnel Tracker Service
 * 
 * Tracks user progression through conversion funnels.
 * Analyzes dropout rates and completion times.
 * 
 * @module services/ConversionFunnelTracker
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { dcaAnalytics } from './DCAAnalyticsService';
import {
  FunnelDefinition,
  FunnelStepDefinition,
  getFunnelById,
  getFunnelsByEvent,
} from '../config/dcaFunnels';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Funnel Session
 */
interface FunnelSession {
  /** Session ID */
  sessionId: string;
  
  /** Funnel ID */
  funnelId: string;
  
  /** User ID */
  userId: string;
  
  /** Completed steps */
  steps: CompletedStep[];
  
  /** Is completed */
  completed: boolean;
  
  /** Start time */
  startTime: number;
  
  /** End time */
  endTime?: number;
  
  /** Total duration (ms) */
  duration?: number;
  
  /** Dropout step (if not completed) */
  dropoutStep?: string;
}

/**
 * Completed Step
 */
interface CompletedStep {
  /** Step ID */
  stepId: string;
  
  /** Timestamp */
  timestamp: number;
  
  /** Time since previous step (ms) */
  timeSincePrevious?: number;
  
  /** Event properties */
  properties?: Record<string, any>;
}

/**
 * Funnel Analytics
 */
export interface FunnelAnalytics {
  /** Funnel ID */
  funnelId: string;
  
  /** Total sessions */
  totalSessions: number;
  
  /** Completed sessions */
  completedSessions: number;
  
  /** Completion rate */
  completionRate: number;
  
  /** Average completion time (ms) */
  avgCompletionTime: number;
  
  /** Median completion time (ms) */
  medianCompletionTime: number;
  
  /** Step analytics */
  stepAnalytics: StepAnalytics[];
  
  /** Dropout analysis */
  dropoutAnalysis: DropoutAnalysis[];
}

/**
 * Step Analytics
 */
interface StepAnalytics {
  /** Step ID */
  stepId: string;
  
  /** Step name */
  stepName: string;
  
  /** Users who reached this step */
  reached: number;
  
  /** Users who completed this step */
  completed: number;
  
  /** Completion rate for this step */
  completionRate: number;
  
  /** Average time to complete (ms) */
  avgTimeToComplete: number;
  
  /** Dropout rate at this step */
  dropoutRate: number;
}

/**
 * Dropout Analysis
 */
interface DropoutAnalysis {
  /** Step where dropout occurred */
  step: string;
  
  /** Number of dropouts */
  count: number;
  
  /** Dropout rate */
  rate: number;
  
  /** Average time before dropout (ms) */
  avgTimeBeforeDropout: number;
}

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class ConversionFunnelTrackerService {
  private activeSessions: Map<string, FunnelSession[]> = new Map();
  private completedSessions: Map<string, FunnelSession[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /* ─────────────────────────────────────────
     SESSION MANAGEMENT
     ───────────────────────────────────────── */

  /**
   * Start funnel session
   */
  startSession(funnelId: string, userId: string = 'anonymous'): string {
    const sessionId = this.generateSessionId();
    
    const session: FunnelSession = {
      sessionId,
      funnelId,
      userId,
      steps: [],
      completed: false,
      startTime: Date.now(),
    };

    if (!this.activeSessions.has(funnelId)) {
      this.activeSessions.set(funnelId, []);
    }
    this.activeSessions.get(funnelId)!.push(session);

    this.saveToStorage();
    return sessionId;
  }

  /**
   * Track event and progress funnels
   */
  trackEvent(eventName: string, userId: string = 'anonymous', properties?: Record<string, any>): void {
    // Find all funnels that track this event
    const funnels = getFunnelsByEvent(eventName);
    
    for (const funnel of funnels) {
      this.progressFunnel(funnel, eventName, userId, properties);
    }
  }

  /**
   * Progress funnel based on event
   */
  private progressFunnel(
    funnel: FunnelDefinition,
    eventName: string,
    userId: string,
    properties?: Record<string, any>
  ): void {
    // Find or create active session
    let session = this.findActiveSession(funnel.id, userId);
    
    // If no session and this is first step, create one
    const firstStep = funnel.steps[0];
    if (!session && firstStep.eventName === eventName) {
      const sessionId = this.startSession(funnel.id, userId);
      session = this.findSessionById(funnel.id, sessionId);
    }

    if (!session) return;

    // Find next expected step
    const nextStepIndex = session.steps.length;
    if (nextStepIndex >= funnel.steps.length) return; // Already completed

    const nextStep = funnel.steps[nextStepIndex];
    
    // Check if event matches next step
    if (nextStep.eventName !== eventName) {
      // Allow skipping non-required steps
      if (!nextStep.required) {
        const futureStep = funnel.steps.slice(nextStepIndex + 1).find(s => s.eventName === eventName);
        if (futureStep) {
          // Skip to future step
          this.completeStep(session, futureStep, properties);
        }
      }
      return;
    }

    // Complete step
    this.completeStep(session, nextStep, properties);

    // Check if funnel is complete
    if (eventName === funnel.successEvent) {
      this.completeFunnel(session);
    }
  }

  /**
   * Complete a step
   */
  private completeStep(
    session: FunnelSession,
    step: FunnelStepDefinition,
    properties?: Record<string, any>
  ): void {
    const now = Date.now();
    const previousStep = session.steps[session.steps.length - 1];
    
    const completedStep: CompletedStep = {
      stepId: step.id,
      timestamp: now,
      timeSincePrevious: previousStep ? now - previousStep.timestamp : undefined,
      properties,
    };

    session.steps.push(completedStep);
    this.saveToStorage();

    // Track in analytics
    dcaAnalytics.trackEvent('funnel_step_completed', {
      funnel_id: session.funnelId,
      step_id: step.id,
      step_name: step.name,
      session_id: session.sessionId,
      user_id: session.userId,
      time_since_previous: completedStep.timeSincePrevious,
    });
  }

  /**
   * Complete funnel
   */
  private completeFunnel(session: FunnelSession): void {
    session.completed = true;
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Move to completed sessions
    if (!this.completedSessions.has(session.funnelId)) {
      this.completedSessions.set(session.funnelId, []);
    }
    this.completedSessions.get(session.funnelId)!.push(session);

    // Remove from active
    const active = this.activeSessions.get(session.funnelId) || [];
    const index = active.findIndex(s => s.sessionId === session.sessionId);
    if (index >= 0) {
      active.splice(index, 1);
    }

    this.saveToStorage();

    // Track in analytics
    dcaAnalytics.trackEvent('funnel_completed', {
      funnel_id: session.funnelId,
      session_id: session.sessionId,
      user_id: session.userId,
      duration: session.duration,
      steps_completed: session.steps.length,
    });
  }

  /* ─────────────────────────────────────────
     ANALYTICS
     ───────────────────────────────────────── */

  /**
   * Get funnel analytics
   */
  getFunnelAnalytics(funnelId: string): FunnelAnalytics {
    const funnel = getFunnelById(funnelId);
    if (!funnel) {
      throw new Error(`Funnel not found: ${funnelId}`);
    }

    const allSessions = [
      ...(this.activeSessions.get(funnelId) || []),
      ...(this.completedSessions.get(funnelId) || []),
    ];

    const completedSessions = allSessions.filter(s => s.completed);
    
    return {
      funnelId,
      totalSessions: allSessions.length,
      completedSessions: completedSessions.length,
      completionRate: allSessions.length > 0 
        ? completedSessions.length / allSessions.length 
        : 0,
      avgCompletionTime: this.calculateAvgCompletionTime(completedSessions),
      medianCompletionTime: this.calculateMedianCompletionTime(completedSessions),
      stepAnalytics: this.calculateStepAnalytics(funnel, allSessions),
      dropoutAnalysis: this.calculateDropoutAnalysis(funnel, allSessions),
    };
  }

  /**
   * Calculate step analytics
   */
  private calculateStepAnalytics(
    funnel: FunnelDefinition,
    sessions: FunnelSession[]
  ): StepAnalytics[] {
    return funnel.steps.map((step, index) => {
      const reached = sessions.filter(s => s.steps.length > index).length;
      const completed = sessions.filter(s => s.steps.length > index && s.steps[index].stepId === step.id).length;
      
      const timeToComplete = sessions
        .filter(s => s.steps[index]?.stepId === step.id)
        .map(s => s.steps[index].timeSincePrevious || 0)
        .filter(t => t > 0);
      
      const avgTimeToComplete = timeToComplete.length > 0
        ? timeToComplete.reduce((sum, t) => sum + t, 0) / timeToComplete.length
        : 0;

      const dropouts = sessions.filter(s => 
        !s.completed && s.steps.length === index
      ).length;

      return {
        stepId: step.id,
        stepName: step.name,
        reached,
        completed,
        completionRate: reached > 0 ? completed / reached : 0,
        avgTimeToComplete,
        dropoutRate: sessions.length > 0 ? dropouts / sessions.length : 0,
      };
    });
  }

  /**
   * Calculate dropout analysis
   */
  private calculateDropoutAnalysis(
    funnel: FunnelDefinition,
    sessions: FunnelSession[]
  ): DropoutAnalysis[] {
    const dropouts = sessions.filter(s => !s.completed);
    
    const dropoutByStep: Map<string, { count: number; times: number[] }> = new Map();

    for (const session of dropouts) {
      const lastStepIndex = session.steps.length - 1;
      const dropoutStep = lastStepIndex >= 0 
        ? funnel.steps[lastStepIndex].id 
        : 'entry';
      
      if (!dropoutByStep.has(dropoutStep)) {
        dropoutByStep.set(dropoutStep, { count: 0, times: [] });
      }
      
      const data = dropoutByStep.get(dropoutStep)!;
      data.count++;
      
      if (session.steps.length > 0) {
        const lastStep = session.steps[session.steps.length - 1];
        data.times.push(Date.now() - lastStep.timestamp);
      }
    }

    return Array.from(dropoutByStep.entries()).map(([step, data]) => ({
      step,
      count: data.count,
      rate: sessions.length > 0 ? data.count / sessions.length : 0,
      avgTimeBeforeDropout: data.times.length > 0
        ? data.times.reduce((sum, t) => sum + t, 0) / data.times.length
        : 0,
    }));
  }

  /**
   * Calculate average completion time
   */
  private calculateAvgCompletionTime(sessions: FunnelSession[]): number {
    if (sessions.length === 0) return 0;
    
    const durations = sessions
      .map(s => s.duration)
      .filter((d): d is number => d !== undefined);
    
    if (durations.length === 0) return 0;
    
    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  /**
   * Calculate median completion time
   */
  private calculateMedianCompletionTime(sessions: FunnelSession[]): number {
    const durations = sessions
      .map(s => s.duration)
      .filter((d): d is number => d !== undefined)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) return 0;
    
    const mid = Math.floor(durations.length / 2);
    return durations.length % 2 === 0
      ? (durations[mid - 1] + durations[mid]) / 2
      : durations[mid];
  }

  /* ─────────────────────────────────────────
     SESSION LOOKUP
     ───────────────────────────────────────── */

  /**
   * Find active session for user
   */
  private findActiveSession(funnelId: string, userId: string): FunnelSession | undefined {
    const sessions = this.activeSessions.get(funnelId) || [];
    return sessions.find(s => s.userId === userId && !s.completed);
  }

  /**
   * Find session by ID
   */
  private findSessionById(funnelId: string, sessionId: string): FunnelSession | undefined {
    const active = this.activeSessions.get(funnelId) || [];
    const completed = this.completedSessions.get(funnelId) || [];
    return [...active, ...completed].find(s => s.sessionId === sessionId);
  }

  /* ─────────────────────────────────────────
     UTILITIES
     ───────────────────────────────────────── */

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean old sessions
   */
  cleanOldSessions(maxAge: number = 86400000): void {
    const now = Date.now();
    
    for (const [funnelId, sessions] of this.activeSessions.entries()) {
      this.activeSessions.set(
        funnelId,
        sessions.filter(s => now - s.startTime < maxAge)
      );
    }

    this.saveToStorage();
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.activeSessions.clear();
    this.completedSessions.clear();
    this.saveToStorage();
  }

  /* ─────────────────────────────────────────
     PERSISTENCE
     ───────────────────────────────────────── */

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        active: Array.from(this.activeSessions.entries()),
        completed: Array.from(this.completedSessions.entries()),
      };
      localStorage.setItem('funnel_tracker', JSON.stringify(data));
    } catch (error) {
      console.error('[FunnelTracker] Failed to save:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('funnel_tracker');
      if (!stored) return;

      const data = JSON.parse(stored);
      this.activeSessions = new Map(data.active);
      this.completedSessions = new Map(data.completed);
    } catch (error) {
      console.error('[FunnelTracker] Failed to load:', error);
    }
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const funnelTracker = new ConversionFunnelTrackerService();

export { ConversionFunnelTrackerService };
export type { FunnelAnalytics, StepAnalytics, DropoutAnalysis };
