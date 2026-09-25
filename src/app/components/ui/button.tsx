import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import type { VariantProps } from 'class-variance-authority';

import { cn } from './utils';
import { buttonVariants } from './button-variants';
import type { VitDensity } from '../../theme/density';

const densityHeight: Record<VitDensity, string> = {
  compact: 'h-[36px]',
  standard: 'h-[52px]',
  relaxed: 'h-[58px]',
  hero: 'h-[56px]',
  tool: 'h-[44px]',
};

function Button({
  className,
  variant,
  size,
  density,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    density?: VitDensity;
  }) {
  const Comp = asChild ? Slot : 'button';
  const densityClass = density ? densityHeight[density] : '';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), densityClass)}
      {...props}
    />
  );
}

export { Button };
