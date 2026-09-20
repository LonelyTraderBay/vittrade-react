/**
 * P2P API Service
 * Centralized API calls for P2P module with mock/stub responses
 */

// ═══════════════════════════════════════════════════════════
//  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export interface KYCStatus {
  tier: number;
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  identity: VerificationStep;
  address: VerificationStep;
  selfie: VerificationStep;
  video?: VerificationStep;
  lastUpdate: string;
}

export interface VerificationStep {
  status: 'not_started' | 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reason?: string;
}

export interface SecurityStatus {
  score: number;
  twoFactorEnabled: boolean;
  antiPhishingCode?: string;
  trustedDevices: number;
  lastLoginAt: string;
  suspiciousActivities: number;
}

export interface WalletBalance {
  available: { [asset: string]: number };
  locked: { [asset: string]: number };
  total: { [asset: string]: number };
}

export interface TransactionLimits {
  daily: { used: number; limit: number };
  weekly: { used: number; limit: number };
  monthly: { used: number; limit: number };
  tier: number;
}

export interface AMLScreening {
  status: 'clear' | 'review' | 'blocked';
  lastCheck: string;
  nextCheck: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'review' | 'fail';
    detail: string;
  }>;
}

export interface PaymentMethod {
  id: string;
  type: 'bank' | 'ewallet' | 'card';
  name: string;
  accountNumber: string;
  verified: boolean;
  coolingPeriod?: { until: string; hoursLeft: number };
}

// ═══════════════════════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════════════════════

const MOCK_KYC_STATUS: KYCStatus = {
  tier: 1,
  status: 'approved',
  identity: { status: 'approved', submittedAt: '2026-03-01 10:00', reviewedAt: '2026-03-01 14:00' },
  address: { status: 'approved', submittedAt: '2026-03-01 15:00', reviewedAt: '2026-03-01 18:00' },
  selfie: { status: 'approved', submittedAt: '2026-03-01 19:00', reviewedAt: '2026-03-01 20:00' },
  lastUpdate: '2026-03-01 20:00',
};

const MOCK_SECURITY_STATUS: SecurityStatus = {
  score: 85,
  twoFactorEnabled: true,
  antiPhishingCode: 'SAFE2026',
  trustedDevices: 2,
  lastLoginAt: '2026-03-05 14:20',
  suspiciousActivities: 0,
};

const MOCK_WALLET_BALANCE: WalletBalance = {
  available: { USDT: 1500.5, BTC: 0.025, VND: 25000000 },
  locked: { USDT: 500, BTC: 0.01, VND: 0 },
  total: { USDT: 2000.5, BTC: 0.035, VND: 25000000 },
};

const MOCK_LIMITS: TransactionLimits = {
  daily: { used: 35000000, limit: 50000000 },
  weekly: { used: 180000000, limit: 300000000 },
  monthly: { used: 650000000, limit: 1000000000 },
  tier: 1,
};

const MOCK_AML: AMLScreening = {
  status: 'clear',
  lastCheck: '2026-03-05 10:00',
  nextCheck: '2026-03-12 10:00',
  checks: [
    { name: 'Sanctions List', status: 'pass', detail: 'No match found' },
    { name: 'PEP Check', status: 'pass', detail: 'Not a PEP' },
    { name: 'Adverse Media', status: 'pass', detail: 'No negative news' },
  ],
};

// ═══════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockApiCall = async <T>(data: T, delayMs = 500): Promise<T> => {
  await delay(delayMs);
  // Simulate 5% error rate for testing
  if (Math.random() < 0.05) {
    throw new Error('Network error: Please try again');
  }
  return data;
};

// ═══════════════════════════════════════════════════════════
//  KYC APIs
// ═══════════════════════════════════════════════════════════

