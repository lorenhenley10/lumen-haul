import { HomeHero } from "@/components/home/home-hero";
import { ReelDesktop } from "@/components/home/reel-desktop";
import { ReelMobile } from "@/components/home/reel-mobile";
import { SiteFooter } from "@/components/layout/site-footer";
import { featuredProjects } from "@/content/projects";

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
      <div className="max-md:hidden">
        <HomeHero />
        <ReelDesktop projects={featuredProjects} />
        {/* Scroll room that uncovers the fixed footer sitting behind the page. */}
        <div aria-hidden className="h-[70vh]" />
        <SiteFooter />
      </div>

      <div className="md:hidden">
        <ReelMobile projects={featuredProjects} />
      </div>
    </main>
  );
}
