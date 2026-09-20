import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";
import type { VitDensity } from "../../theme/density";

const densityHeight: Record<VitDensity, string> = {
  compact: "h-[36px]",
  standard: "h-[52px]",
  hero: "h-[56px]",
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#E58A00] to-[#B96000] text-white hover:brightness-110 hover:shadow-[0_4px_16px_rgba(229,138,0,0.25)] active:brightness-95 active:shadow-none",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_4px_16px_rgba(239,68,68,0.25)] active:shadow-none focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/20 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:brightness-110",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  density,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    density?: VitDensity;
  }) {
  const Comp = asChild ? Slot : "button";
  const densityClass = density ? densityHeight[density] : "";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), densityClass)}
      {...props}
    />
  );
}

export { Button, buttonVariants };