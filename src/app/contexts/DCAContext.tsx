/**
 * DCA Context - Mock API Layer
 * 
 * Provides mock DCA data and CRUD operations
 * 
 * @module contexts/DCAContext
 */

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import {
  DCAPlan,
  DCAOverview,
  DCAPurchaseHistory,
  DCAPortfolioHistoryPoint,
  CreateDCAPlanRequest,
  UpdateDCAPlanRequest,
  DCAFrequency,
} from '../types/dca';

/**
 * DCA Context Type
 */
interface DCAContextType {
  // Data
  overview: DCAOverview;
  plans: DCAPlan[];
  purchaseHistory: DCAPurchaseHistory[];
  portfolioHistory: DCAPortfolioHistoryPoint[];
  
  // Operations
  createPlan: (request: CreateDCAPlanRequest) => Promise<DCAPlan>;
  updatePlan: (planId: string, request: UpdateDCAPlanRequest) => Promise<DCAPlan>;
  deletePlan: (planId: string) => Promise<void>;
  togglePlanStatus: (planId: string) => Promise<DCAPlan>;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
}

const DCAContext = createContext<DCAContextType | undefined>(undefined);

/**
 * Mock coin prices (VND per coin)
 */
const MOCK_PRICES: Record<string, number> = {
  BTC: 1_850_000_000, // 1.85B VND
  ETH: 85_000_000,    // 85M VND
  BNB: 12_500_000,    // 12.5M VND
  SOL: 3_200_000,     // 3.2M VND
  ADA: 15_000,        // 15K VND
};

/**
 * Calculate relative time
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (days > 1) return `${days} ngày`;
  if (hours > 1) return `${hours} giờ`;
  return date.toLocaleDateString('vi-VN');
}

/**
 * Generate mock purchase history
 */
function generatePurchaseHistory(plan: DCAPlan): DCAPurchaseHistory[] {
  const history: DCAPurchaseHistory[] = [];
  const now = new Date();
  const createdAt = plan.createdAt;
  
  // Calculate interval based on frequency
  const interval = plan.frequency === 'daily' ? 1 : plan.frequency === 'weekly' ? 7 : 30;
  
  let currentDate = new Date(createdAt);
  let totalSpent = 0;
  let totalCoins = 0;
  
  while (currentDate < now && history.length < 30) {
    const priceVariation = 0.9 + Math.random() * 0.2; // ±10% variation
    const pricePerCoin = MOCK_PRICES[plan.coinSymbol] * priceVariation;
    const coinAmount = plan.amountPerPurchase / pricePerCoin;
    
    totalSpent += plan.amountPerPurchase;
    totalCoins += coinAmount;
    
    history.push({
      id: `purchase-${plan.id}-${history.length}`,
      planId: plan.id,
      coinSymbol: plan.coinSymbol,
      date: new Date(currentDate),
      amountVND: plan.amountPerPurchase,
      coinAmount,
      pricePerCoin,
      status: 'completed',
    });
    
    // Advance date
    currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
  }
  
  return history;
}

/**
 * Generate mock portfolio history
 */
