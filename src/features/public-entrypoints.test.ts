import { describe, expect, it } from 'vitest';
import * as admin from './admin';
import * as arena from './arena';
import * as auth from './auth';
import * as discovery from './discovery';
import * as predictions from './predictions';
import * as referral from './referral';
import * as theme from '../shared/theme';

describe('feature public entry points', () => {
  it('exposes the supported API from each feature barrel', () => {
    expect(admin.createAdminRoutes).toBeTypeOf('function');
    expect(arena.createArenaRoutes).toBeTypeOf('function');
    expect(auth.createAuthApi).toBeTypeOf('function');
    expect(discovery.createDiscoveryRoutes).toBeTypeOf('function');
    expect(predictions.createPredictionRoutes).toBeTypeOf('function');
    expect(referral.createReferralRoutes).toBeTypeOf('function');
    expect(theme.getDensityMetrics('standard').controlHeight).toBeGreaterThan(0);
  });
});
