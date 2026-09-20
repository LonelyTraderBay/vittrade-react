/**
 * Coachmark Service
 * 
 * Manages contextual tooltips / coachmarks shown after onboarding.
 * Tracks which tips have been seen, dismissed, and controls
 * display logic per screen/feature.
 * 
 * Tip priority order per Guidelines §20:
 *   Trust → Safety → Boundary Clarity → Clarity → Accessibility
 * 
 * @module services/CoachmarkService
 * @version 1.0 (Phase 3 - Product Positioning)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Coachmark placement
 */
export type CoachmarkPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Coachmark target screen/context
 */
export type CoachmarkScreen =
  | 'home'
  | 'markets'
  | 'trade'
  | 'wallet'
  | 'profile'
  | 'p2p'
  | 'predictions'
  | 'arena'
  | 'dca';

/**
 * Coachmark priority (higher = show first)
 */
export type CoachmarkPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Coachmark definition
 */
export interface CoachmarkDef {
  /** Unique ID */
  id: string;
  
  /** Target screen */
  screen: CoachmarkScreen;
  
  /** Title */
  title: string;
  
  /** Description */
  description: string;
  
  /** Priority */
  priority: CoachmarkPriority;
  
  /** Placement relative to target */
  placement: CoachmarkPlacement;
  
  /** Optional action label */
  actionLabel?: string;
  
  /** Optional action route */
  actionRoute?: string;
  
  /** Module boundary disclosure (per Guidelines §6) */
  disclosure?: string;
  
  /** Sequence order within the same screen */
  order: number;
  
  /** Delay before showing (ms) */
  delay?: number;
}

/**
 * Coachmark state
 */
export interface CoachmarkState {
  /** Seen coachmark IDs */
  seen: string[];
  
  /** Dismissed coachmark IDs */
  dismissed: string[];
  
  /** Globally disabled */
  disabled: boolean;
  
  /** Last shown timestamp */
  lastShown: number;
}

/* ═══════════════════════════════════════════
   COACHMARK DEFINITIONS
   ═══════════════════════════════════════════ */

const ALL_COACHMARKS: CoachmarkDef[] = [
  // ─── Home ───
  {
    id: 'home-modules-overview',
    screen: 'home',
    title: 'Trang chủ của bạn',
    description: 'Từ đây bạn có thể truy cập nhanh tất cả modules: Trading, Wallet, P2P, Prediction Markets và Arena.',
    priority: 'high',
    placement: 'bottom',
    order: 1,
    delay: 500,
  },
  {
    id: 'home-prediction-entry',
    screen: 'home',
    title: 'Prediction Markets',
    description: 'Dự đoán kết quả sự kiện thực tế. Đây là thị trường có giá trị — positions ảnh hưởng wallet.',
    priority: 'medium',
    placement: 'bottom',
    order: 2,
    disclosure: 'Thị trường giá trị',
  },
  {
    id: 'home-arena-entry',
    screen: 'home',
    title: 'Open Arena',
    description: 'Thử thách cộng đồng dùng Arena Points. Hoàn toàn tách biệt với wallet và giao dịch.',
    priority: 'medium',
    placement: 'bottom',
    order: 3,
    disclosure: 'Arena Points only — Không liên quan wallet',
  },

  // ─── Trade ───
  {
    id: 'trade-beginner-pro',
    screen: 'trade',
    title: 'Chế độ giao dịch',
    description: 'Bạn đang ở chế độ Beginner (Convert nhanh). Chuyển sang Pro để dùng chart và order book.',
    priority: 'high',
    placement: 'bottom',
    order: 1,
    delay: 800,
  },
  {
    id: 'trade-fee-preview',
    screen: 'trade',
    title: 'Phí minh bạch',
    description: 'Mọi giao dịch đều hiển thị phí, slippage trước khi bạn xác nhận. Không phí ẩn.',
    priority: 'medium',
    placement: 'top',
    order: 2,
  },

  // ─── Wallet ───
  {
    id: 'wallet-overview',
    screen: 'wallet',
    title: 'Tổng quan tài sản',
    description: 'Xem tổng số dư, phân bổ tài sản, và trạng thái available / locked.',
    priority: 'high',
    placement: 'bottom',
    order: 1,
    delay: 500,
  },
  {
    id: 'wallet-withdraw-safety',
    screen: 'wallet',
    title: 'Rút tiền an toàn',
    description: 'Khi rút, bạn sẽ thấy preview đầy đủ: địa chỉ, mạng, phí, thời gian trước khi xác nhận.',
    priority: 'high',
    placement: 'bottom',
    order: 2,
  },

  // ─── P2P ───
  {
    id: 'p2p-escrow-safety',
    screen: 'p2p',
    title: 'Escrow bảo vệ',
    description: 'Mọi giao dịch P2P có escrow tự động. Crypto chỉ được release khi bạn xác nhận đã nhận tiền.',
    priority: 'critical',
    placement: 'bottom',
    order: 1,
    delay: 500,
  },
  {
    id: 'p2p-anti-scam',
    screen: 'p2p',
    title: 'Cảnh báo an toàn',
    description: 'Không giao dịch ngoài nền tảng. Chỉ bấm "Đã thanh toán" khi đã chuyển tiền thật.',
    priority: 'critical',
    placement: 'bottom',
    order: 2,
  },

  // ─── Predictions ───
  {
    id: 'predictions-value-warning',
    screen: 'predictions',
    title: 'Thị trường giá trị',
    description: 'Prediction Markets sử dụng tài sản thật. Positions có P/L và ảnh hưởng wallet balance.',
    priority: 'critical',
    placement: 'bottom',
    order: 1,
    delay: 500,
    disclosure: 'Liên kết wallet',
  },

  // ─── Arena ───
  {
    id: 'arena-points-only',
    screen: 'arena',
    title: 'Arena Points only',
    description: 'Arena sử dụng Arena Points — không phải tài sản tài chính, không liên quan wallet.',
    priority: 'critical',
    placement: 'bottom',
    order: 1,
    delay: 500,
    disclosure: 'Không phải tài sản tài chính',
  },

  // ─── DCA ───
  {
    id: 'dca-auto-invest',
    screen: 'dca',
    title: 'Đầu tư tự động',
    description: 'Thiết lập mua định kỳ với DCA. Hỗ trợ Smart Scheduling và Auto-Rebalance.',
    priority: 'medium',
    placement: 'bottom',
    order: 1,
    delay: 500,
  },

  // ─── Profile ───
  {
    id: 'profile-security-setup',
    screen: 'profile',
    title: 'Thiết lập bảo mật',
    description: 'Bật 2FA, biometrics và anti-phishing code để bảo vệ tài khoản tốt nhất.',
    priority: 'high',
    placement: 'bottom',
    order: 1,
    delay: 800,
    actionLabel: 'Cài đặt bảo mật',
    actionRoute: '/profile/security',
  },
];

