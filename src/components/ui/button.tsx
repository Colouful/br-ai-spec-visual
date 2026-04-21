import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "h-12 px-5 text-sm",
        sm: "h-10 px-4 text-sm",
      },
      variant: {
        primary:
          "bg-slate-950 text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.65)] hover:bg-slate-800",
        secondary:
          "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
        ghost:
          "bg-transparent text-slate-700 ring-1 ring-slate-200 hover:bg-white/80",
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
