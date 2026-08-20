import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SiteFooter } from "./site-footer";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  /** Standard top clearance for the fixed header. Off for full-bleed heroes. */
  padded?: boolean;
  /**
   * Hold the page to a single viewport on lg+, with no scroll.
   *
   * This also turns the reveal footer OFF, and it has to: the footer is
   * uncovered by content scrolling up off it, so a page with no scroll has no
   * way to reveal it. The spacer below is dropped and the fixed footer simply
   * stays behind the opaque page — invisible on lg, and still a normal block
   * below lg where the footer is static and the page scrolls anyway.
   */
  fitViewport?: boolean;
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
  fitViewport = false,
}: PageShellProps) {
  return (
    <>
      <main
        id="main"
        className={cn(
          "relative z-[var(--z-content)] bg-background",
          fitViewport ? "min-h-dvh lg:h-dvh lg:overflow-hidden" : "min-h-dvh",
          padded && "container pt-top-section pb-16",
          className,
        )}
      >
        {children}
      </main>

      {/* Reveal space. Only on lg+, where the footer is actually fixed — and
          never on a fit-to-viewport page, where it would be the one thing
          putting the document over a screen tall. */}
      {!fitViewport && <div aria-hidden className="h-[70vh] max-lg:hidden" />}
      <SiteFooter />
    </>
  );
}