/* ═══════════════════════════════════════════
   PRIORITY WEIGHTS
   ═══════════════════════════════════════════ */

const PRIORITY_WEIGHT: Record<CoachmarkPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/* ═══════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════ */

const STORAGE_KEY = 'app_coachmark_state';

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class CoachmarkService {
  private state: CoachmarkState;
  
  constructor() {
    this.state = this.loadFromStorage();
  }
  
  /* ─── Storage ─── */
  
  private loadFromStorage(): CoachmarkState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load coachmark state:', error);
    }
    return {
      seen: [],
      dismissed: [],
      disabled: false,
      lastShown: 0,
    };
  }
  
  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save coachmark state:', error);
    }
  }
  
  /* ─── Query ─── */
  
  /**
   * Get coachmarks for a specific screen, filtered by unseen/undismissed.
   * Sorted by priority then order.
   */
  getForScreen(screen: CoachmarkScreen): CoachmarkDef[] {
    if (this.state.disabled) return [];
    
    return ALL_COACHMARKS
      .filter((cm) =>
        cm.screen === screen &&
        !this.state.seen.includes(cm.id) &&
        !this.state.dismissed.includes(cm.id)
      )
      .sort((a, b) => {
        const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (pDiff !== 0) return pDiff;
        return a.order - b.order;
      });
  }
  
  /**
   * Get the next (highest priority) coachmark for a screen.
   */
  getNextForScreen(screen: CoachmarkScreen): CoachmarkDef | null {
    const all = this.getForScreen(screen);
    return all.length > 0 ? all[0] : null;
  }
  
  /**
   * Check if there are unseen coachmarks for a screen.
   */
  hasUnseenForScreen(screen: CoachmarkScreen): boolean {
    return this.getForScreen(screen).length > 0;
  }
  
  /**
   * Get all coachmark definitions (for debugging/admin).
   */
  getAllDefinitions(): CoachmarkDef[] {
    return [...ALL_COACHMARKS];
  }
  
  /* ─── State mutations ─── */
  
  /**
   * Mark a coachmark as seen.
   */
  markSeen(id: string) {
    if (!this.state.seen.includes(id)) {
      this.state.seen.push(id);
      this.state.lastShown = Date.now();
      this.saveToStorage();
    }
  }
  
  /**
   * Dismiss a coachmark (won't show again).
   */
  dismiss(id: string) {
    if (!this.state.dismissed.includes(id)) {
      this.state.dismissed.push(id);
      this.saveToStorage();
    }
  }
  
  /**
   * Dismiss all coachmarks for a screen.
   */
  dismissAllForScreen(screen: CoachmarkScreen) {
    const screenCoachmarks = ALL_COACHMARKS.filter((cm) => cm.screen === screen);
    screenCoachmarks.forEach((cm) => {
      if (!this.state.dismissed.includes(cm.id)) {
        this.state.dismissed.push(cm.id);
      }
    });
    this.saveToStorage();
  }
  
  /**
   * Toggle global disable.
   */
  setDisabled(disabled: boolean) {
    this.state.disabled = disabled;
    this.saveToStorage();
  }
  
  /**
   * Check if globally disabled.
   */
  isDisabled(): boolean {
    return this.state.disabled;
  }
  
  /**
   * Reset all coachmark state (show tips again).
   */
  resetAll() {
    this.state = {
      seen: [],
      dismissed: [],
      disabled: false,
      lastShown: 0,
    };
    this.saveToStorage();
  }
  
  /**
   * Get state (for debugging).
   */
  getState(): CoachmarkState {
    return { ...this.state };
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const coachmarkService = new CoachmarkService();
export { CoachmarkService };
