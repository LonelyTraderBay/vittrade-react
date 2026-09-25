import { describe, expect, it } from 'vitest';
import { cn } from '../components/ui/utils';

describe('ui class utilities', () => {
  it('merges Tailwind class conflicts deterministically', () => {
    expect(cn('rounded-lg', 'px-2', 'px-4')).toBe('rounded-lg px-4');
  });
});
