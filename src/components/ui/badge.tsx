import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
  {
    defaultVariants: {
      variant: "muted",
    },
    variants: {
      variant: {
        accent: "bg-teal-500/12 text-teal-700 ring-1 ring-teal-500/20",
        muted:
          "bg-slate-900/[0.06] text-slate-600 ring-1 ring-slate-900/[0.08]",
        warm: "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20",
      },
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
