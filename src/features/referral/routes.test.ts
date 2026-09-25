import { describe, expect, it } from 'vitest';
import { createReferralRoutes } from './routes';

const Stub = () => null;

describe('Referral feature routes', () => {
  it('owns the contract-backed overview URL', () => {
    expect(createReferralRoutes({ home: Stub })).toEqual([{ path: 'referral', Component: Stub }]);
  });
});
