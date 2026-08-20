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
 * Four across on a desktop, two on a phone — a real layout change rather than
 * a squeezed one, because four columns of photograph on a 390px screen is
 * 87px of picture. There is no horizontal rail and nothing scrolls sideways:
 * the whole slate is one grid the page scrolls down through.
 *
 * Columns nearly touch and rows breathe (`gap-x-4` against `gap-y-12`), which
 * is the same proportion /stories uses. It is what stops a grid of pictures
 * reading as a grid of cards.
 */
export default function StillsPage() {
  return (
    <PageShell>
      {/* The pictures are the heading. The visible one would only repeat the
          nav item that got the visitor here. */}
      <h1 className="sr-only">Stills</h1>

      <section className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-y-16 lg:grid-cols-4">
        {stillsProjects.map((project) => (
          // Each tile crosses its own trigger point, so the stagger survives a
          // resize that changes how many sit in a row.
          <Reveal key={project.slug} y={32}>
            <StillsTile project={project} />
          </Reveal>
        ))}
      </section>
    </PageShell>
  );
}
