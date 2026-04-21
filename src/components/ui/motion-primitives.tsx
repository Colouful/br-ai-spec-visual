"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { usePathname } from "next/navigation";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import {
  fadeUp,
  listItem,
  pageTransition,
  springSoft,
  staggerContainer,
} from "@/lib/motion";

export function MotionPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="show"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function MotionList({
  children,
  className,
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, "variants" | "initial" | "animate">) {
  const MotionTag = motion[Tag] as typeof motion.div;
  return (
    <MotionTag
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function MotionItem({
  children,
  className,
  variant = "up",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  variant?: "up" | "list";
} & Omit<ComponentPropsWithoutRef<typeof motion.div>, "variants">) {
  return (
    <motion.div
      variants={variant === "up" ? fadeUp : listItem}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Magnetic 吸附效果 + 3D tilt
 */
export function Magnetic({
  children,
  className,
  strength = 0.18,
  tilt = false,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  tilt?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22 });
  const sy = useSpring(y, { stiffness: 260, damping: 22 });
  const rotX = useTransform(sy, (v) => (tilt ? -v / 12 : 0));
  const rotY = useTransform(sx, (v) => (tilt ? v / 12 : 0));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    x.set(mx * strength);
    y.set(my * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy, rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ShimmerText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-clip-text text-transparent bg-[linear-gradient(110deg,#f1f5f9_30%,#22d3ee_50%,#f1f5f9_70%)] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GradientBorder({
  children,
  className,
  radius = "rounded-[24px]",
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
}) {
  return (
    <div className={cn("relative p-[1px] bg-gradient-aurora animate-aurora-shift", radius, className)}>
      <div className={cn("relative h-full w-full bg-[#070b14]", radius)}>{children}</div>
    </div>
  );
}

/**
 * CountUp：将数字动画到目标值（支持简单前缀/后缀，仅对数字部分缓动）。
 */
export function CountUp({
  value,
  prefix,
  suffix,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const mv = useMotionValue(0);
  useEffect(() => {
    const controls = mv.on("change", (v) => setDisplay(v));
    const start = mv.get();
    const duration = 900;
    const startTs = performance.now();
    let raf = 0;
    const tick = (ts: number) => {
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      mv.set(start + (value - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      controls();
    };
  }, [mv, value]);

  const isInt = Number.isInteger(value);
  return (
    <span className={className}>
      {prefix}
      {isInt ? Math.round(display) : display.toFixed(1)}
      {suffix}
    </span>
  );
}

export { motion, AnimatePresence, springSoft };
