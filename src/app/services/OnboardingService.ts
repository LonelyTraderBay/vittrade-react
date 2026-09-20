/**
 * Onboarding Service
 * 
 * Tracks user onboarding progress and state.
 * Manages:
 * - Onboarding completion status
 * - Step progress
 * - User goals/interests
 * - First-time flags
 * 
 * @module services/OnboardingService
 * @version 1.0 (Phase 3 - Product Positioning)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Onboarding step
 */
export type OnboardingStep =
  | 'welcome'
  | 'modules'
  | 'boundaries'
  | 'trust'
  | 'goals'
  | 'complete';

/**
 * User goal/interest
 */
export type UserGoal =
  | 'trade-crypto'        // Spot trading
  | 'save-regularly'      // DCA/saving
  | 'p2p-exchange'        // P2P trading
  | 'predict-events'      // Prediction Markets
  | 'arena-challenges'    // Open Arena
  | 'earn-rewards';       // Rewards/referral

/**
 * Module interest
 */
export type ModuleInterest =
  | 'trading'
  | 'wallet'
  | 'p2p'
  | 'prediction'
  | 'arena';

/**
 * Onboarding state
 */
export interface OnboardingState {
  /** User ID */
  userId: string;
  
  /** Is onboarding completed? */
  completed: boolean;
  
  /** Current step */
  currentStep: OnboardingStep;
  
  /** Completed steps */
  completedSteps: OnboardingStep[];
  
  /** Selected goals */
  selectedGoals: UserGoal[];
  
  /** Module interests */
  moduleInterests: ModuleInterest[];
  
  /** Started at */
  startedAt: number;
  
  /** Completed at */
  completedAt?: number;
  
  /** Skipped? */
  skipped: boolean;
}

/**
 * Onboarding analytics
 */
export interface OnboardingAnalytics {
  /** Total users started */
  totalStarted: number;
  
  /** Total completed */
  totalCompleted: number;
  
  /** Completion rate */
  completionRate: number;
  
  /** Average time to complete (ms) */
  avgCompletionTime: number;
  
  /** Skip rate */
  skipRate: number;
  
  /** Most popular goals */
  popularGoals: Array<{ goal: UserGoal; count: number }>;
  
  /** Most popular modules */
  popularModules: Array<{ module: ModuleInterest; count: number }>;
}

