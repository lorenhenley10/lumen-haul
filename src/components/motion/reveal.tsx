"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, gsapEase, scrollStart, stagger } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

interface RevealProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Distance travelled, in px. */
  y?: number;
  delay?: number;
  /** Stagger direct children instead of animating the block as one. */
  staggerChildren?: boolean;
  /** Fire on mount rather than on scroll. For above-the-fold content. */
  immediate?: boolean;
  /** Override the ScrollTrigger start. Defaults to `top 85%`. */
  start?: string;
  /** Replay every time it re-enters. Off by default — reveals fire once. */
  repeat?: boolean;
}

/**
 * The house entrance animation: a short rise with a fade, on scroll.
 *
 * This is the DEFAULT reveal for the site. Reach for it before writing a
 * bespoke timeline — consistency in entrance timing is most of what makes a
 * site feel authored rather than assembled.
 *
 * Under reduced motion it renders children untouched, in their final state.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  y = 24,
  delay = 0,
  staggerChildren = false,
  immediate = false,
  start = scrollStart.reveal,
  repeat = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion || !ref.current) return;

      const targets = staggerChildren
        ? Array.from(ref.current.children)
        : ref.current;

      gsap.fromTo(
        targets,
        { y, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: duration.slow,
          ease: gsapEase.outExpo,
          delay,
          stagger: staggerChildren ? stagger.base : 0,
          scrollTrigger: immediate
            ? undefined
            : {
                trigger: ref.current,
                start,
                toggleActions: repeat
                  ? "play reverse play reverse"
                  : "play none none none",
              },
        },
      );
    },
    // useGSAP reverts everything created in this scope on unmount — including
    // the ScrollTrigger — which is why route changes don't leak triggers.
    { scope: ref, dependencies: [prefersReducedMotion] },
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
