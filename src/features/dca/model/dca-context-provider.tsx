import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dcaApi, type DCAApi } from '../api/dca-api';
import type { CreateDCAPlanRequest, DCAPlan, DCASnapshot, UpdateDCAPlanRequest } from './dca-types';
import { DCAContext, type DCAContextType } from './dca-context';

interface DcaSeededApi extends DCAApi {
  getInitialSnapshot: () => DCASnapshot;
}

const EMPTY_OVERVIEW = {
  currentValue: 0,
  totalInvested: 0,
  profitLoss: 0,
  profitLossPercent: 0,
  activePlans: 0,
  pausedPlans: 0,
  errorPlans: 0,
  nextExecution: null,
};

interface DCAProviderProps {
  children: ReactNode;
  api?: DCAApi;
}

export function DCAProvider({ children, api }: DCAProviderProps) {
  const configuredApi = api ?? dcaApi;
  const initialSnapshot =
    (api as Partial<DcaSeededApi> | undefined)?.getInitialSnapshot?.() ?? null;
  const hasInitialSnapshot = initialSnapshot !== null;
  const [snapshot, setSnapshot] = useState<DCASnapshot | null>(initialSnapshot);
  const [isLoading, setIsLoading] = useState(!hasInitialSnapshot);
  const [isCreating, setIsCreating] = useState(false);

  const loadSnapshot = useCallback(async () => {
    setIsLoading(true);
    try {
      setSnapshot(await configuredApi.getSnapshot());
    } finally {
      setIsLoading(false);
    }
  }, [configuredApi]);

  useEffect(() => {
    if (!hasInitialSnapshot) void loadSnapshot();
  }, [hasInitialSnapshot, loadSnapshot]);

  const createPlan = useCallback(
    async (request: CreateDCAPlanRequest): Promise<DCAPlan> => {
      setIsCreating(true);
      try {
        const plan = await configuredApi.createPlan(request, crypto.randomUUID());
        await loadSnapshot();
        return plan;
      } finally {
        setIsCreating(false);
      }
    },
    [configuredApi, loadSnapshot],
  );

  const updatePlan = useCallback(
    async (planId: string, request: UpdateDCAPlanRequest): Promise<DCAPlan> => {
      setIsLoading(true);
      try {
        const plan = await configuredApi.updatePlan(planId, request, crypto.randomUUID());
        await loadSnapshot();
        return plan;
      } finally {
        setIsLoading(false);
      }
    },
    [configuredApi, loadSnapshot],
  );

  const deletePlan = useCallback(
    async (planId: string): Promise<void> => {
      setIsLoading(true);
      try {
        await configuredApi.deletePlan(planId, crypto.randomUUID());
        await loadSnapshot();
      } finally {
        setIsLoading(false);
      }
    },
    [configuredApi, loadSnapshot],
  );

  const togglePlanStatus = useCallback(
    async (planId: string): Promise<DCAPlan> => {
      const plan = snapshot?.plans.find((item) => item.id === planId);
      if (!plan) throw new Error('Plan not found');
      return updatePlan(planId, { status: plan.status === 'active' ? 'paused' : 'active' });
    },
    [snapshot, updatePlan],
  );

  const value = useMemo<DCAContextType>(
    () => ({
      overview: snapshot?.overview ?? EMPTY_OVERVIEW,
      plans: snapshot?.plans ?? [],
      purchaseHistory: snapshot?.purchaseHistory ?? [],
      portfolioHistory: snapshot?.portfolioHistory ?? [],
      createPlan,
      updatePlan,
      deletePlan,
      togglePlanStatus,
      isLoading,
      isCreating,
    }),
    [createPlan, deletePlan, isCreating, isLoading, snapshot, togglePlanStatus, updatePlan],
  );

  return <DCAContext.Provider value={value}>{children}</DCAContext.Provider>;
}
