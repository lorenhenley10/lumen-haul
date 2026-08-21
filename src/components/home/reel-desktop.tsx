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
import { duration, gsapEase } from "@/lib/motion";

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
 * Parallax depth for the film inside its mask, as a percentage of slide height.
 *
 * Taken from the reference, which parks an inactive film at
 * `scale(1.05) translateY(-105.75px)` against a 720px viewport — 14.7%.
 */
const MEDIA_SHIFT_PCT = 15;

/**
 * The film is scaled up while it is off-register so the parallax drift always
 * has frame to give: at 15% of travel, 1.05 is the smallest scale that keeps an
 * edge from swinging into view.
 */
const MEDIA_SCALE = 1.05;

interface SlideLayers {
  mask: HTMLElement;
  counter: HTMLElement;
  media: HTMLElement;
}

function layersOf(slide: HTMLElement): SlideLayers | null {
  const mask = slide.querySelector<HTMLElement>("[data-mask]");
  const counter = slide.querySelector<HTMLElement>("[data-counter]");
  const media = slide.querySelector<HTMLElement>("[data-media]");
  return mask && counter && media ? { mask, counter, media } : null;
}

/** The on-screen film: mask open, counter neutral, media in register. */
function applyActive(slide: HTMLElement) {
  const layers = layersOf(slide);
  if (!layers) return;
  gsap.set(slide, { opacity: 1 });
  gsap.set([layers.mask, layers.counter], { yPercent: 0 });
  gsap.set(layers.media, { yPercent: 0, scale: 1 });
}

/**
 * Off-screen resting state. Every film that is neither entering nor leaving.
 *
 * Parked BELOW the frame, matching the common case: scrolling down is what
 * advances the reel, and the next film rises into place. An entering film has
 * its start state written explicitly anyway, so this only decides where the
 * idle stack waits.
 */
function applyParked(slide: HTMLElement) {
  const layers = layersOf(slide);
  if (!layers) return;
  gsap.set(slide, { opacity: 0 });
  gsap.set(layers.mask, { yPercent: 100 });
  gsap.set(layers.counter, { yPercent: -100 });
  gsap.set(layers.media, { yPercent: MEDIA_SHIFT_PCT, scale: MEDIA_SCALE });
}

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
 *   2. TIMED (fixed duration): the slide between films and the pill's travel
 *      down the rail. The reference runs these as real tweens — verified by
 *      sampling at a stationary scroll position, where the outgoing film kept
 *      animating while scrollY never changed.
 *
 * Scrubbing the transition instead would make a fast flick through the reel
 * look like a smear of half-drawn frames. Timing it means every handoff
 * resolves cleanly no matter how fast the wheel moves.
 *
 * THE SLIDE IS A MOVING MASK, NOT A MOVING IMAGE. Three nested layers per film:
 *
 *   mask     `overflow: hidden`, travels a full ±100%
 *   counter  travels exactly ∓100%, cancelling the mask
 *   media    the film itself, carrying a small scale + parallax drift
 *
 * Because the counter cancels the mask, the only thing that actually travels a
 * full viewport is the CLIPPING WINDOW — the footage inside stays registered
 * and never smears or squashes. The film reads as sliding because the media
 * layer drifts MEDIA_SHIFT_PCT in the same direction at a slower rate, so the
 * incoming film settles into register as its window opens and the outgoing one
 * drifts away underneath.
 *
 * The layer construction and the ±100% / 1.05 / 15% magnitudes come from the
 * reference, measured off its resting states. THE DIRECTION DOES NOT — resting
 * states cannot tell you which way a transition runs, only where it starts and
 * stops, and the first cut of this inferred it backwards.
 *
 * The rule is that FILM TRAVELS AGAINST THE SCROLL, like a strip being pulled
 * through a gate: scrolling down advances the reel, so the next film rises from
 * below and the outgoing one is carried up and out. Scrolling back up mirrors
 * every axis of that. If this ever feels wrong again, it is the sign of
 * `direction` below, and nothing else.
 */
