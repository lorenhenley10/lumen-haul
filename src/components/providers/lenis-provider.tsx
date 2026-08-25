"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks";

type LenisRef = RefObject<Lenis | null>;

const LenisContext = createContext<LenisRef | null>(null);

/**
 * Access the live Lenis instance.
 *
 * Returns the REF, not the instance, deliberately. Lenis is created in an
 * effect, so its value is not available during render — handing out
 * `ref.current` from a provider would mean every consumer reads a ref while
 * rendering (stale on first paint, and a React 19 lint error).
 *
 * Read `.current` inside effects and event handlers, which is the only place
 * anything wants it anyway:
 *
 *   const lenis = useLenis();
 *   useEffect(() => { lenis.current?.stop(); }, [lenis]);
 */
export function useLenis(): LenisRef {
  const ref = useContext(LenisContext);
  if (!ref) throw new Error("useLenis must be used inside <LenisProvider>");
  return ref;
}

/**
 * Smooth scroll, wired to GSAP.
 *
 * The three lines that matter and are easy to get wrong:
 *   1. Lenis emits `scroll` -> ScrollTrigger.update(), so pinned/scrubbed
 *      timelines track the smoothed position rather than the native one.
 *   2. GSAP's ticker drives `lenis.raf`, so there is ONE rAF loop, not two.
 *   3. Lenis is destroyed and rebuilt only on mount/unmount — never per route.
 *
 * Disabled outright under `prefers-reduced-motion`, where hijacking the
 * scrollbar is itself the problem.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      // Long, flat curve — the "expensive" glide the reference has.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Native momentum on touch is better than anything we can simulate,
      // and the mobile home page uses CSS scroll-snap, which Lenis fights.
      syncTouch: false,
    });

    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion]);

  /**
   * Jump to the section named by the current hash, if there is one.
   *
   * Returns whether it found a target, so the caller knows not to reset to the
   * top instead. Nothing here animates: arriving at a section from another
   * page should land the way a browser lands on an anchor, and scrubbing
   * through a page of content the visitor did not ask to see is a transition,
   * not a courtesy.
   */
  const scrollToHash = useCallback(() => {
    const id = window.location.hash.slice(1);
    if (!id) return false;

    const target = document.getElementById(id);
    if (!target) return false;

    if (lenisRef.current) {
      // Lenis does NOT honour `scroll-margin-top`, which native anchor
      // scrolling does — and #contact carries `scroll-mt-32` to clear the
      // fixed header. Read the computed value and pass it through rather than
      // restating the number here, where it would drift from the class.
      const scrollMargin =
        parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      lenisRef.current.scrollTo(target, {
        offset: -scrollMargin,
        immediate: true,
      });
    } else {
      // Reduced motion: Lenis is never constructed, so this is the native
      // path, which honours scroll-margin on its own.
      target.scrollIntoView();
    }

    return true;
  }, []);

  // Every route change starts at the top, and any ScrollTrigger built by the
  // outgoing page is measured against the wrong document height until refreshed.
  //
  // UNLESS THE LINK NAMED A SECTION. `usePathname` does not include the hash,
  // so /about#contact — which the footer, the mobile menu and the header CTA
  // all point at — arrived here as a plain /about change and got reset to the
  // top, landing every one of those links at the top of the page instead of on
  // Contact. The reset is right for an ordinary navigation and wrong for an
  // anchor, and the two were indistinguishable.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id && document.getElementById(id)) {
      // Refresh FIRST here: pinned sections resize the document, and landing
      // on a measurement taken before that lands in the wrong place.
      ScrollTrigger.refresh();
      scrollToHash();
      return;
    }

    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [pathname, scrollToHash]);

  // A hash-only change never moves `pathname`, so the effect above does not
  // run for it — this is Contact being clicked while already on /about.
  useEffect(() => {
    const onHashChange = () => scrollToHash();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [scrollToHash]);

  return (
    <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
  );
}
