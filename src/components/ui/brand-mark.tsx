import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-[0_18px_30px_-18px_rgba(15,23,42,0.8)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.48),_transparent_58%)]" />
        <svg
          aria-hidden="true"
          className="relative h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 7.25h10.5a2.25 2.25 0 0 1 0 4.5H9.5a2.25 2.25 0 0 0 0 4.5H18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <circle cx="7" cy="16.25" fill="currentColor" r="1.25" />
        </svg>
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-400">
            BR AI Spec
          </p>
          <p className="text-sm font-semibold text-slate-950">规范控制台</p>
        </div>
      ) : null}
    </div>
  );
}
