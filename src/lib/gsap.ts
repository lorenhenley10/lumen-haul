"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * Single GSAP registration point for the whole app.
 *
 * Import `gsap` and `ScrollTrigger` FROM THIS FILE, never from the packages
 * directly — registering a plugin twice from different module instances is the
 * usual cause of "ScrollTrigger is not defined" in a Next.js build.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  // Lenis calls gsap.ticker; lag smoothing would make scrubbed animations jump
  // after a stall (e.g. a video decode hitch) instead of tracking the scrollbar.
  gsap.ticker.lagSmoothing(0);
}

export { gsap, ScrollTrigger, useGSAP };

/**
 * Recalculate every ScrollTrigger. Call after anything that changes document
 * height outside React's knowledge — fonts loading, a video swapping in for
 * its poster, an accordion opening.
 */
export function refreshScrollTriggers() {
  if (typeof window === "undefined") return;
  ScrollTrigger.refresh();
}