export function ReelDesktop({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  /**
   * The film being left behind, held only for as long as the slide runs. It
   * keeps the outgoing video PLAYING while it drifts out — dropping it to
   * paused the instant the index changes freezes a frame in plain sight.
   */
  const [leavingIndex, setLeavingIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const slideRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const settledIndexRef = useRef(0);
  const slideTimeline = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  const total = projects.length;

  // Resting states, once the refs exist. Markup ships with the first film
  // opaque and the rest transparent, so this only has to place the layers —
  // there is no frame where nine films are stacked and visible.
  useEffect(() => {
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      if (index === settledIndexRef.current) applyActive(slide);
      else applyParked(slide);
    });
  }, [total]);

  /**
   * The handoff between two films.
   *
   * Driven from the ScrollTrigger callback rather than an effect on
   * `activeIndex`. Scroll is the external system here — running the slide where
   * the boundary is actually detected keeps one crossing to one timeline, and
   * avoids a state-change effect that would re-render before it could animate.
   */
  const runSlide = useCallback((from: number, to: number) => {
    const incoming = slideRefs.current[to];
    const outgoing = slideRefs.current[from];
    if (!incoming) return;

    // A flick can land a new boundary mid-slide. Kill the running timeline and
    // park everything outside this handoff, so no film is left stranded
    // half-open behind the one on screen.
    slideTimeline.current?.kill();
    slideRefs.current.forEach((slide, index) => {
      if (slide && index !== to && index !== from) applyParked(slide);
    });

    const entering = layersOf(incoming);
    if (!entering) {
      applyActive(incoming);
      return;
    }

    setLeavingIndex(from);

    // +1 advancing. Film travels AGAINST the scroll: going down, the incoming
    // window opens upward from the bottom and both films are carried up and
    // out. −1 mirrors every axis of that.
    const direction = to > from ? 1 : -1;

    const timeline = gsap.timeline({
      defaults: { duration: duration.slow, ease: gsapEase.outExpo },
      onComplete: () => {
        if (outgoing) applyParked(outgoing);
        setLeavingIndex(null);
      },
    });

    gsap.set(incoming, { opacity: 1 });
    timeline
      .fromTo(entering.mask, { yPercent: 100 * direction }, { yPercent: 0 }, 0)
      .fromTo(
        entering.counter,
        { yPercent: -100 * direction },
        { yPercent: 0 },
        0,
      )
      .fromTo(
        entering.media,
        { yPercent: MEDIA_SHIFT_PCT * direction, scale: MEDIA_SCALE },
        { yPercent: 0, scale: 1 },
        0,
      );

    const leaving = outgoing ? layersOf(outgoing) : null;
    if (outgoing && leaving) {
      // The outgoing film holds its ground and lets itself be covered; only its
      // media drifts. Forcing the mask open first matters when this film was
      // itself still entering a moment ago.
      gsap.set(outgoing, { opacity: 1 });
      gsap.set([leaving.mask, leaving.counter], { yPercent: 0 });
      timeline.to(
        leaving.media,
        { yPercent: -MEDIA_SHIFT_PCT * direction, scale: MEDIA_SCALE },
        0,
      );
    }

    slideTimeline.current = timeline;
  }, []);

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

            // Discrete: only crossing a boundary re-renders — and only a
            // crossing starts a slide. The ref, not the state, is the guard,
            // so a re-render can never replay a transition.
            if (index !== settledIndexRef.current) {
              const from = settledIndexRef.current;
              settledIndexRef.current = index;
              setActiveIndex(index);
              runSlide(from, index);
            }
          },
        });

        triggerRef.current = trigger;

        return () => {
          triggerRef.current = null;
          slideTimeline.current?.kill();
          slideTimeline.current = null;
          settledIndexRef.current = 0;
          setActiveIndex(0);
          setLeavingIndex(null);
          // Leaving the breakpoint tears the pin down, so put the stack back
          // the way the markup ships it rather than wherever the slide stopped.
          slideRefs.current.forEach((slide, index) => {
            if (!slide) return;
            if (index === 0) applyActive(slide);
            else applyParked(slide);
          });
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
        // No pin exists under reduced motion, so there is no scroll position to
        // travel to. Snap the stack to the chosen film instead — the rail stays
        // usable and lands on the final state, which is the whole contract.
        if (settledIndexRef.current === index) return;
        settledIndexRef.current = index;
        setActiveIndex(index);
        setLeavingIndex(null);
        slideRefs.current.forEach((slide, position) => {
          if (!slide) return;
          if (position === index) applyActive(slide);
          else applyParked(slide);
        });
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
        const isLeaving = index === leavingIndex;
        return (
          <Link
            key={project.slug}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            href={`/stories/${project.slug}`}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "absolute inset-0 h-dvh w-full",
              // First paint only. From mount on, GSAP owns opacity inline and
              // these classes are inert — which is why nothing here animates it.
              index === 0 ? "opacity-100" : "opacity-0",
              !isActive && "pointer-events-none",
              // The entering film covers the leaving one, which covers the
              // parked stack. Kept in React rather than GSAP so the tokens stay
              // in CSS and nothing writes z-index from two places.
              isActive
                ? "z-[var(--z-content)]"
                : isLeaving
                  ? "z-[var(--z-media)]"
                  : "z-0",
            )}
          >
            {/* The travelling clipping window. */}
            <div data-mask className="h-full w-full overflow-hidden">
              {/* Cancels the mask so the film inside never moves with it. */}
              <div
                data-counter
                className="relative h-full w-full overflow-hidden"
              >
                <div data-media className="h-full w-full">
                  <MediaFrame placeholder={project.loop.placeholder}>
                    {/* The current film plays, and so does the one still
                        sliding out; the rest stay parked on their poster, so
                        nine videos never decode at once. */}
                    <AutoVideo
                      asset={project.loop}
                      active={isActive || isLeaving}
                    />
                  </MediaFrame>
                </div>

                {/* Inside the counter, so the title is revealed by the same
                    wipe as the film — but outside the media layer, so the
                    parallax scale never touches the type. */}
                <div className="absolute inset-0 z-[var(--z-content)] flex flex-col items-center justify-end gap-4 bg-scrim px-12 pt-12 pb-24">
                  <h2 className="text-display text-center tracking-tighter">
                    <span className="font-medium">{project.client}</span>
                    <br />
                    <span className="font-light">{project.title}</span>
                  </h2>
                </div>
              </div>
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
              // Same clock as the film slide, so the pill and the picture
              // arrive together.
              transitionDuration: `${duration.slow}s`,
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
