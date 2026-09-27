import { describe, expect, it } from 'vitest';
import { isTpslSubmissionValid } from './tpsl-validation';
import type { TPSLValues } from './trading-types';

const values: TPSLValues = {
  enabled: true,
  tpPrice: '',
  slPrice: '',
  tpTriggerType: 'last',
  slTriggerType: 'last',
};

describe('isTpslSubmissionValid', () => {
  it('allows TP above and SL below entry for buy orders', () => {
    expect(
      isTpslSubmissionValid({ ...values, tpPrice: '70000', slPrice: '60000' }, 'buy', 65_000),
    ).toBe(true);
    expect(isTpslSubmissionValid({ ...values, tpPrice: '64000' }, 'buy', 65_000)).toBe(false);
    expect(isTpslSubmissionValid({ ...values, slPrice: '66000' }, 'buy', 65_000)).toBe(false);
  });

  it('allows TP below and SL above entry for sell orders', () => {
    expect(
      isTpslSubmissionValid({ ...values, tpPrice: '60000', slPrice: '70000' }, 'sell', 65_000),
    ).toBe(true);
    expect(isTpslSubmissionValid({ ...values, tpPrice: '66000' }, 'sell', 65_000)).toBe(false);
    expect(isTpslSubmissionValid({ ...values, slPrice: '64000' }, 'sell', 65_000)).toBe(false);
  });

  it('requires both valid prices in bracket mode and honors the configured default', () => {
    expect(isTpslSubmissionValid(values, 'buy', 65_000, true)).toBe(false);
    expect(
      isTpslSubmissionValid({ ...values, tpPrice: '70000', slPrice: '60000' }, 'buy', 65_000, true),
    ).toBe(true);
    expect(isTpslSubmissionValid({ ...values, bracketMode: false }, 'buy', 65_000, true)).toBe(
      true,
    );
  });

  it('rejects zero, malformed, non-finite, and wrong-side prices', () => {
    for (const tpPrice of ['0', '-1', 'abc', '70000abc', 'Infinity', '0x10', '1e3', '1.2.3']) {
      expect(isTpslSubmissionValid({ ...values, tpPrice }, 'buy', 65_000)).toBe(false);
    }
    expect(isTpslSubmissionValid({ ...values, slPrice: '0x10' }, 'buy', 65_000)).toBe(false);
    expect(isTpslSubmissionValid({ ...values, tpPrice: '70000' }, 'buy', 0)).toBe(false);
    expect(isTpslSubmissionValid({ ...values, tpPrice: '70000' }, 'buy', Number.NaN)).toBe(false);
  });

  it('ignores disabled TP/SL values', () => {
    expect(
      isTpslSubmissionValid(
        { ...values, enabled: false, bracketMode: true, tpPrice: 'invalid', slPrice: '' },
        'buy',
        0,
        true,
      ),
    ).toBe(true);
  });
});
