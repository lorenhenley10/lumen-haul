"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase, scrollStart } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /**
   * Travel as a fraction of the element's own height, across the full scroll
   * pass. 0.15 is a good ambient default; past ~0.3 it reads as a glitch.
   */
  amount?: number;
  /** Negative values move against the scroll direction. */
  direction?: 1 | -1;
}

/**
 * Scrubbed parallax.
 *
 * `scrub: true` ties position directly to scroll offset with no smoothing of
 * its own — Lenis already smooths the input, and adding a second smoothing
 * pass makes media feel like it is lagging behind the page.
 *
 * The child must be oversized relative to its container (the usual pattern is
 * a `scale-110` media element inside an `overflow-hidden` frame), or the
 * translation will expose an edge.
 */
export function Parallax({
  children,
  className,
  amount = 0.15,
  direction = 1,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion || !ref.current) return;

      const distance = ref.current.offsetHeight * amount * direction;

      gsap.fromTo(
        ref.current,
        { yPercent: 0, y: -distance / 2 },
        {
          y: distance / 2,
          ease: gsapEase.none,
          scrollTrigger: {
            trigger: ref.current,
            start: scrollStart.enter,
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion, amount, direction] },
  );

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
