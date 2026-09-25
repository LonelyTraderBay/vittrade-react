import { createContext } from 'react';
import type {
  CreateDCAPlanRequest,
  DCAOverview,
  DCAPlan,
  DCAPortfolioHistoryPoint,
  DCAPurchaseHistory,
  UpdateDCAPlanRequest,
} from './dca-types';

export interface DCAContextType {
  overview: DCAOverview;
  plans: DCAPlan[];
  purchaseHistory: DCAPurchaseHistory[];
  portfolioHistory: DCAPortfolioHistoryPoint[];
  createPlan: (request: CreateDCAPlanRequest) => Promise<DCAPlan>;
  updatePlan: (planId: string, request: UpdateDCAPlanRequest) => Promise<DCAPlan>;
  deletePlan: (planId: string) => Promise<void>;
  togglePlanStatus: (planId: string) => Promise<DCAPlan>;
  isLoading: boolean;
  isCreating: boolean;
}

export const DCAContext = createContext<DCAContextType | undefined>(undefined);
