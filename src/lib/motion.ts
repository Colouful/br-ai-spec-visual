import type { Transition, Variants } from "framer-motion";

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.7,
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft,
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: springSoft,
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: springSoft },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: springSoft,
  },
};
