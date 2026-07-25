import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SiteFooter } from "./site-footer";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Standard top clearance for the fixed header. Off for full-bleed heroes. */
  padded?: boolean;
}

/**
 * The standard inner-page wrapper. USE THIS for every route except the home
 * page, which has its own bespoke shell.
 *
 * It exists to make the reveal-footer safe. The footer is `position: fixed` at
 * the bottom of the viewport on a layer BEHIND the page, and is uncovered as
 * the page's last section scrolls up off it. That only works if two things are
 * true, and both are easy to forget:
 *
 *   1. The scrolling content is OPAQUE. Without `bg-background` on the main
 *      element, the fixed footer shows through the middle of the page.
 *   2. There is scroll room after the content for the footer to be revealed
 *      into — the spacer below.
 *
 * Getting either wrong produces a subtle, confusing bug (giant wordmark
 * ghosting through a grid), so neither is left to the caller.
 */
export function PageShell({
  children,
  className,
  padded = true,
}: PageShellProps) {
  return (
    <>
      <main
        id="main"
        className={cn(
          "relative z-[var(--z-content)] min-h-dvh bg-background",
          padded && "container pt-top-section pb-16",
          className,
        )}
      >
        {children}
      </main>

      {/* Reveal space. Only on lg+, where the footer is actually fixed. */}
      <div aria-hidden className="h-[70vh] max-lg:hidden" />
      <SiteFooter />
    </>
  );
}
