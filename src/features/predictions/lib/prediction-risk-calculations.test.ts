import { describe, expect, it } from 'vitest';
import { calculatePredictionRiskMetrics } from './prediction-risk-calculations';

describe('calculatePredictionRiskMetrics', () => {
  it('calculates payout, expected value, risk reward and Kelly sizing', () => {
    const metrics = calculatePredictionRiskMetrics('10', '0.4', '0.6', '1000');
    expect(metrics).toMatchObject({
      maxLoss: 4,
      maxGain: 6,
      breakEvenPrice: 0.4,
      probabilityOfProfit: 60,
      riskRewardRatio: 1.5,
    });
    expect(metrics.expectedValue).toBeCloseTo(2);
    expect(metrics.kellyBetSize).toBeCloseTo(1000 / 3);
  });

  it('floors negative Kelly sizing and treats invalid inputs as zero exposure', () => {
    const lowProbability = calculatePredictionRiskMetrics('10', '0.4', '0.2', '1000');
    expect(lowProbability.kellyBetSize).toBe(0);

    const invalid = calculatePredictionRiskMetrics('invalid', 'invalid', 'invalid', 'invalid');
    expect(invalid).toEqual({
      maxLoss: 0,
      maxGain: 0,
      breakEvenPrice: 0,
      probabilityOfProfit: 0,
      expectedValue: 0,
      riskRewardRatio: 0,
      kellyBetSize: 0,
    });
  });
});
