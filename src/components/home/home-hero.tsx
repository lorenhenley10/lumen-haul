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
    <section ref={root} className="sticky top-0 h-dvh overflow-hidden">
      <div className="h-full w-full brightness-[0.8]">
        <MediaFrame placeholder={heroFilm.placeholder}>
          <AutoVideo asset={heroFilm} priority audible />
        </MediaFrame>
      </div>

      <div className="absolute inset-0 z-[var(--z-media)] flex flex-col items-center justify-between bg-scrim pt-24">
        <div className="container flex w-full flex-col items-center">
          <Image
            src={brand.mark}
            alt=""
            aria-hidden
            width={512}
            height={512}
            priority
            className="mb-6 size-16 object-contain"
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
                className="block pt-[0.14em] pb-[0.05em] font-medium uppercase leading-[0.82] tracking-[-0.04em]"
                style={{ fontSize: "clamp(3rem, 13.5vw, 15rem)" }}
              >
                {site.name}
              </span>
            </span>
          </h1>
          <p data-hero-tagline className="mx-auto mt-8 max-w-xs text-center">
            {site.tagline}
          </p>
        </div>

        <div className="relative container w-full pt-72 pb-8 text-center">
          <ProgressiveBlur className="z-[var(--z-below)]" layers={7} maxBlur={20} />
          <p data-hero-scroll className="text-caption">
            Scroll to explore
          </p>
        </div>
      </div>
    </section>
  );
}