function generatePortfolioHistory(plans: DCAPlan[]): DCAPortfolioHistoryPoint[] {
  const points: DCAPortfolioHistoryPoint[] = [];
  const now = new Date();
  const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  
  let currentDate = new Date(startDate);
  let totalInvested = 0;
  
  while (currentDate <= now) {
    // Check if any plan has a purchase on this date
    let hasPurchase = false;
    
    plans.forEach((plan) => {
      const allPurchases = generatePurchaseHistory(plan);
      const purchaseOnThisDate = allPurchases.find(
        (p) => p.date.toDateString() === currentDate.toDateString()
      );
      if (purchaseOnThisDate) {
        totalInvested += purchaseOnThisDate.amountVND;
        hasPurchase = true;
      }
    });
    
    // Calculate portfolio value (with some growth/decline)
    const growthFactor = 1 + (Math.random() * 0.4 - 0.1); // -10% to +30%
    const portfolioValue = totalInvested * growthFactor;
    
    points.push({
      date: new Date(currentDate),
      portfolioValue,
      totalInvested,
      hasPurchase,
    });
    
    // Advance 1 day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return points;
}

/**
 * Mock initial plans
 */
const INITIAL_PLANS: DCAPlan[] = [
  {
    id: 'plan-1',
    coinSymbol: 'BTC',
    coinName: 'Bitcoin',
    coinIcon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    frequency: 'weekly',
    amountPerPurchase: 500_000,
    nextExecution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    status: 'active',
    totalInvested: 12_000_000,
    currentHoldings: 0.0065,
    averageCost: 1_846_153_846,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    lastPurchaseAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    id: 'plan-2',
    coinSymbol: 'ETH',
    coinName: 'Ethereum',
    coinIcon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    frequency: 'weekly',
    amountPerPurchase: 300_000,
    nextExecution: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    status: 'active',
    totalInvested: 7_200_000,
    currentHoldings: 0.085,
    averageCost: 84_705_882,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastPurchaseAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'plan-3',
    coinSymbol: 'SOL',
    coinName: 'Solana',
    coinIcon: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    frequency: 'monthly',
    amountPerPurchase: 1_000_000,
    nextExecution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    status: 'active',
    totalInvested: 3_000_000,
    currentHoldings: 940,
    averageCost: 3_191_489,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    lastPurchaseAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

/**
 * DCA Provider Component
 */
export function DCAProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<DCAPlan[]>(INITIAL_PLANS);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Calculate overview
  const overview = useMemo((): DCAOverview => {
    const totalInvested = plans.reduce((sum, plan) => sum + plan.totalInvested, 0);
    
    // Calculate current value (holdings × current price)
    const currentValue = plans.reduce((sum, plan) => {
      const currentPrice = MOCK_PRICES[plan.coinSymbol] || 0;
      return sum + plan.currentHoldings * currentPrice;
    }, 0);
    
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    
    const activePlans = plans.filter((p) => p.status === 'active').length;
    const pausedPlans = plans.filter((p) => p.status === 'paused').length;
    const errorPlans = plans.filter((p) => p.status === 'error').length;
    
    // Find next execution
    const activePlansWithExecution = plans
      .filter((p) => p.status === 'active')
      .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime());
    
    const nextExecution = activePlansWithExecution.length > 0
      ? {
          relativeTime: getRelativeTime(activePlansWithExecution[0].nextExecution),
          amount: activePlansWithExecution[0].amountPerPurchase,
        }
      : null;
    
    return {
      currentValue,
      totalInvested,
      profitLoss,
      profitLossPercent,
      activePlans,
      pausedPlans,
      errorPlans,
      nextExecution,
    };
  }, [plans]);

  // Purchase history
  const purchaseHistory = useMemo(() => {
    return plans.flatMap((plan) => generatePurchaseHistory(plan));
  }, [plans]);

  // Portfolio history
  const portfolioHistory = useMemo(() => {
    return generatePortfolioHistory(plans);
  }, [plans]);

  // Create plan
  const createPlan = useCallback(async (request: CreateDCAPlanRequest): Promise<DCAPlan> => {
    setIsCreating(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newPlan: DCAPlan = {
      id: `plan-${Date.now()}`,
      coinSymbol: request.coinSymbol,
      coinName: request.coinSymbol, // In real app, fetch from coin API
      coinIcon: `https://cryptologos.cc/logos/${request.coinSymbol.toLowerCase()}-logo.png`,
      frequency: request.frequency,
      amountPerPurchase: request.amountPerPurchase,
      nextExecution: request.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'active',
      totalInvested: 0,
      currentHoldings: 0,
      averageCost: 0,
      createdAt: new Date(),
    };
    
    setPlans((prev) => [...prev, newPlan]);
    setIsCreating(false);
    
    return newPlan;
  }, []);

  // Update plan
  const updatePlan = useCallback(async (planId: string, request: UpdateDCAPlanRequest): Promise<DCAPlan> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.id === planId) {
          return { ...plan, ...request };
        }
        return plan;
      })
    );
    
    setIsLoading(false);
    
    const updatedPlan = plans.find((p) => p.id === planId);
    if (!updatedPlan) throw new Error('Plan not found');
    
    return updatedPlan;
  }, [plans]);

  // Delete plan
  const deletePlan = useCallback(async (planId: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setPlans((prev) => prev.filter((plan) => plan.id !== planId));
    
    setIsLoading(false);
  }, []);

  // Toggle plan status (active <-> paused)
  const togglePlanStatus = useCallback(async (planId: string): Promise<DCAPlan> => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw new Error('Plan not found');
    
    const newStatus = plan.status === 'active' ? 'paused' : 'active';
    
    return updatePlan(planId, { status: newStatus });
  }, [plans, updatePlan]);

  const value: DCAContextType = {
    overview,
    plans,
    purchaseHistory,
    portfolioHistory,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    isLoading,
    isCreating,
  };

  return <DCAContext.Provider value={value}>{children}</DCAContext.Provider>;
}

/**
 * useDCA Hook
 */
export function useDCA() {
  const context = useContext(DCAContext);
  if (!context) {
    throw new Error('useDCA must be used within DCAProvider');
  }
  return context;
}
