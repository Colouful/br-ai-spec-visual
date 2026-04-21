import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070d] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 p-0",
      },
      variant: {
        primary:
          "bg-white text-slate-950 shadow-[0_14px_32px_-18px_rgba(255,255,255,0.5)] hover:bg-slate-100",
        aurora:
          "text-white bg-[linear-gradient(135deg,#22d3ee_0%,#6366f1_55%,#a855f7_100%)] bg-[length:200%_200%] animate-aurora-shift shadow-[0_12px_28px_-14px_rgba(99,102,241,0.6)] hover:shadow-[0_18px_44px_-14px_rgba(34,211,238,0.6)]",
        secondary:
          "bg-white/[0.06] text-slate-100 ring-1 ring-inset ring-white/12 backdrop-blur-md hover:bg-white/[0.1] hover:ring-white/20",
        ghost:
          "bg-transparent text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.05] hover:text-white",
        outline:
          "bg-transparent text-slate-200 ring-1 ring-inset ring-white/15 hover:bg-white/[0.06] hover:text-white",
        danger:
          "bg-rose-500/90 text-white shadow-[0_12px_28px_-14px_rgba(244,63,94,0.55)] hover:bg-rose-500",
      },
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  size,
  type = "button",
  variant,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ size, variant }), className)}
      type={type}
      {...props}
    />
  );
}

export { buttonVariants };