export const p2pKycApi = {
  /**
   * Get KYC status
   */
  getStatus: async (): Promise<KYCStatus> => {
    return mockApiCall(MOCK_KYC_STATUS);
  },

  /**
   * Upload identity document
   */
  uploadIdentity: async (file: File, docType: string): Promise<{ success: boolean; ocrData?: any }> => {
    await delay(1500); // Simulate OCR processing
    return {
      success: true,
      ocrData: {
        fullName: 'Nguyễn Văn A',
        idNumber: '001234567890',
        dateOfBirth: '1990-01-01',
        address: 'Hà Nội, Việt Nam',
      },
    };
  },

  /**
   * Upload address proof
   */
  uploadAddressProof: async (file: File): Promise<{ success: boolean }> => {
    await delay(1000);
    return { success: true };
  },

  /**
   * Submit selfie verification
   */
  submitSelfie: async (file: File): Promise<{ success: boolean; faceMatchScore?: number }> => {
    await delay(2000); // Simulate liveness detection
    return {
      success: true,
      faceMatchScore: 96.5,
    };
  },

  /**
   * Book video KYC appointment
   */
  bookVideoKYC: async (slotId: string): Promise<{ success: boolean; appointmentId: string }> => {
    await delay(500);
    return {
      success: true,
      appointmentId: `APPT-${Date.now()}`,
    };
  },
};

// ═══════════════════════════════════════════════════════════
//  SECURITY APIs
// ═══════════════════════════════════════════════════════════

export const p2pSecurityApi = {
  /**
   * Get security status
   */
  getStatus: async (): Promise<SecurityStatus> => {
    return mockApiCall(MOCK_SECURITY_STATUS);
  },

  /**
   * Enable 2FA
   */
  enable2FA: async (method: 'sms' | 'app' | 'email', code: string): Promise<{ success: boolean }> => {
    await delay(500);
    if (code.length !== 6) throw new Error('Invalid code');
    return { success: true };
  },

  /**
   * Disable 2FA
   */
  disable2FA: async (password: string): Promise<{ success: boolean }> => {
    await delay(500);
    return { success: true };
  },

  /**
   * Get trusted devices
   */
  getDevices: async (): Promise<Array<{ id: string; name: string; lastUsed: string; trusted: boolean }>> => {
    return mockApiCall([
      { id: '1', name: 'iPhone 15 Pro', lastUsed: '2026-03-05 14:20', trusted: true },
      { id: '2', name: 'Chrome on MacBook', lastUsed: '2026-03-04 10:30', trusted: true },
    ]);
  },

  /**
   * Trust/untrust device
   */
  updateDeviceTrust: async (deviceId: string, trusted: boolean): Promise<{ success: boolean }> => {
    await delay(300);
    return { success: true };
  },

  /**
   * Set anti-phishing code
   */
  setAntiPhishingCode: async (code: string): Promise<{ success: boolean }> => {
    await delay(300);
    if (code.length < 6) throw new Error('Code must be at least 6 characters');
    return { success: true };
  },

  /**
   * Get login history
   */
  getLoginHistory: async (): Promise<Array<{ id: string; timestamp: string; location: string; device: string; suspicious: boolean }>> => {
    return mockApiCall([
      { id: '1', timestamp: '2026-03-05 14:20', location: 'Hà Nội, VN', device: 'iPhone 15 Pro', suspicious: false },
      { id: '2', timestamp: '2026-03-05 08:30', location: 'Hà Nội, VN', device: 'iPhone 15 Pro', suspicious: false },
      { id: '3', timestamp: '2026-03-04 18:00', location: 'Singapore, SG', device: 'Unknown Android', suspicious: true },
    ]);
  },
};

// ═══════════════════════════════════════════════════════════
//  WALLET APIs
// ═══════════════════════════════════════════════════════════

export const p2pWalletApi = {
  /**
   * Get wallet balance
   */
  getBalance: async (): Promise<WalletBalance> => {
    return mockApiCall(MOCK_WALLET_BALANCE);
  },

  /**
   * Transfer funds (P2P ↔ Main Wallet)
   */
  transfer: async (params: {
    asset: string;
    amount: number;
    direction: 'p2p_to_main' | 'main_to_p2p';
  }): Promise<{ success: boolean; txId: string }> => {
    await delay(800);
    return {
      success: true,
      txId: `TX-${Date.now()}`,
    };
  },

  /**
   * Get escrow balance breakdown
   */
  getEscrowBalance: async (): Promise<Array<{ orderId: string; asset: string; amount: number; status: string }>> => {
    return mockApiCall([
      { orderId: '45892', asset: 'USDT', amount: 500, status: 'locked' },
      { orderId: '45870', asset: 'BTC', amount: 0.01, status: 'locked' },
    ]);
  },

  /**
   * Get fund lock history
   */
  getFundLockHistory: async (): Promise<Array<{ id: string; type: 'lock' | 'unlock'; asset: string; amount: number; reason: string; timestamp: string }>> => {
    return mockApiCall([
      { id: '1', type: 'lock', asset: 'USDT', amount: 1500, reason: 'Order #45892 created', timestamp: '2026-03-05 14:20' },
      { id: '2', type: 'unlock', asset: 'USDT', amount: 1000, reason: 'Order #45880 completed', timestamp: '2026-03-05 13:45' },
    ]);
  },
};

