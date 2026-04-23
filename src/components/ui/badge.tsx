import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
  {
    defaultVariants: {
      variant: "muted",
    },
    variants: {
      variant: {
        accent: "bg-cyan-400/10 text-cyan-200 ring-cyan-400/25",
        muted:
          "bg-[var(--shell-control-bg)] text-[var(--shell-muted)] ring-[var(--shell-border)]",
        warm: "bg-amber-400/10 text-amber-200 ring-amber-400/25",
        success: "bg-lime-400/10 text-lime-200 ring-lime-400/25",
        danger: "bg-rose-400/10 text-rose-200 ring-rose-400/25",
        outline: "bg-transparent text-[var(--shell-muted)] ring-[var(--shell-border)]",
        aurora:
          "text-white bg-[linear-gradient(135deg,rgba(34,211,238,0.35),rgba(168,85,247,0.35))] ring-white/20",
      },
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
