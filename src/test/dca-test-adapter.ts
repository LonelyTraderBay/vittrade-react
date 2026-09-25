import type {
  CreateDCAPlanRequest,
  DCAApi,
  DCASnapshot,
  DCAPlan,
  UpdateDCAPlanRequest,
} from '@/features/dca';
import { getTestDcaSnapshot, INITIAL_DCA_PLANS } from '@/dev/mocks/dca-fixtures';

function clonePlan(plan: DCAPlan): DCAPlan {
  return {
    ...plan,
    nextExecution: new Date(plan.nextExecution),
    createdAt: new Date(plan.createdAt),
    lastPurchaseAt: plan.lastPurchaseAt ? new Date(plan.lastPurchaseAt) : undefined,
  };
}

function cloneSnapshot(snapshot: DCASnapshot): DCASnapshot {
  return {
    ...snapshot,
    plans: snapshot.plans.map(clonePlan),
    purchaseHistory: snapshot.purchaseHistory.map((item) => ({
      ...item,
      date: new Date(item.date),
    })),
    portfolioHistory: snapshot.portfolioHistory.map((item) => ({
      ...item,
      date: new Date(item.date),
    })),
  };
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export interface TestDcaApi extends DCAApi {
  getInitialSnapshot: () => DCASnapshot;
  reset: () => void;
}

export function createTestDcaApi(): TestDcaApi {
  let plans = INITIAL_DCA_PLANS.map(clonePlan);

  const snapshot = () => cloneSnapshot(getTestDcaSnapshot(plans));

  return {
    getInitialSnapshot: snapshot,
    reset() {
      plans = INITIAL_DCA_PLANS.map(clonePlan);
    },
    async getSnapshot() {
      return snapshot();
    },
    async createPlan(request: CreateDCAPlanRequest) {
      await delay(1000);
      const newPlan: DCAPlan = {
        id: `plan-${Date.now()}`,
        coinSymbol: request.coinSymbol,
        coinName: request.coinSymbol,
        coinIcon: `https://cryptologos.cc/logos/${request.coinSymbol.toLowerCase()}-logo.png`,
        frequency: request.frequency,
        amountPerPurchase: request.amountPerPurchase,
        nextExecution: request.startDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active',
        totalInvested: 0,
        currentHoldings: 0,
        averageCost: 0,
        createdAt: new Date(),
      };
      plans = [...plans, newPlan];
      return clonePlan(newPlan);
    },
    async updatePlan(planId: string, request: UpdateDCAPlanRequest) {
      await delay(500);
      const currentPlan = plans.find((plan) => plan.id === planId);
      if (!currentPlan) throw new Error('Plan not found');
      const updatedPlan = { ...currentPlan, ...request };
      plans = plans.map((plan) => (plan.id === planId ? updatedPlan : plan));
      return clonePlan(updatedPlan);
    },
    async deletePlan(planId: string) {
      await delay(500);
      plans = plans.filter((plan) => plan.id !== planId);
    },
  };
}

export const testDcaApi = createTestDcaApi();
