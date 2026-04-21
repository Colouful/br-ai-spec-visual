import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 aria-[invalid=true]:border-rose-300 aria-[invalid=true]:focus:border-rose-400 aria-[invalid=true]:focus:ring-rose-400/10",
        className,
      )}
      {...props}
    />
  );
}
