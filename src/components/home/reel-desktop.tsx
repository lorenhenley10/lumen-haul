"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { useLenis } from "@/components/providers/lenis-provider";
import { cn } from "@/lib/cn";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { Project } from "@/content/types";
import { useReducedMotion } from "@/lib/hooks";

/**
 * Scroll distance allotted to each film, in viewport heights.
 *
 * Measured from the reference: its pin-spacer carries exactly 12150px of
 * `padding-bottom` at a 900px viewport across 9 films — 1350px each, or 1.5
 * viewports. Verified twice against the live fill value: at scrollY 3000 the
 * bubble read 0.556 ((3000-2250)/1350 = 0.5556) and at 3800 it read 0.148
 * ((3800-3600)/1350 = 0.1481).
 */
const SEGMENT_VH = 1.5;

/** Rail geometry. Items are square, so one item = one row of translation. */
const RAIL_ITEM_PX = 36;
const RAIL_VISIBLE_ITEMS = 5.5;

/**
 * The featured reel — desktop.
 *
 * A pinned, scroll-driven sequence. The section locks to the viewport and each
 * film owns SEGMENT_VH worth of scroll; within a film's segment the numbered
 * bubble on the right fills downward in step with scroll progress. When a
 * bubble completes, the reel advances. Scrolling back up runs the whole thing
 * in reverse. After the last film the pin releases and the page resumes.
 *
 * TWO CLOCKS, DELIBERATELY SEPARATE — this is the detail that makes it feel
 * like the reference rather than a scrubbed carousel:
 *
 *   1. SCRUBBED (scroll-linked): the active index and the bubble fill. These
 *      track the scrollbar exactly, with no smoothing and no transition.
 *   2. TIMED (fixed duration): the crossfade between films and the pill's
 *      slide down the rail. The reference runs these as real tweens — verified
 *      by sampling at a stationary scroll position, where the outgoing film
 *      faded 0.91 → 0 over ~0.5s while scrollY never changed.
 *
 * Scrubbing the crossfade instead would make a fast flick through the reel
 * look like a smear of half-dissolved frames. Timing it means every transition
 * resolves cleanly no matter how fast the wheel moves.
 *
 * The crossfade direction also matters: the incoming film snaps to full
 * opacity *underneath*, and the outgoing film fades out *on top* of it. That
 * is why there is never a dip to background between two films.
 */
