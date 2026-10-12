import { describe, expect, it } from 'vitest';
import { toggleVariants } from './toggle-variants';

describe('toggleVariants', () => {
  it('applies the default and outline variants with each supported size', () => {
    expect(toggleVariants()).toContain('bg-transparent');
    expect(toggleVariants({ variant: 'outline', size: 'default' })).toContain('border-input');
    expect(toggleVariants({ variant: 'outline', size: 'sm' })).toContain('h-8');
    expect(toggleVariants({ variant: 'outline', size: 'lg' })).toContain('h-10');
  });
});
