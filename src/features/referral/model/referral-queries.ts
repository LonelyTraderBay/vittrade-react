import { useQuery } from '@tanstack/react-query';
import { referralApi } from '../api/referral-api';

export const referralQueryKeys = {
  overview: ['referral', 'overview'] as const,
};

export function useReferralOverviewQuery() {
  return useQuery({
    queryKey: referralQueryKeys.overview,
    queryFn: ({ signal }) => referralApi.getOverview(signal),
    staleTime: 30_000,
  });
}
