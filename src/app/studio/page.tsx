import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { StudioTabs } from "@/components/studio/studio-tabs";
import { Reveal } from "@/components/motion/reveal";
import { studioSections, studioStatement } from "@/content/studio";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Studio",
  description: site.description,
};

/**
 * /studio — the about & contact page.
 *
 * Deliberately image-free. The reference's studio page contains ZERO images
 * and ZERO videos inside `main` (all eight images on the document are in the
 * footer) — it is carried entirely by type: one large statement, a tab strip,
 * and a single column of copy. Adding photography here would be the obvious
 * way to make it worse.
 *
 * Structure and spacing are measured from the reference at 1440x900:
 *   main            pt-top-section (256px), 16px gutters, no max-width
 *   statement       text-display, 56px/1.0, left aligned, ~448px block
 *   tab strip       mt-16 (64px), 36px tall
 *   content         mt-8 (32px), pb-16 (64px), h2 mb-6 (24px)
 */
export default function StudioPage() {
  return (
    <PageShell>
      <section>
        {/*
          `text-pretty` and `hyphens-auto` both matter at this size: the
          statement is long enough to set on three or four lines, and without
          hyphenation the ragged edge on a 56px face is severe.
        */}
        <Reveal immediate y={16}>
          <h1 className="text-display text-pretty hyphens-auto">
            {studioStatement}
          </h1>
        </Reveal>
      </section>

      <StudioTabs sections={studioSections} />
    </PageShell>
  );
}
