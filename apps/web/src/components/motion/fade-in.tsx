"use client";

/**
 * Reusable Framer Motion animation primitives for ResumeBoost.
 *
 * Exports:
 *  - FadeIn              — load-time fade+rise, optional delay
 *  - FadeInWhenVisible   — same animation triggered by scroll into viewport
 *  - StaggerContainer    — stagger parent (0.08s between children)
 *  - StaggerItem         — stagger child
 *  - MotionButton        — motion.button with hover scale + tap scale
 *
 * Shared motion variants (also exported for use in whileHover / whileTap):
 *  - buttonHoverVariant / buttonTapVariant
 *  - cardHoverVariant
 */

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Shared easing & timing
// ---------------------------------------------------------------------------
const EASE_OUT_EXPO = [0.21, 0.47, 0.32, 0.98] as const;

// ---------------------------------------------------------------------------
// Fade + rise variant (used by all four primitives)
// ---------------------------------------------------------------------------
const fadeRise: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: EASE_OUT_EXPO,
    },
  },
};

// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// The stagger item re-uses the same fade+rise shape but with a shorter
// individual duration so a group of items doesn't feel too slow.
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT_EXPO,
    },
  },
};

// ---------------------------------------------------------------------------
// Button / interactive element variants
// ---------------------------------------------------------------------------
export const buttonHoverVariant = { scale: 1.02 };
export const buttonTapVariant = { scale: 0.98 };
export const buttonTransition = { duration: 0.2, ease: "easeOut" as const };

// ---------------------------------------------------------------------------
// Card hover variant (translateY lift — shadow handled via CSS class)
// ---------------------------------------------------------------------------
export const cardHoverVariant = { y: -6 };
export const cardTransition = { duration: 0.25, ease: "easeOut" as const };

// ---------------------------------------------------------------------------
// FadeIn — triggers immediately on mount (for above-the-fold content)
// ---------------------------------------------------------------------------
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: fadeRise.hidden,
        visible: {
          ...(fadeRise.visible as object),
          transition: {
            duration: 0.6,
            ease: EASE_OUT_EXPO,
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// FadeInWhenVisible — triggers once when scrolled into viewport
// ---------------------------------------------------------------------------
interface FadeInWhenVisibleProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInWhenVisible({
  children,
  delay = 0,
  className,
}: FadeInWhenVisibleProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: fadeRise.hidden,
        visible: {
          ...(fadeRise.visible as object),
          transition: {
            duration: 0.6,
            ease: EASE_OUT_EXPO,
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerContainer — wraps a group, orchestrates stagger timing
// ---------------------------------------------------------------------------
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  /** Whether to trigger on scroll (default: false = trigger on mount) */
  whenVisible?: boolean;
}

export function StaggerContainer({
  children,
  className,
  whenVisible = false,
}: StaggerContainerProps) {
  const commonProps = {
    variants: staggerContainer,
    initial: "hidden" as const,
    className,
  };

  if (whenVisible) {
    return (
      <motion.div
        {...commonProps}
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div {...commonProps} animate="visible">
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerItem — direct child of StaggerContainer
// ---------------------------------------------------------------------------
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// MotionButton — drop-in replacement for a <button> with hover/tap variants
// Accepts all native button props + optional asChild-style className
// ---------------------------------------------------------------------------
type MotionButtonProps = HTMLMotionProps<"button">;

export function MotionButton({ children, className, ...props }: MotionButtonProps) {
  return (
    <motion.button
      whileHover={buttonHoverVariant}
      whileTap={buttonTapVariant}
      transition={buttonTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// MotionDiv with card hover preset — wraps a card for lift+shadow effect
// ---------------------------------------------------------------------------
interface MotionCardProps {
  children: ReactNode;
  className?: string;
}

export function MotionCard({ children, className }: MotionCardProps) {
  return (
    <motion.div
      whileHover={cardHoverVariant}
      transition={cardTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
