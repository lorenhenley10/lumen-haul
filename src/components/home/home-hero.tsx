"use client";

import Image from "next/image";
import { useRef } from "react";
import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { ProgressiveBlur } from "@/components/motion/progressive-blur";
import { brand, site } from "@/content/site";
import { heroFilm } from "@/content/media";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, gsapEase } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

/**
 * Home hero.
 *
 * `position: sticky` rather than a GSAP pin. The reel section that follows is
 * opaque and simply scrolls up over the top of this — CSS does that natively,
 * costs nothing per frame, and cannot drift out of sync with Lenis the way a
 * pinned ScrollTrigger can. Reserve GSAP pinning for sequences that need
 * scrubbed *internal* progress; this one doesn't.
 */
export function HomeHero() {
  const root = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      // Entrance: the wordmark lifts out of its mask, everything else settles
      // behind it. Runs on mount — this is above the fold, so a scroll trigger
      // would never fire.
      gsap
        .timeline({ defaults: { ease: gsapEase.outExpo } })
        .from("[data-hero-mark]", {
          yPercent: 110,
          duration: 1.2,
        })
        .from(
          "[data-hero-tagline]",
          { y: 16, autoAlpha: 0, duration: duration.slow },
          "-=0.7",
        )
        .from(
          "[data-hero-scroll]",
          { autoAlpha: 0, duration: duration.slow },
          "-=0.5",
        );
    },
    { scope: root, dependencies: [prefersReducedMotion] },
  );

  return (
    <section
      ref={root}
      /*
        `z-[var(--z-content)] bg-background` is the reveal-footer contract, the
        same pair ReelDesktop carries. The footer is fixed at `--z-reveal` and
        comes LATER in the document than this hero, so a hero left on the
        default layer loses the tie and the footer paints over its bottom half
        — the giant wordmark sitting across the film at the top of the page.
        The ground matters for the same reason: film is the only thing making
        this section opaque, and a poster that has not decoded yet is a hole
        straight through to the footer.
      */
      className="sticky top-0 z-[var(--z-content)] h-dvh overflow-hidden bg-background"
    >
      <div className="h-full w-full brightness-[0.8]">
        <MediaFrame placeholder={heroFilm.placeholder}>
          <AutoVideo asset={heroFilm} priority audible />
        </MediaFrame>
      </div>

      <div className="absolute inset-0 z-[var(--z-media)] flex flex-col items-center justify-end bg-scrim pt-24 pb-frame-foot">
        {/*
          The blur band is anchored to the FRAME, not carried in the flow.

          It used to take its height from 18rem of padding stacked above the
          scroll cue, which was free while the lockup sat at the top of the
          hero. With the lockup bottom-aligned that padding would shove it a
          third of a viewport off its footing, so the band is the same 21rem
          measured off the bottom edge instead. The type still sinks into
          softened footage exactly as it did before; nothing above it moves.
        */}
        <ProgressiveBlur
          className="top-auto bottom-0 h-84 z-[var(--z-below)]"
          layers={7}
          maxBlur={20}
        />

        <div className="container flex w-full flex-col items-center">
          <Image
            src={brand.mark}
            alt=""
            aria-hidden
            width={brand.markWidth}
            height={brand.markHeight}
            unoptimized
            priority
            className="mb-6 h-22 w-auto object-contain"
          />
          {/*
            The brand assets are a square mark only — there is no wordmark
            lockup — so the full-bleed statement the hero needs is SET, not
            placed. Scaling with vw keeps it edge-to-edge at every width the
            way an image would.
          */}
          <h1 className="w-full text-center">
            <span className="reveal-mask">
              {/*
                Tight leading (0.82) makes the glyphs overflow their line box,
                so the mask would shear the cap tops off. The em padding here
                grows the animated element's box to contain them — the mask
                then only ever clips it while it is translated out of view.
              */}
              <span
                data-hero-mark
                className="block pt-[0.14em] pb-[0.05em] font-medium text-hero uppercase"
              >
                {site.name}
              </span>
            </span>
          </h1>
          <p data-hero-tagline className="mx-auto mt-8 max-w-xs text-center">
            {site.tagline}
          </p>
        </div>

        {/* Last line of the same bottom-aligned block, rather than a separate
            thing pinned to the edge — the cue reads as the foot of the lockup
            and shares its footing. */}
        <p data-hero-scroll className="mt-section text-caption">
          Scroll to explore
        </p>
      </div>
    </section>
  );
}
