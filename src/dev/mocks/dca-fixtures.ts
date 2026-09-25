import type {
  DCAOverview,
  DCAPlan,
  DCAPortfolioHistoryPoint,
  DCAPurchaseHistory,
} from '@/features/dca';

export const INITIAL_DCA_PLANS: DCAPlan[] = [
  {
    id: 'plan-1',
    coinSymbol: 'BTC',
    coinName: 'Bitcoin',
    coinIcon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    frequency: 'weekly',
    amountPerPurchase: 500_000,
    nextExecution: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'active',
    totalInvested: 12_000_000,
    currentHoldings: 0.0065,
    averageCost: 1_846_153_846,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    lastPurchaseAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'plan-2',
    coinSymbol: 'ETH',
    coinName: 'Ethereum',
    coinIcon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    frequency: 'weekly',
    amountPerPurchase: 300_000,
    nextExecution: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
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
    nextExecution: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    status: 'active',
    totalInvested: 3_000_000,
    currentHoldings: 940,
    averageCost: 3_191_489,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    lastPurchaseAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

const TEST_PRICES: Record<string, number> = {
  BTC: 1_850_000_000,
  ETH: 85_000_000,
  BNB: 12_500_000,
  SOL: 3_200_000,
  ADA: 15_000,
};

function getRelativeTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (days > 1) return `${days} ngày`;
  if (hours > 1) return `${hours} giờ`;
  return date.toLocaleDateString('vi-VN');
}

export function generateTestPurchaseHistory(plan: DCAPlan): DCAPurchaseHistory[] {
  const history: DCAPurchaseHistory[] = [];
  const interval = plan.frequency === 'daily' ? 1 : plan.frequency === 'weekly' ? 7 : 30;
  let currentDate = new Date(plan.createdAt);
  while (currentDate < new Date() && history.length < 30) {
    const pricePerCoin =
      (TEST_PRICES[plan.coinSymbol] ?? 1) * (0.95 + (history.length % 5) * 0.025);
    history.push({
      id: `purchase-${plan.id}-${history.length}`,
      planId: plan.id,
      coinSymbol: plan.coinSymbol,
      date: new Date(currentDate),
      amountVND: plan.amountPerPurchase,
      coinAmount: plan.amountPerPurchase / pricePerCoin,
      pricePerCoin,
      status: 'completed',
    });
    currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
  }
  return history;
}

export function generateTestPortfolioHistory(plans: DCAPlan[]): DCAPortfolioHistoryPoint[] {
  const points: DCAPortfolioHistoryPoint[] = [];
  const now = new Date();
  let totalInvested = 0;
  for (let day = 90; day >= 0; day -= 1) {
    const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    const hasPurchase = plans.some((plan) =>
      generateTestPurchaseHistory(plan).some(
        (purchase) => purchase.date.toDateString() === date.toDateString(),
      ),
    );
    if (hasPurchase)
      totalInvested += plans.reduce((sum, plan) => sum + plan.amountPerPurchase, 0) / 30;
    points.push({
      date,
      portfolioValue: totalInvested * (1 + ((90 - day) % 10) / 100),
      totalInvested,
      hasPurchase,
    });
  }
  return points;
}

export function getTestDcaOverview(plans: DCAPlan[]): DCAOverview {
  const totalInvested = plans.reduce((sum, plan) => sum + plan.totalInvested, 0);
  const currentValue = plans.reduce(
    (sum, plan) => sum + plan.currentHoldings * (TEST_PRICES[plan.coinSymbol] ?? 0),
    0,
  );
  const activePlans = plans.filter((plan) => plan.status === 'active');
  const nextPlan = [...activePlans].sort(
    (a, b) => a.nextExecution.getTime() - b.nextExecution.getTime(),
  )[0];
  const profitLoss = currentValue - totalInvested;
  return {
    currentValue,
    totalInvested,
    profitLoss,
    profitLossPercent: totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0,
    activePlans: activePlans.length,
    pausedPlans: plans.filter((plan) => plan.status === 'paused').length,
    errorPlans: plans.filter((plan) => plan.status === 'error').length,
    nextExecution: nextPlan
      ? {
          relativeTime: getRelativeTime(nextPlan.nextExecution),
          amount: nextPlan.amountPerPurchase,
        }
      : null,
  };
}

export function getTestDcaSnapshot(plans: DCAPlan[] = INITIAL_DCA_PLANS) {
  return {
    overview: getTestDcaOverview(plans),
    plans,
    purchaseHistory: plans.flatMap(generateTestPurchaseHistory),
    portfolioHistory: generateTestPortfolioHistory(plans),
  };
}