export function ReelDesktop({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  const total = projects.length;

  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      /*
       * Scoped to the `md` breakpoint on purpose.
       *
       * This component is rendered at every width and hidden below `md` with
       * `display: none` (see HomePage — both trees are always in the markup so
       * server and client agree). Without this guard the pin would still be
       * built for the hidden tree: ScrollTrigger would measure a zero-height
       * element and reserve ~11000px of phantom spacing, and crossing the
       * breakpoint on resize would leave a broken pin behind.
       *
       * matchMedia creates the trigger on entering the query and fully reverts
       * it on leaving, which is exactly the lifecycle this needs.
       */
      const mm = gsap.matchMedia();

      mm.add("(min-width: 48rem)", () => {
        if (!sectionRef.current) return;

        const trigger = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top top",
          // A function so refresh re-derives the distance from the current
          // viewport height rather than keeping a stale pixel value.
          end: () => `+=${window.innerHeight * SEGMENT_VH * total}`,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          // Pin a frame early so a fast flick doesn't show a seam at handoff.
          anticipatePin: 1,
          onUpdate: (self) => {
            const scaled = self.progress * total;
            const index = Math.min(Math.floor(scaled), total - 1);
            const withinSegment = Math.min(scaled - index, 1);

            // Continuous readout: written straight to the DOM every frame.
            // Routing this through React state would re-render nine slides
            // sixty times a second to move one bubble.
            if (fillRef.current) {
              fillRef.current.style.transform = `scaleY(${withinSegment})`;
            }

            // Discrete: only crossing a boundary re-renders.
            setActiveIndex((current) => (current === index ? current : index));
          },
        });

        triggerRef.current = trigger;

        return () => {
          triggerRef.current = null;
          setActiveIndex(0);
          if (fillRef.current) fillRef.current.style.transform = "scaleY(0)";
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion, total] },
  );

  /** Jump to a film by scrolling to the start of its segment. */
  const goTo = useCallback(
    (index: number) => {
      const trigger = triggerRef.current;
      if (!trigger) {
        setActiveIndex(index);
        return;
      }
      const target =
        trigger.start + index * window.innerHeight * SEGMENT_VH + 1;
      if (lenis.current) lenis.current.scrollTo(target);
      else window.scrollTo({ top: target, behavior: "smooth" });
    },
    [lenis],
  );

  // Keep the active numeral in view when the list is taller than the rail.
  useEffect(() => {
    railRef.current?.scrollTo({
      top: Math.max(
        0,
        (activeIndex - Math.floor(RAIL_VISIBLE_ITEMS / 2)) * RAIL_ITEM_PX,
      ),
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <section
      ref={sectionRef}
      className="relative z-[var(--z-content)] h-dvh overflow-hidden bg-background"
    >
      {projects.map((project, index) => {
        const isActive = index === activeIndex;
        return (
          <Link
            key={project.slug}
            href={`/stories/${project.slug}`}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "absolute inset-0 h-dvh w-full",
              isActive
                ? // Incoming: snaps to full opacity, sits underneath, no
                  // transition — the reveal is done by the outgoing film.
                  "z-[var(--z-media)] opacity-100 transition-none"
                : // Outgoing: fades out ON TOP, uncovering the incoming.
                  "pointer-events-none z-[2] opacity-0 transition-opacity ease-out",
            )}
            style={isActive ? undefined : { transitionDuration: "500ms" }}
          >
            <MediaFrame placeholder={project.loop.placeholder}>
              {/* Only the current film is told to play; the rest stay parked
                  on their poster, so nine videos never decode at once. */}
              <AutoVideo asset={project.loop} active={isActive} />
            </MediaFrame>

            <div className="absolute inset-0 z-[var(--z-content)] flex flex-col items-center justify-center gap-4 bg-scrim p-12">
              <h2 className="text-display text-center tracking-tighter">
                <span className="font-medium">{project.client}</span>
                <br />
                <span className="font-light">{project.title}</span>
              </h2>
            </div>
          </Link>
        );
      })}

      {/* Index rail — doubles as the scroll playhead. */}
      <div
        className="absolute top-1/2 right-container z-[var(--z-rail)] w-9 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 shadow-base backdrop-blur-lg"
        role="tablist"
        aria-label="Featured films"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[var(--z-media)] h-8 bg-linear-to-b from-background/50 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[var(--z-media)] h-8 bg-linear-to-t from-background/50 to-transparent"
          aria-hidden
        />

        <div
          ref={railRef}
          className="hide-scrollbar relative flex flex-col overflow-y-auto"
          style={{ maxHeight: RAIL_ITEM_PX * RAIL_VISIBLE_ITEMS }}
        >
          {/*
            The active bubble. Its POSITION is tweened (timed) as the index
            changes; the fill inside it is scrubbed (scroll-linked).
            Both layers are the same translucent white, so the filled portion
            reads as roughly double the unfilled — matching the reference,
            which stacks two `white/15` layers over a `white/10` rail.
          */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 aspect-square w-full overflow-hidden rounded-full bg-white/15 transition-transform ease-out"
            style={{
              transform: `translateY(${activeIndex * 100}%)`,
              transitionDuration: "500ms",
            }}
            aria-hidden
          >
            <div
              ref={fillRef}
              className="absolute inset-0 origin-top bg-white/15"
              style={{ transform: "scaleY(0)" }}
            />
          </div>

          {projects.map((project, index) => (
            <button
              key={project.slug}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${project.client} — ${project.title}`}
              onClick={() => goTo(index)}
              className="relative z-[var(--z-content)] grid aspect-square w-full shrink-0 place-items-center rounded-full hover:bg-white/10"
            >
              <span className="text-caption mix-blend-difference">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