// ═══════════════════════════════════════════════════════════
//  COMPLIANCE APIs
// ═══════════════════════════════════════════════════════════

export const p2pComplianceApi = {
  /**
   * Get transaction limits
   */
  getLimits: async (): Promise<TransactionLimits> => {
    return mockApiCall(MOCK_LIMITS);
  },

  /**
   * Get AML screening status
   */
  getAMLStatus: async (): Promise<AMLScreening> => {
    return mockApiCall(MOCK_AML);
  },

  /**
   * Submit source of funds
   */
  submitSourceOfFunds: async (data: { source: string; details: string }): Promise<{ success: boolean }> => {
    await delay(500);
    return { success: true };
  },

  /**
   * Submit large transaction justification
   */
  submitLargeTransactionJustification: async (data: {
    amount: number;
    purpose: string;
    details: string;
  }): Promise<{ success: boolean; reviewId: string }> => {
    await delay(500);
    return {
      success: true,
      reviewId: `REVIEW-${Date.now()}`,
    };
  },
};

// ═══════════════════════════════════════════════════════════
//  PAYMENT METHOD APIs
// ═══════════════════════════════════════════════════════════

export const p2pPaymentMethodApi = {
  /**
   * Get payment methods
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    return mockApiCall([
      {
        id: '1',
        type: 'bank',
        name: 'Vietcombank',
        accountNumber: '1234567890',
        verified: true,
      },
      {
        id: '2',
        type: 'bank',
        name: 'Techcombank',
        accountNumber: '0987654321',
        verified: false,
        coolingPeriod: { until: '2026-03-12 10:00', hoursLeft: 168 },
      },
    ]);
  },

  /**
   * Add payment method
   */
  addPaymentMethod: async (data: {
    type: string;
    name: string;
    accountNumber: string;
  }): Promise<{ success: boolean; methodId: string }> => {
    await delay(500);
    return {
      success: true,
      methodId: `PM-${Date.now()}`,
    };
  },

  /**
   * Verify payment method (micro-deposit)
   */
  verifyPaymentMethod: async (methodId: string, amounts: number[]): Promise<{ success: boolean }> => {
    await delay(800);
    // Mock verification logic
    const correctAmounts = [1.23, 4.56];
    const isCorrect = amounts.every((amt, idx) => Math.abs(amt - correctAmounts[idx]) < 0.01);
    if (!isCorrect) throw new Error('Incorrect amounts');
    return { success: true };
  },

  /**
   * Upload ownership proof
   */
  uploadOwnershipProof: async (methodId: string, files: File[]): Promise<{ success: boolean }> => {
    await delay(1000);
    return { success: true };
  },

  /**
   * Get payment method history
   */
  getPaymentMethodHistory: async (methodId: string): Promise<Array<{ id: string; orderId: string; type: 'buy' | 'sell'; amount: number; status: string; timestamp: string }>> => {
    return mockApiCall([
      { id: '1', orderId: '#45892', type: 'buy', amount: 36000000, status: 'completed', timestamp: '2026-03-05 14:20' },
      { id: '2', orderId: '#45880', type: 'buy', amount: 24000000, status: 'completed', timestamp: '2026-03-05 13:45' },
    ]);
  },
};

// ═══════════════════════════════════════════════════════════
//  EXPORT ALL
// ═══════════════════════════════════════════════════════════

export const p2pApi = {
  kyc: p2pKycApi,
  security: p2pSecurityApi,
  wallet: p2pWalletApi,
  compliance: p2pComplianceApi,
  paymentMethod: p2pPaymentMethodApi,
};
