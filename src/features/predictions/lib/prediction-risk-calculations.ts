export interface RiskMetrics {
  maxLoss: number;
  maxGain: number;
  breakEvenPrice: number;
  probabilityOfProfit: number;
  expectedValue: number;
  riskRewardRatio: number;
  kellyBetSize: number;
}

export function calculatePredictionRiskMetrics(
  shares: string,
  entryPrice: string,
  currentPrice: string,
  bankroll: string,
): RiskMetrics {
  const sh = parseFloat(shares) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const current = parseFloat(currentPrice) || 0;
  const bank = parseFloat(bankroll) || 1;

  const cost = sh * entry;
  const maxLoss = cost;
  const maxGain = sh * (1 - entry);
  const breakEvenPrice = entry;
  // Simple probability estimate from price
  const probabilityOfProfit = current * 100;

  // Expected value: (prob_win * max_gain) - (prob_loss * max_loss)
  const expectedValue = current * maxGain - (1 - current) * maxLoss;

  // Risk/Reward ratio
  const riskRewardRatio = maxLoss > 0 ? maxGain / maxLoss : 0;

  // Kelly criterion for optimal bet size: (p*b - q) / b
  // where p = probability of win, q = 1-p, b = odds (max_gain / max_loss)
  const kellyFraction =
    riskRewardRatio > 0 ? (current * riskRewardRatio - (1 - current)) / riskRewardRatio : 0;
  const kellyBetSize = Math.max(0, Math.min(1, kellyFraction)) * bank;

  return {
    maxLoss,
    maxGain,
    breakEvenPrice,
    probabilityOfProfit,
    expectedValue,
    riskRewardRatio,
    kellyBetSize,
  };
}
