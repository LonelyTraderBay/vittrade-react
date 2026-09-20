/**
 * ══════════════════════════════════════════════════════════════
 *  Copy Trading Mock Data Generators
 * ══════════════════════════════════════════════════════════════
 */

export interface MockCopyProvider {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  tier: 'basic' | 'verified' | 'pro';
  stats: {
    roi30d: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    copiers: number;
    aum: number;
  };
  fees: {
    performance: number;
    platform: number;
  };
  risk: 'low' | 'medium' | 'high';
}

export interface MockCopyRelationship {
  id: string;
  providerId: string;
  providerName: string;
  status: 'active' | 'paused' | 'stopped';
  copyMode: 'mirror' | 'market' | 'smart';
  positionSizing: number;
  allocation: number;
  pnl: number;
  pnlPercent: number;
}

export interface MockRiskAssessment {
  id: string;
  userId: string;
  score: number;
  suitability: 'unsuitable' | 'suitable' | 'highly_suitable';
  responses: {
    experience: string;
    riskTolerance: string;
    capitalAllocation: string;
    understanding: number;
    lossAcceptance: boolean;
  };
}

/**
 * Generate mock provider
 */
export function createMockProvider(
  overrides?: Partial<MockCopyProvider>
): MockCopyProvider {
  const defaults: MockCopyProvider = {
    id: `provider-${Math.random().toString(36).substr(2, 9)}`,
    name: 'CryptoKing',
    avatar: 'https://i.pravatar.cc/150?img=1',
    verified: true,
    tier: 'verified',
    stats: {
      roi30d: 15.5,
      maxDrawdown: -12.3,
      sharpeRatio: 2.1,
      winRate: 78,
      totalTrades: 245,
      copiers: 1250,
      aum: 2500000,
    },
    fees: {
      performance: 10,
      platform: 0.1,
    },
    risk: 'medium',
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate multiple mock providers
 */
export function createMockProviders(count: number): MockCopyProvider[] {
  const names = [
    'CryptoKing',
    'SwingMaster',
    'AlgoTrader',
    'TrendFollower',
    'ScalpingPro',
  ];
  const tiers: Array<'basic' | 'verified' | 'pro'> = [
    'basic',
    'verified',
    'pro',
  ];
  const risks: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

  return Array.from({ length: count }, (_, i) =>
    createMockProvider({
      id: `provider-${i + 1}`,
      name: names[i % names.length],
      tier: tiers[i % tiers.length],
      risk: risks[i % risks.length],
      stats: {
        roi30d: Math.random() * 50 - 10,
        maxDrawdown: -(Math.random() * 30),
        sharpeRatio: Math.random() * 3,
        winRate: 50 + Math.random() * 40,
        totalTrades: Math.floor(Math.random() * 1000) + 100,
        copiers: Math.floor(Math.random() * 5000),
        aum: Math.floor(Math.random() * 10000000),
      },
    })
  );
}

/**
 * Generate mock copy relationship
 */
export function createMockCopyRelationship(
  overrides?: Partial<MockCopyRelationship>
): MockCopyRelationship {
  const defaults: MockCopyRelationship = {
    id: `copy-${Math.random().toString(36).substr(2, 9)}`,
    providerId: 'provider-1',
    providerName: 'CryptoKing',
    status: 'active',
    copyMode: 'smart',
    positionSizing: 50,
    allocation: 1500,
    pnl: 125.5,
    pnlPercent: 8.37,
  };

  return { ...defaults, ...overrides };
}

/**
 * Generate mock risk assessment
 */
export function createMockRiskAssessment(
  overrides?: Partial<MockRiskAssessment>
): MockRiskAssessment {
  const defaults: MockRiskAssessment = {
    id: `assessment-${Math.random().toString(36).substr(2, 9)}`,
    userId: 'user-1',
    score: 85,
    suitability: 'suitable',
    responses: {
      experience: 'intermediate',
      riskTolerance: 'moderate',
      capitalAllocation: 'medium',
      understanding: 80,
      lossAcceptance: true,
    },
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock API responses
 */
export const mockApiResponses = {
  getProviders: () => ({
    success: true,
    data: createMockProviders(5),
  }),

  getProvider: (id: string) => ({
    success: true,
    data: createMockProvider({ id }),
  }),

  startCopy: () => ({
    success: true,
    data: {
      copyId: 'copy-new-123',
      message: 'Copy started successfully',
    },
  }),

  submitAssessment: (score: number) => ({
    success: true,
    data: createMockRiskAssessment({ score }),
  }),

  getActiveCopies: () => ({
    success: true,
    data: [
      createMockCopyRelationship({ id: 'copy-1', status: 'active' }),
      createMockCopyRelationship({ id: 'copy-2', status: 'paused' }),
    ],
  }),
};

/**
 * Mock copy trades
 */
export interface MockCopyTrade {
  id: string;
  copyId: string;
  symbol: string;
  side: 'buy' | 'sell';
  providerPrice: number;
  userPrice: number;
  amount: number;
  slippage: number;
  pnl: number;
  timestamp: string;
}

export function createMockTrade(
  overrides?: Partial<MockCopyTrade>
): MockCopyTrade {
  const defaults: MockCopyTrade = {
    id: `trade-${Math.random().toString(36).substr(2, 9)}`,
    copyId: 'copy-1',
    symbol: 'BTCUSDT',
    side: 'buy',
    providerPrice: 68500,
    userPrice: 68525,
    amount: 0.05,
    slippage: 0.036,
    pnl: 12.5,
    timestamp: new Date().toISOString(),
  };

  return { ...defaults, ...overrides };
}

/**
 * Mock performance data
 */
export interface MockPerformanceData {
  date: string;
  providerEquity: number;
  userEquity: number;
  slippageCost: number;
}

export function createMockPerformanceData(
  days: number
): MockPerformanceData[] {
  const data: MockPerformanceData[] = [];
  let providerEquity = 1000;
  let userEquity = 1000;
  let cumulativeSlippage = 0;

  for (let i = 0; i < days; i++) {
    const dailyReturn = (Math.random() - 0.45) * 0.05; // Slightly positive bias
    const slippage = Math.random() * 0.002;

    providerEquity *= 1 + dailyReturn;
    userEquity *= 1 + dailyReturn - slippage;
    cumulativeSlippage += userEquity * slippage;

    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      providerEquity: Math.round(providerEquity * 100) / 100,
      userEquity: Math.round(userEquity * 100) / 100,
      slippageCost: Math.round(cumulativeSlippage * 100) / 100,
    });
  }

  return data;
}
