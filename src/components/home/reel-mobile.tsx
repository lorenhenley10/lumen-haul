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
  const panelsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.panelIndex ?? "-1",
          );
          setActiveIndex(index);
        }
      },
      { root, threshold: 0.6 },
    );

    panelsRef.current.forEach((panel) => panel && observer.observe(panel));
    return () => observer.disconnect();
  }, [projects.length]);

  return (
    <div className="fixed inset-0 h-svh snap-y snap-mandatory overflow-y-auto">
      {/* Fixed film layer — one element per project, only the active one visible. */}
      <div className="pointer-events-none fixed inset-0 -z-[1] h-svh select-none">
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

      {/* Hero panel */}
      <section
        ref={(el) => {
          panelsRef.current[0] = el;
        }}
        data-panel-index={-1}
        className="relative h-svh snap-start"
      >
        <div className="h-full w-full brightness-[0.8]">
          <MediaFrame placeholder={heroFilm.placeholder}>
            <AutoVideo asset={heroFilm} priority audible />
          </MediaFrame>
        </div>
        <div className="absolute inset-0 z-[var(--z-media)] flex flex-col items-center justify-center gap-8 bg-scrim px-container pt-24">
          <Image
            src={brand.mark}
            alt=""
            aria-hidden
            width={512}
            height={512}
            priority
            className="size-14 object-contain"
          />
          <h1
            className="w-full text-center font-display font-medium uppercase leading-[0.82] tracking-[-0.04em]"
            style={{ fontSize: "clamp(2.75rem, 15vw, 6rem)" }}
          >
            {site.name}
          </h1>
          <p className="mx-auto max-w-xs text-center">{site.tagline}</p>
        </div>
      </section>

      {/* Title panels */}
      {projects.map((project, index) => (
        <div
          key={project.slug}
          ref={(el) => {
            panelsRef.current[index + 1] = el;
          }}
          data-panel-index={index}
          className="relative h-svh w-full snap-start bg-scrim p-12"
        >
          <Link href={`/stories/${project.slug}`} className="block h-full w-full">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
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
  );
}
