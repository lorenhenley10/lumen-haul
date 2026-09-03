import { HomeHero } from "@/components/home/home-hero";
import { ReelDesktop } from "@/components/home/reel-desktop";
import { ReelMobile } from "@/components/home/reel-mobile";
import { SiteFooter } from "@/components/layout/site-footer";
import { featuredProjects } from "@/content/projects";
import { organizationJsonLd } from "@/content/site";

/**
 * Home.
 *
 * The desktop and mobile experiences are DIFFERENT COMPONENT TREES, not one
 * responsive tree, because the interaction models genuinely differ (see
 * ReelDesktop / ReelMobile). Both are rendered and one is hidden with a CSS
 * breakpoint rather than a JS media query, which keeps server and client
 * markup identical — no hydration mismatch, no first-paint flash of the wrong
 * layout.
 *
 * Hiding with `display: none` also means the hidden tree's videos never
 * intersect the viewport, so AutoVideo never attaches their sources. The cost
 * of the unused branch is markup, not bandwidth.
 */
export default function HomePage() {
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd }}
      />

      <div className="max-md:hidden">
        {/*
          THIS WRAPPER IS LOAD-BEARING — it is the hero's sticky containing
          block, and it ends where the reel does.

          A sticky element sticks for the height of its PARENT. With the hero
          parented to the whole page it stayed stuck at the top through the
          footer's reveal space too: an opaque, full-viewport hero parked over
          the footer at the bottom of the document, so the reveal uncovered
          nothing but black. Bounding it to hero + reel lets the hero scroll
          away with the reel it was holding still for, and leaves the spacer
          below genuinely empty.
        */}
        <div>
          <HomeHero />
          <ReelDesktop projects={featuredProjects} />
        </div>
        {/* Scroll room that uncovers the fixed footer sitting behind the page.
            `pointer-events-none` because it lies over that footer and would
            otherwise eat every click meant for it — see PageShell.

            `max-lg:hidden` for the same reason PageShell's spacer carries it:
            the footer is only `lg:fixed`. Between md and lg this tree still
            renders but the footer is a normal block, so the spacer reserved a
            screenful of empty ground above a footer that needed none. */}
        <div aria-hidden className="pointer-events-none h-[70vh] max-lg:hidden" />
        <SiteFooter />
      </div>

      <div className="md:hidden">
        <ReelMobile projects={featuredProjects} />
      </div>
    </main>
  );
}
