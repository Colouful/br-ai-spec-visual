import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-[var(--shell-border)] bg-[var(--shell-control-bg)] px-4 text-sm text-[var(--shell-fg)] outline-none transition placeholder:text-[var(--shell-muted)]",
        "hover:border-[var(--shell-border-strong)]",
        "focus:border-cyan-400/60 focus:bg-[var(--shell-control-bg-hover)] focus:ring-4 focus:ring-cyan-400/15",
        "aria-[invalid=true]:border-rose-400/60 aria-[invalid=true]:focus:ring-rose-400/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-xl border border-[var(--shell-border)] bg-[var(--shell-control-bg)] px-4 py-3 text-sm text-[var(--shell-fg)] outline-none transition placeholder:text-[var(--shell-muted)]",
        "hover:border-[var(--shell-border-strong)]",
        "focus:border-cyan-400/60 focus:bg-[var(--shell-control-bg-hover)] focus:ring-4 focus:ring-cyan-400/15",
        className,
      )}
      {...props}
    />
  );
}
