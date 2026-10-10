import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] leading-none",
  {
    variants: {
      variant: {
        neutral: "border-border bg-surface-muted text-muted-foreground",
        primary: "border-transparent bg-primary-soft text-primary",
        accent: "border-transparent bg-accent-soft text-accent-foreground",
        success: "border-transparent bg-success-soft text-success",
        warning: "border-transparent bg-warning-soft text-warning",
        destructive: "border-transparent bg-destructive-soft text-destructive",
        info: "border-transparent bg-info-soft text-info",
        outline: "border-border-strong bg-transparent text-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
