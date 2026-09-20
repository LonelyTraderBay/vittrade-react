/**
 * ══════════════════════════════════════════════════════════
 *  DCAContext Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for DCA (Dollar-Cost Averaging) context
 *
 *  Run: npx vitest run src/app/__tests__/DCAContext.test.tsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { DCAProvider, useDCA } from '../contexts/DCAContext';
import type { CreateDCAPlanRequest, UpdateDCAPlanRequest, DCAPlan } from '../types/dca';

describe('DCAContext', () => {
  describe('Initial State', () => {
    it('should provide initial plans', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.plans).toHaveLength(3);
    });

    it('should have BTC plan', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const btcPlan = result.current.plans.find((p) => p.coinSymbol === 'BTC');
      expect(btcPlan).toBeDefined();
      expect(btcPlan?.coinName).toBe('Bitcoin');
      expect(btcPlan?.frequency).toBe('weekly');
    });

    it('should have ETH plan', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const ethPlan = result.current.plans.find((p) => p.coinSymbol === 'ETH');
      expect(ethPlan).toBeDefined();
      expect(ethPlan?.coinName).toBe('Ethereum');
    });

    it('should have SOL plan', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const solPlan = result.current.plans.find((p) => p.coinSymbol === 'SOL');
      expect(solPlan).toBeDefined();
      expect(solPlan?.coinName).toBe('Solana');
      expect(solPlan?.frequency).toBe('monthly');
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCreating).toBe(false);
    });

    it('should provide overview data', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.overview).toBeDefined();
      expect(result.current.overview).toHaveProperty('currentValue');
      expect(result.current.overview).toHaveProperty('totalInvested');
      expect(result.current.overview).toHaveProperty('profitLoss');
      expect(result.current.overview).toHaveProperty('profitLossPercent');
    });

    it('should provide purchase history', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.purchaseHistory).toBeDefined();
      expect(Array.isArray(result.current.purchaseHistory)).toBe(true);
    });

    it('should provide portfolio history', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.portfolioHistory).toBeDefined();
      expect(Array.isArray(result.current.portfolioHistory)).toBe(true);
    });
  });

  describe('Overview Calculations', () => {
    it('should calculate total invested', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.overview.totalInvested).toBeGreaterThan(0);
      expect(typeof result.current.overview.totalInvested).toBe('number');
    });

    it('should calculate current value', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.overview.currentValue).toBeGreaterThan(0);
      expect(typeof result.current.overview.currentValue).toBe('number');
    });

    it('should calculate profit/loss', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(typeof result.current.overview.profitLoss).toBe('number');
    });

    it('should calculate profit/loss percentage', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(typeof result.current.overview.profitLossPercent).toBe('number');
    });

    it('should count active plans correctly', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const activePlans = result.current.plans.filter((p) => p.status === 'active').length;
      expect(result.current.overview.activePlans).toBe(activePlans);
    });

    it('should count paused plans correctly', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const pausedPlans = result.current.plans.filter((p) => p.status === 'paused').length;
      expect(result.current.overview.pausedPlans).toBe(pausedPlans);
    });

    it('should count error plans correctly', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const errorPlans = result.current.plans.filter((p) => p.status === 'error').length;
      expect(result.current.overview.errorPlans).toBe(errorPlans);
    });

    it('should provide next execution info', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      if (result.current.overview.nextExecution) {
        expect(result.current.overview.nextExecution).toHaveProperty('relativeTime');
        expect(result.current.overview.nextExecution).toHaveProperty('amount');
      }
    });
  });

  describe('Create Plan', () => {
    it('should create a new plan', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialCount = result.current.plans.length;

      const newPlanRequest: CreateDCAPlanRequest = {
        coinSymbol: 'BNB',
        frequency: 'weekly',
        amountPerPurchase: 200_000,
      };

      await act(async () => {
        await result.current.createPlan(newPlanRequest);
      });

      expect(result.current.plans.length).toBe(initialCount + 1);
    });

    it('should return created plan', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const newPlanRequest: CreateDCAPlanRequest = {
        coinSymbol: 'ADA',
        frequency: 'daily',
        amountPerPurchase: 50_000,
      };

      let createdPlan;
      await act(async () => {
        createdPlan = await result.current.createPlan(newPlanRequest);
      });

      expect(createdPlan).toBeDefined();
      expect(createdPlan).toHaveProperty('id');
      expect(createdPlan).toHaveProperty('coinSymbol', 'ADA');
      expect(createdPlan).toHaveProperty('frequency', 'daily');
      expect(createdPlan).toHaveProperty('amountPerPurchase', 50_000);
    });

    it('should set isCreating to true during creation', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const newPlanRequest: CreateDCAPlanRequest = {
        coinSymbol: 'BNB',
        frequency: 'weekly',
        amountPerPurchase: 200_000,
      };

      let isCreatingDuringCall = false;

      act(() => {
        result.current.createPlan(newPlanRequest).then(() => {
          // After completion
        });
      });

      // Check during async operation
      await waitFor(
        () => {
          if (result.current.isCreating) {
            isCreatingDuringCall = true;
          }
        },
        { timeout: 100 },
      );

      // The loading flag must have been observed while the request was in flight
      expect(isCreatingDuringCall).toBe(true);

      // Wait for completion (createPlan simulates a 1000ms API delay)
      await waitFor(
        () => {
          expect(result.current.isCreating).toBe(false);
        },
        { timeout: 2500 },
      );
    });

    it('should create plan with custom start date', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const newPlanRequest: CreateDCAPlanRequest = {
        coinSymbol: 'SOL',
        frequency: 'weekly',
        amountPerPurchase: 100_000,
        startDate: futureDate,
      };

      let createdPlan: DCAPlan | undefined;
      await act(async () => {
        createdPlan = await result.current.createPlan(newPlanRequest);
      });

      expect(createdPlan).toBeDefined();
      expect(createdPlan?.nextExecution).toBeInstanceOf(Date);
    });

    it('should create multiple plans', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialCount = result.current.plans.length;

      await act(async () => {
        await result.current.createPlan({
          coinSymbol: 'BNB',
          frequency: 'weekly',
          amountPerPurchase: 100_000,
        });

        await result.current.createPlan({
          coinSymbol: 'ADA',
          frequency: 'daily',
          amountPerPurchase: 50_000,
        });
      });

      expect(result.current.plans.length).toBe(initialCount + 2);
    });
  });

  describe('Update Plan', () => {
    it('should update plan amount', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];
      const newAmount = 1_000_000;

      const updateRequest: UpdateDCAPlanRequest = {
        amountPerPurchase: newAmount,
      };

      await act(async () => {
        await result.current.updatePlan(plan.id, updateRequest);
      });

      const updatedPlan = result.current.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.amountPerPurchase).toBe(newAmount);
    });

    it('should update plan frequency', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];

      const updateRequest: UpdateDCAPlanRequest = {
        frequency: 'daily',
      };

      await act(async () => {
        await result.current.updatePlan(plan.id, updateRequest);
      });

      const updatedPlan = result.current.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.frequency).toBe('daily');
    });

    it('should update plan status', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];

      const updateRequest: UpdateDCAPlanRequest = {
        status: 'paused',
      };

      await act(async () => {
        await result.current.updatePlan(plan.id, updateRequest);
      });

      const updatedPlan = result.current.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.status).toBe('paused');
    });

    it('should set isLoading during update', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];

      act(() => {
        result.current.updatePlan(plan.id, { amountPerPurchase: 500_000 });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should update multiple fields at once', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];

      const updateRequest: UpdateDCAPlanRequest = {
        amountPerPurchase: 750_000,
        frequency: 'monthly',
        status: 'paused',
      };

      await act(async () => {
        await result.current.updatePlan(plan.id, updateRequest);
      });

      const updatedPlan = result.current.plans.find((p) => p.id === plan.id);
      expect(updatedPlan?.amountPerPurchase).toBe(750_000);
      expect(updatedPlan?.frequency).toBe('monthly');
      expect(updatedPlan?.status).toBe('paused');
    });
  });

  describe('Delete Plan', () => {
    it('should delete a plan', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialCount = result.current.plans.length;
      const planToDelete = result.current.plans[0];

      await act(async () => {
        await result.current.deletePlan(planToDelete.id);
      });

      expect(result.current.plans.length).toBe(initialCount - 1);
      expect(result.current.plans.find((p) => p.id === planToDelete.id)).toBeUndefined();
    });

    it('should delete multiple plans', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialCount = result.current.plans.length;
      const plan1 = result.current.plans[0];
      const plan2 = result.current.plans[1];

      await act(async () => {
        await result.current.deletePlan(plan1.id);
        await result.current.deletePlan(plan2.id);
      });

      expect(result.current.plans.length).toBe(initialCount - 2);
    });

    it('should set isLoading during deletion', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const plan = result.current.plans[0];

      act(() => {
        result.current.deletePlan(plan.id);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should update overview after deletion', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialActivePlans = result.current.overview.activePlans;
      const activePlan = result.current.plans.find((p) => p.status === 'active');

      if (activePlan) {
        await act(async () => {
          await result.current.deletePlan(activePlan.id);
        });

        expect(result.current.overview.activePlans).toBe(initialActivePlans - 1);
      }
    });
  });

  describe('Toggle Plan Status', () => {
    it('should toggle active plan to paused', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const activePlan = result.current.plans.find((p) => p.status === 'active');

      if (activePlan) {
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        const updatedPlan = result.current.plans.find((p) => p.id === activePlan.id);
        expect(updatedPlan?.status).toBe('paused');
      }
    });

    it('should toggle paused plan to active', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const activePlan = result.current.plans.find((p) => p.status === 'active');

      if (activePlan) {
        // Pause first
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        const pausedPlan = result.current.plans.find((p) => p.id === activePlan.id);
        expect(pausedPlan?.status).toBe('paused');

        // Toggle back to active
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        const reactivatedPlan = result.current.plans.find((p) => p.id === activePlan.id);
        expect(reactivatedPlan?.status).toBe('active');
      }
    });

    it('should update overview after status toggle', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const initialActivePlans = result.current.overview.activePlans;
      const activePlan = result.current.plans.find((p) => p.status === 'active');

      if (activePlan) {
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        expect(result.current.overview.activePlans).toBe(initialActivePlans - 1);
        expect(result.current.overview.pausedPlans).toBeGreaterThan(0);
      }
    });
  });

  describe('Purchase History', () => {
    it('should generate purchase history for plans', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.purchaseHistory.length).toBeGreaterThan(0);
    });

    it('should have valid purchase history entries', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const purchase = result.current.purchaseHistory[0];

      expect(purchase).toHaveProperty('id');
      expect(purchase).toHaveProperty('planId');
      expect(purchase).toHaveProperty('coinSymbol');
      expect(purchase).toHaveProperty('date');
      expect(purchase).toHaveProperty('amountVND');
      expect(purchase).toHaveProperty('coinAmount');
      expect(purchase).toHaveProperty('pricePerCoin');
      expect(purchase).toHaveProperty('status');
    });

    it('should have purchases for each plan', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      result.current.plans.forEach((plan) => {
        const planPurchases = result.current.purchaseHistory.filter((p) => p.planId === plan.id);
        expect(planPurchases.length).toBeGreaterThan(0);
      });
    });

    it('should have completed status for purchases', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const completedPurchases = result.current.purchaseHistory.filter(
        (p) => p.status === 'completed',
      );
      expect(completedPurchases.length).toBeGreaterThan(0);
    });
  });

  describe('Portfolio History', () => {
    it('should generate portfolio history', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      expect(result.current.portfolioHistory.length).toBeGreaterThan(0);
    });

    it('should have valid portfolio history points', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const point = result.current.portfolioHistory[0];

      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('portfolioValue');
      expect(point).toHaveProperty('totalInvested');
      expect(point).toHaveProperty('hasPurchase');
    });

    it('should have chronological portfolio history', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const history = result.current.portfolioHistory;

      for (let i = 1; i < history.length; i++) {
        expect(history[i].date.getTime()).toBeGreaterThanOrEqual(history[i - 1].date.getTime());
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useDCA is used outside DCAProvider', () => {
      expect(() => {
        renderHook(() => useDCA());
      }).toThrow('useDCA must be used within DCAProvider');
    });

    it('should throw error when updating non-existent plan', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.updatePlan('non-existent-id', {
            amountPerPurchase: 100_000,
          });
        });
      }).rejects.toThrow('Plan not found');
    });

    it('should throw error when toggling non-existent plan', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      await expect(async () => {
        await act(async () => {
          await result.current.togglePlanStatus('non-existent-id');
        });
      }).rejects.toThrow('Plan not found');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support creating and managing a DCA strategy', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      // Create new plan
      await act(async () => {
        await result.current.createPlan({
          coinSymbol: 'BNB',
          frequency: 'weekly',
          amountPerPurchase: 250_000,
        });
      });

      const newPlan = result.current.plans.find((p) => p.coinSymbol === 'BNB');
      expect(newPlan).toBeDefined();

      // Update amount
      if (newPlan) {
        await act(async () => {
          await result.current.updatePlan(newPlan.id, {
            amountPerPurchase: 300_000,
          });
        });

        const updated = result.current.plans.find((p) => p.id === newPlan.id);
        expect(updated?.amountPerPurchase).toBe(300_000);
      }
    });

    it('should support pausing and resuming plans', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const activePlan = result.current.plans.find((p) => p.status === 'active');

      if (activePlan) {
        // Pause
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        let plan = result.current.plans.find((p) => p.id === activePlan.id);
        expect(plan?.status).toBe('paused');

        // Resume
        await act(async () => {
          await result.current.togglePlanStatus(activePlan.id);
        });

        plan = result.current.plans.find((p) => p.id === activePlan.id);
        expect(plan?.status).toBe('active');
      }
    });

    it('should track portfolio performance over time', () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const { overview } = result.current;

      expect(overview.totalInvested).toBeGreaterThan(0);
      expect(overview.currentValue).toBeGreaterThan(0);
      expect(typeof overview.profitLoss).toBe('number');
      expect(typeof overview.profitLossPercent).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deleting all plans', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const planIds = result.current.plans.map((p) => p.id);

      await act(async () => {
        for (const id of planIds) {
          await result.current.deletePlan(id);
        }
      });

      expect(result.current.plans.length).toBe(0);
      expect(result.current.overview.activePlans).toBe(0);
      expect(result.current.overview.totalInvested).toBe(0);
    });

    it('should handle creating plan with minimal data', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      const minimalRequest: CreateDCAPlanRequest = {
        coinSymbol: 'BTC',
        frequency: 'weekly',
        amountPerPurchase: 100_000,
      };

      let createdPlan: DCAPlan | undefined;
      await act(async () => {
        createdPlan = await result.current.createPlan(minimalRequest);
      });

      expect(createdPlan).toBeDefined();
      expect(createdPlan?.status).toBe('active');
      expect(createdPlan?.totalInvested).toBe(0);
      expect(createdPlan?.currentHoldings).toBe(0);
    });

    it('should handle rapid plan operations', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      // Each operation runs in its own act() so React commits state between
      // operations and the context callbacks observe fresh `plans`.
      let planId = '';
      await act(async () => {
        const plan1 = await result.current.createPlan({
          coinSymbol: 'BNB',
          frequency: 'daily',
          amountPerPurchase: 50_000,
        });
        planId = plan1.id;
      });

      await act(async () => {
        await result.current.updatePlan(planId, { amountPerPurchase: 75_000 });
      });

      await act(async () => {
        await result.current.togglePlanStatus(planId);
      });

      await act(async () => {
        await result.current.deletePlan(planId);
      });

      // Should not crash
      expect(result.current.plans).toBeDefined();
      // The plan should be gone
      expect(result.current.plans.find((p) => p.id === planId)).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should handle large number of plans', async () => {
      const { result } = renderHook(() => useDCA(), {
        wrapper: DCAProvider,
      });

      // Start all creations concurrently — each simulates its own 1000ms
      // API delay, so the batch completes in ~1s instead of 10s.
      await act(async () => {
        await Promise.all(
          Array.from({ length: 10 }, (_, i) =>
            result.current.createPlan({
              coinSymbol: i % 2 === 0 ? 'BTC' : 'ETH',
              frequency: 'weekly',
              amountPerPurchase: 100_000,
            }),
          ),
        );
      });

      expect(result.current.plans.length).toBeGreaterThanOrEqual(10);
      expect(result.current.overview).toBeDefined();
    });
  });
});
