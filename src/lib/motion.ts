/**
 * Motion tokens — the JS twin of the `--duration-*` / `--ease-*` CSS tokens.
 *
 * Every animation in the app pulls its timing from here. If a component needs
 * a duration or easing that is not in this file, the answer is to add a named
 * token, not to inline a magic number.
 */

/** Seconds. GSAP takes these directly; Motion takes them directly. */
export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  page: 0.8,
} as const;

/**
 * Cubic-bezier control points, for Motion (`ease: ease.outExpo`) and for CSS
 * (`cubic-bezier(...)`).
 */
export const ease = {
  /** Fast out, long settle. The house easing for entrances and reveals. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Symmetrical. For things that move and stop — panels, menus, indicators. */
  inOutQuart: [0.76, 0, 0.24, 1],
  /** Gentle. For small hover/state changes. */
  outQuad: [0.25, 0.46, 0.45, 0.94],
} as const;

/** GSAP's own easing strings, matched to the curves above. */
export const gsapEase = {
  outExpo: "expo.out",
  inOutQuart: "power4.inOut",
  outQuad: "power2.out",
  none: "none",
} as const;

/** Stagger steps, in seconds, for grouped reveals. */
export const stagger = {
  tight: 0.04,
  base: 0.08,
  loose: 0.14,
} as const;

/**
 * Shared ScrollTrigger start positions. Keeping these named stops every page
 * from inventing its own trigger point and making the site feel arrhythmic.
 */
export const scrollStart = {
  /** Element's top has risen 15% into the viewport. Default for reveals. */
  reveal: "top 85%",
  /** Element's top reaches the viewport bottom. For long parallax runs. */
  enter: "top bottom",
  /** Element pinned from the moment its top hits the viewport top. */
  pin: "top top",
} as const;

export type EaseName = keyof typeof ease;