/* ═══════════════════════════════════════════
   STORAGE KEYS
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'app_onboarding_state';

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class OnboardingService {
  private states: Map<string, OnboardingState> = new Map();
  
  constructor() {
    this.loadFromStorage();
  }
  
  /* ═══════════════════════════════════════════
     STORAGE
     ═══════════════════════════════════════════ */
  
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.states = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load onboarding state:', error);
    }
  }
  
  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.states);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save onboarding state:', error);
    }
  }
  
  /* ═══════════════════════════════════════════
     STATE MANAGEMENT
     ═══════════════════════════════════════════ */
  
  /**
   * Get onboarding state for user
   */
  getState(userId: string): OnboardingState | null {
    return this.states.get(userId) || null;
  }
  
  /**
   * Check if user has completed onboarding
   */
  isCompleted(userId: string): boolean {
    const state = this.states.get(userId);
    return state?.completed || false;
  }
  
  /**
   * Check if user should see onboarding
   */
  shouldShowOnboarding(userId: string): boolean {
    const state = this.states.get(userId);
    return !state || (!state.completed && !state.skipped);
  }
  
  /**
   * Start onboarding
   */
  startOnboarding(userId: string): OnboardingState {
    const state: OnboardingState = {
      userId,
      completed: false,
      currentStep: 'welcome',
      completedSteps: [],
      selectedGoals: [],
      moduleInterests: [],
      startedAt: Date.now(),
      skipped: false,
    };
    
    this.states.set(userId, state);
    this.saveToStorage();
    return state;
  }
  
  /**
   * Update current step
   */
  setStep(userId: string, step: OnboardingStep) {
    const state = this.states.get(userId);
    if (!state) return;
    
    state.currentStep = step;
    
    // Mark previous step as completed
    if (!state.completedSteps.includes(step)) {
      state.completedSteps.push(step);
    }
    
    this.states.set(userId, state);
    this.saveToStorage();
  }
  
  /**
   * Set user goals
   */
  setGoals(userId: string, goals: UserGoal[]) {
    const state = this.states.get(userId);
    if (!state) return;
    
    state.selectedGoals = goals;
    this.states.set(userId, state);
    this.saveToStorage();
  }
  
  /**
   * Set module interests
   */
  setModuleInterests(userId: string, interests: ModuleInterest[]) {
    const state = this.states.get(userId);
    if (!state) return;
    
    state.moduleInterests = interests;
    this.states.set(userId, state);
    this.saveToStorage();
  }
  
  /**
   * Complete onboarding
   */
  completeOnboarding(userId: string) {
    const state = this.states.get(userId);
    if (!state) return;
    
    state.completed = true;
    state.completedAt = Date.now();
    state.currentStep = 'complete';
    
    this.states.set(userId, state);
    this.saveToStorage();
  }
  
  /**
   * Skip onboarding
   */
  skipOnboarding(userId: string) {
    const state = this.states.get(userId);
    if (!state) {
      // Create minimal state
      const newState: OnboardingState = {
        userId,
        completed: false,
        currentStep: 'welcome',
        completedSteps: [],
        selectedGoals: [],
        moduleInterests: [],
        startedAt: Date.now(),
        skipped: true,
      };
      this.states.set(userId, newState);
    } else {
      state.skipped = true;
    }
    
    this.saveToStorage();
  }
  
  /**
   * Reset onboarding (for testing)
   */
  resetOnboarding(userId: string) {
    this.states.delete(userId);
    this.saveToStorage();
  }
  
  /* ═══════════════════════════════════════════
     ANALYTICS
     ═══════════════════════════════════════════ */
  
  /**
   * Get onboarding analytics
   */
  getAnalytics(): OnboardingAnalytics {
    const allStates = Array.from(this.states.values());
    
    const totalStarted = allStates.length;
    const completed = allStates.filter(s => s.completed);
    const totalCompleted = completed.length;
    const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;
    
    const skipped = allStates.filter(s => s.skipped).length;
    const skipRate = totalStarted > 0 ? (skipped / totalStarted) * 100 : 0;
    
    // Calculate average completion time
    const completionTimes = completed
      .filter(s => s.completedAt)
      .map(s => s.completedAt! - s.startedAt);
    const avgCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;
    
    // Count goals
    const goalCounts = new Map<UserGoal, number>();
    allStates.forEach(state => {
      state.selectedGoals.forEach(goal => {
        goalCounts.set(goal, (goalCounts.get(goal) || 0) + 1);
      });
    });
    const popularGoals = Array.from(goalCounts.entries())
      .map(([goal, count]) => ({ goal, count }))
      .sort((a, b) => b.count - a.count);
    
    // Count modules
    const moduleCounts = new Map<ModuleInterest, number>();
    allStates.forEach(state => {
      state.moduleInterests.forEach(module => {
        moduleCounts.set(module, (moduleCounts.get(module) || 0) + 1);
      });
    });
    const popularModules = Array.from(moduleCounts.entries())
      .map(([module, count]) => ({ module, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalStarted,
      totalCompleted,
      completionRate,
      avgCompletionTime,
      skipRate,
      popularGoals,
      popularModules,
    };
  }
  
  /* ═══════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════ */
  
  /**
   * Get step index
   */
  getStepIndex(step: OnboardingStep): number {
    const steps: OnboardingStep[] = [
      'welcome',
      'modules',
      'boundaries',
      'trust',
      'goals',
      'complete',
    ];
    return steps.indexOf(step);
  }
  
  /**
   * Get total steps
   */
  getTotalSteps(): number {
    return 6;
  }
  
  /**
   * Get progress percentage
   */
  getProgressPercentage(userId: string): number {
    const state = this.states.get(userId);
    if (!state) return 0;
    
    const currentIndex = this.getStepIndex(state.currentStep);
    const total = this.getTotalSteps();
    
    return ((currentIndex + 1) / total) * 100;
  }
  
  /**
   * Get recommended first action based on goals
   */
  getRecommendedFirstAction(userId: string): {
    title: string;
    description: string;
    route: string;
    icon: string;
  } | null {
    const state = this.states.get(userId);
    if (!state || state.selectedGoals.length === 0) return null;
    
    // Pick based on first selected goal
    const primaryGoal = state.selectedGoals[0];
    
    switch (primaryGoal) {
      case 'trade-crypto':
        return {
          title: 'Thực hiện giao dịch đầu tiên',
          description: 'Mua hoặc bán crypto với Convert nhanh',
          route: '/trade',
          icon: 'TrendingUp',
        };
        
      case 'save-regularly':
        return {
          title: 'Tạo kế hoạch DCA',
          description: 'Thiết lập đầu tư định kỳ tự động',
          route: '/dca',
          icon: 'Repeat',
        };
        
      case 'p2p-exchange':
        return {
          title: 'Khám phá P2P Marketplace',
          description: 'Giao dịch trực tiếp với người dùng khác',
          route: '/p2p',
          icon: 'Users',
        };
        
      case 'predict-events':
        return {
          title: 'Xem Prediction Markets',
          description: 'Dự đoán kết quả sự kiện thực tế',
          route: '/predictions',
          icon: 'TrendingUp',
        };
        
      case 'arena-challenges':
        return {
          title: 'Tham gia Arena Challenge',
          description: 'Thử thách và kiếm Arena Points',
          route: '/arena',
          icon: 'Trophy',
        };
        
      case 'earn-rewards':
        return {
          title: 'Khám phá Earn Programs',
          description: 'Kiếm thưởng từ staking và referral',
          route: '/earn',
          icon: 'Gift',
        };
        
      default:
        return null;
    }
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const onboardingService = new OnboardingService();
export { OnboardingService };
