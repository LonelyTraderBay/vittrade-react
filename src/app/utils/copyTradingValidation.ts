/**
 * ══════════════════════════════════════════════════════════════
 *  Copy Trading Data Validation
 * ══════════════════════════════════════════════════════════════
 * 
 * Runtime validation for Copy Trading data integrity
 * Ensures mock data meets business rules and prevents UI bugs
 */

import type { CopyTrader } from '../data/mockData';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate a single Copy Trader object
 * 
 * @param trader - Copy trader data to validate
 * @returns Validation result with errors if any
 * 
 * @example
 * ```ts
 * const result = validateCopyTrader(trader);
 * if (!result.isValid) {
 *   console.warn('Validation errors:', result.errors);
 * }
 * ```
 */
export function validateCopyTrader(trader: CopyTrader): ValidationResult {
  const errors: string[] = [];
  
  // Check copiers vs maxCopiers
  if (trader.copiers > trader.maxCopiers) {
    errors.push(`${trader.name}: copiers (${trader.copiers}) exceeds maxCopiers (${trader.maxCopiers})`);
  }
  
  // Check weeklyPnl array length
  if (trader.weeklyPnl.length !== 7) {
    errors.push(`${trader.name}: weeklyPnl should have exactly 7 days, got ${trader.weeklyPnl.length}`);
  }
  
  // Check maxDrawdown is negative
  if (trader.maxDrawdown > 0) {
    errors.push(`${trader.name}: maxDrawdown should be negative, got ${trader.maxDrawdown}`);
  }
  
  // Check winRate is between 0-100
  if (trader.winRate < 0 || trader.winRate > 100) {
    errors.push(`${trader.name}: winRate should be 0-100%, got ${trader.winRate}%`);
  }
  
  // Check totalPnlPct matches totalPnl calculation
  const calculatedPct = (trader.totalPnl / trader.aum) * 100;
  const difference = Math.abs(calculatedPct - trader.totalPnlPct);
  if (difference > 50) { // Allow some variance for mock data
    errors.push(`${trader.name}: totalPnlPct (${trader.totalPnlPct}%) doesn't match totalPnl/AUM calculation (${calculatedPct.toFixed(1)}%)`);
  }
  
  // Check sharpe ratio is reasonable
  if (trader.sharpeRatio < 0 || trader.sharpeRatio > 5) {
    errors.push(`${trader.name}: sharpeRatio (${trader.sharpeRatio}) seems unrealistic (expected 0-5)`);
  }
  
  // Check required fields
  if (!trader.id || !trader.name || !trader.avatar) {
    errors.push(`${trader.name || 'Unknown'}: missing required fields (id, name, or avatar)`);
  }
  
  // Check riskLevel is valid
  const validRiskLevels = ['low', 'medium', 'high'];
  if (!validRiskLevels.includes(trader.riskLevel)) {
    errors.push(`${trader.name}: invalid riskLevel "${trader.riskLevel}" (expected: ${validRiskLevels.join(', ')})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate array of Copy Traders
 */
export function validateCopyTraders(traders: CopyTrader[]): ValidationResult {
  const allErrors: string[] = [];
  
  // Check for duplicate IDs
  const ids = traders.map(t => t.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    allErrors.push('Duplicate trader IDs detected');
  }
  
  // Validate each trader
  traders.forEach(trader => {
    const result = validateCopyTrader(trader);
    allErrors.push(...result.errors);
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Sanitize trader data (fix common issues)
 */
export function sanitizeCopyTrader(trader: CopyTrader): CopyTrader {
  return {
    ...trader,
    // Ensure copiers doesn't exceed maxCopiers
    copiers: Math.min(trader.copiers, trader.maxCopiers),
    
    // Ensure weeklyPnl has exactly 7 days
    weeklyPnl: trader.weeklyPnl.length === 7 
      ? trader.weeklyPnl 
      : [...trader.weeklyPnl, ...Array(7 - trader.weeklyPnl.length).fill(0)].slice(0, 7),
    
    // Ensure maxDrawdown is negative
    maxDrawdown: trader.maxDrawdown > 0 ? -Math.abs(trader.maxDrawdown) : trader.maxDrawdown,
    
    // Clamp winRate to 0-100
    winRate: Math.max(0, Math.min(100, trader.winRate)),
    
    // Clamp sharpe ratio
    sharpeRatio: Math.max(0, Math.min(5, trader.sharpeRatio)),
  };
}

/**
 * Log validation warnings to console (dev mode only)
 */
export function logValidationWarnings(traders: CopyTrader[]) {
  if (import.meta.env.DEV) {
    const result = validateCopyTraders(traders);
    if (!result.isValid) {
      console.warn('⚠️ Copy Trading Data Validation Warnings:');
      result.errors.forEach(error => console.warn(`  - ${error}`));
    } else {
      console.log('✅ Copy Trading data validation passed');
    }
  }
}