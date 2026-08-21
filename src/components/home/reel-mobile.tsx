"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/cn";
import type { Project } from "@/content/types";
import { brand, site } from "@/content/site";
import { heroFilm } from "@/content/media";

/**
 * The featured reel — mobile.
 *
 * NOT a narrow version of the desktop reel. The whole interaction inverts:
 *
 *   desktop → one fixed frame, films crossfade on a timer, user watches
 *   mobile  → titles scroll-snap under the thumb, film crossfades to match
 *
 * So the titles live in a `scroll-snap` column and the FILM LAYER IS FIXED
 * BEHIND IT, swapped by whichever panel is currently snapped. Scrolling is the
 * transport control, which is the only thing that feels right on a phone —
 * and it means no autoplay timer fights the user's thumb.
 *
 * The snap container owns its own scroll (it is `fixed`), so Lenis is not
 * involved and native momentum/snap physics are preserved.
 */
export function ReelMobile({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState(-1); // -1 = hero panel
  const scrollerRef = useRef<HTMLDivElement>(null);

  /**
   * Which panel is showing, derived from scroll offset.
   *
   * This was an IntersectionObserver over the panels, which had two problems.
   * The ref it used as `root` was never attached to an element, so the observer
   * was never created and the film layer stayed permanently hidden — the mobile
   * home page was simply black below the hero.
   *
   * Rather than only reattaching the ref, the whole mechanism is now arithmetic:
   * panels are exactly one scroller-height each, so the active one is just
   * `scrollTop / height`. That is deterministic, has no threshold to tune, and
   * cannot silently do nothing the way a misconfigured observer can.
   *
   * Panel 0 is the hero, which maps to index -1 (no project film showing).
   */
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const update = () => {
      const height = root.clientHeight || 1;
      const panel = Math.round(root.scrollTop / height);
      const next = Math.min(Math.max(panel - 1, -1), projects.length - 1);
      setActiveIndex((current) => (current === next ? current : next));
    };

    // Deliberately not rAF-throttled: this is one division and a bailing
    // setState, and a rAF wrapper would stall wherever frames are throttled.
    root.addEventListener("scroll", update, { passive: true });
    // Mobile browser chrome collapses as you scroll, which changes the
    // scroller's height and therefore which panel a given offset maps to.
    window.addEventListener("resize", update);
    update();

    return () => {
      root.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  return (
    <>
      {/*
        The film layer is a SIBLING of the scroll container, not a child, and
        both are plain `fixed` layers ordered by positive z-index.

        It used to be a `position: fixed` element *inside* the
        `fixed + overflow-y: auto` scroller, sitting at `z-index: -1`. That
        renders on desktop but is black on iOS, for two separate reasons:

          1. iOS Safari mispositions and clips `position: fixed` descendants of
             a scrolling container — a long-standing WebKit bug.
          2. `position: fixed` establishes a stacking context in WebKit, so a
             child at `z-index: -1` paints *behind* its parent rather than
             behind the page, and disappears against the opaque body colour.

        Hoisting it out and using z-0 / z-10 avoids both. Never reintroduce a
        negative z-index or a nested fixed element here.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-svh select-none"
      >
        {projects.map((project, index) => (
          <div
            key={project.slug}
            className={cn(
              "absolute inset-0 transition-opacity",
              index === activeIndex ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: "var(--duration-base)" }}
          >
            <MediaFrame placeholder={project.loop.placeholder}>
              <AutoVideo asset={project.loop} active={index === activeIndex} />
            </MediaFrame>
          </div>
        ))}
      </div>

      {/* Scroll container. Transparent, so the film layer reads through the
          panels' scrim. */}
      <div
        ref={scrollerRef}
        className="fixed inset-0 z-10 h-svh snap-y snap-mandatory overflow-y-auto"
      >
      {/* Hero panel. `data-panel-index` is kept purely as a debugging aid —
          the active panel is derived from scroll offset, not from these. */}
      <section data-panel-index={-1} className="relative h-svh snap-start">
        <div className="h-full w-full brightness-[0.8]">
          <MediaFrame placeholder={heroFilm.placeholder}>
            <AutoVideo asset={heroFilm} priority audible />
          </MediaFrame>
        </div>
        <div className="absolute inset-0 z-[var(--z-media)] flex flex-col items-center justify-end gap-8 bg-scrim px-container pt-24 pb-frame-foot">
          <Image
            src={brand.mark}
            alt=""
            aria-hidden
            width={brand.markWidth}
            height={brand.markHeight}
            priority
            className="h-19 w-auto object-contain"
          />
          <h1 className="w-full text-center font-display font-medium text-hero-sm uppercase">
            {site.name}
          </h1>
          <p className="mx-auto max-w-xs text-center">{site.tagline}</p>
        </div>
      </section>

      {/* Title panels */}
      {projects.map((project, index) => (
        <div
          key={project.slug}
          data-panel-index={index}
          className="relative h-svh w-full snap-start bg-scrim px-12 pt-12 pb-frame-foot"
        >
          <Link href={`/stories/${project.slug}`} className="block h-full w-full">
            <div className="flex h-full w-full flex-col items-center justify-end gap-4">
              <h2 className="text-display text-center tracking-tighter">
                <span className="font-medium">{project.client}</span>
                <br />
                <span className="font-light">{project.title}</span>
              </h2>
            </div>
          </Link>
        </div>
      ))}

      {/* Footer is the final snap panel rather than a separate scroll region. */}
      <div className="flex h-svh snap-start flex-col justify-end bg-linear-to-b from-scrim to-background">
        <SiteFooter className="static" />
      </div>
      </div>
    </>
  );
}
