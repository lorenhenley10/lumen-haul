import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";

export const metadata: Metadata = {
  title: "Creators",
  description: "The directors, cinematographers and producers behind Lumen Haul.",
};

/**
 * INTENTIONALLY BLANK — placeholder scaffold.
 *
 * The route and its navigation link are live so the header's active state,
 * the footer link and the mobile menu all resolve correctly, but the page is
 * deliberately unbuilt. Do not design or populate it as a side effect of
 * other work.
 *
 * When it is time to build this, the plan is already written:
 * `docs/plan/01-creators.md` — a hover index where each name reveals a
 * full-bleed backdrop, with the backdrop system removed entirely on touch.
 * Placeholder content already exists in `src/content/creators.ts`.
 */
export default function CreatorsPage() {
  return (
    <PageShell>
      <h1 className="text-display">Creators</h1>
      <p className="mt-6 text-muted-foreground">Coming soon.</p>
    </PageShell>
  );
}
