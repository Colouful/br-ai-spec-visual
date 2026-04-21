import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-lg bg-white/[0.05]",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)]",
        "before:animate-[shimmer_1.6s_linear_infinite]",
        className,
      )}
      {...props}
    />
  );
}
