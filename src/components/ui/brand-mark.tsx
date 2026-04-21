import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#070b14] ring-1 ring-inset ring-white/10 shadow-[0_18px_40px_-18px_rgba(34,211,238,0.55)]">
        <div className="absolute inset-0 bg-[conic-gradient(from_120deg_at_50%_50%,rgba(34,211,238,0.55),rgba(99,102,241,0.45),rgba(168,85,247,0.5),rgba(34,211,238,0.55))] opacity-70 blur-[2px] animate-aurora-shift" />
        <div className="absolute inset-[2px] rounded-[14px] bg-[#070b14]" />
        <svg
          aria-hidden="true"
          className="relative h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <defs>
            <linearGradient id="brandStroke" x1="0" y1="0" x2="24" y2="24">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="60%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
          <path
            d="M6 7.25h10.5a2.25 2.25 0 0 1 0 4.5H9.5a2.25 2.25 0 0 0 0 4.5H18"
            stroke="url(#brandStroke)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <circle cx="7" cy="16.25" fill="#22d3ee" r="1.25" />
        </svg>
      </div>
      {!compact ? (
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
            BR AI Spec
          </p>
          <p className="text-sm font-semibold text-gradient-aurora">
            规范控制台
          </p>
        </div>
      ) : null}
    </div>
  );
}
