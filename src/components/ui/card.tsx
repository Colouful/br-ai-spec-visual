import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "relative overflow-hidden rounded-[22px] transition",
  {
    defaultVariants: { variant: "glass", padding: "md" },
    variants: {
      variant: {
        glass: "glass-panel",
        strong: "glass-panel-strong",
        flat: "bg-white/[0.03] border border-white/8",
        hollow: "border border-white/10",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-5",
        lg: "p-6 sm:p-7",
      },
    },
  },
);

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-white", className)} {...props} />;
}

export function CardEyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/80",
        className,
      )}
      {...props}
    />
  );
}
