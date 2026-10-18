import { describe, expect, it } from 'vitest';
import type { TouchList } from 'react';
import { getTouchCenter, getTouchDistance } from './dca-history-chart-utils';

describe('DCA pinch geometry', () => {
  it.each([{ contacts: [] }, { contacts: [{ clientX: 40, clientY: 50 }] }])(
    'keeps neutral pinch geometry until two contacts exist: $contacts',
    ({ contacts }) => {
      const touches = contacts as unknown as TouchList;
      expect(getTouchDistance(touches)).toBe(0);
      expect(getTouchCenter(touches, new DOMRect(100, 0, 200, 100))).toBe(0.5);
    },
  );

  it('measures contact separation and the focal point relative to the actual chart bounds', () => {
    const touches = [
      { clientX: 110, clientY: 20 },
      { clientX: 140, clientY: 60 },
    ] as unknown as TouchList;
    expect(getTouchDistance(touches)).toBe(50);
    expect(getTouchCenter(touches, new DOMRect(100, 0, 200, 100))).toBe(0.125);
  });
});
