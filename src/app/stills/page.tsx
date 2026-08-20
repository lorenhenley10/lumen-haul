import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Reveal } from "@/components/motion/reveal";
import { StillsTile } from "@/components/stills/stills-tile";
import { stillsProjects } from "@/content/stills";

export const metadata: Metadata = {
  title: "Stills",
  description:
    "Photography from Lumen Haul — vehicle, product and event sets, shot alongside the films or commissioned on their own.",
};

/**
 * The photography index.
 *
 * ONE SCREEN ON DESKTOP. All eight sets sit in a 4x2 block centred in the
 * viewport and the page does not scroll — the slate is small enough to be seen
 * whole, and a scrollbar would turn a complete view into a partial one.
 *
 * That is why the grid gives way instead of the page: `--width-stills-grid`
 * caps its width by what the WINDOW HEIGHT can fit, so a short window makes
 * smaller tiles rather than a scrollbar. On any ordinary desktop window the
 * page's own width is the smaller of the two and the cap never binds, which
 * keeps the grid full-bleed the way every other page here is.
 *
 * Below lg it is an ordinary scrolling page: two across on a phone, three on a
 * tablet, and the footer back in the flow where it belongs. Eight tiles on one
 * phone screen would be 87px of picture each, which is a thumbnail sheet, not
 * a portfolio.
 */
export default function StillsPage() {
  return (
    <PageShell padded={false} fitViewport>
      <div className="container pt-top-section pb-16 lg:flex lg:h-dvh lg:items-center lg:py-0">
        {/* The pictures are the heading. A visible one would only repeat the
            nav item that got the visitor here. */}
        <h1 className="sr-only">Stills</h1>

        {/* One reveal over the whole grid, on MOUNT rather than on scroll.
            Every other index here staggers by each card crossing its own
            trigger point, which cannot work on a page with no scroll: a tile
            sitting below the trigger line would wait for a scroll that never
            comes and stay invisible. Staggering the children of one mount
            reveal is deterministic, and on a single-screen index it is the
            better choreography anyway — the slate arrives as one thing. */}
        <Reveal
          as="section"
          staggerChildren
          immediate
          y={24}
          // `items-start` is load-bearing, not cosmetic. The tiles are direct
          // grid children now, and a stretched grid item gives MediaFrame's
          // `h-full` a definite height to resolve against — which beats its
          // aspect-ratio and quietly squares the frames off. Sizing items to
          // their content is what keeps the 3/2 crop 3/2.
          className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-12 md:grid-cols-3 md:gap-y-16 lg:mx-auto lg:max-w-[var(--width-stills-grid)] lg:grid-cols-4 lg:gap-y-10"
        >
          {stillsProjects.map((project) => (
            <StillsTile key={project.slug} project={project} />
          ))}
        </Reveal>
      </div>
    </PageShell>
  );
}
