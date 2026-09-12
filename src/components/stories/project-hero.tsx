"use client";

import Link from "next/link";
import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { useVideo } from "@/components/media/video-provider";
import { Reveal } from "@/components/motion/reveal";
import { heroFilmOf } from "@/content/projects";
import type { Project } from "@/content/types";

/**
 * Project page hero — the "expanded" view of a project.
 *
 * The whole frame is one play affordance. Clicking anywhere over the footage
 * opens the fullscreen player, so the journey reads as a single continuous
 * gesture: click a film on the home reel to expand it here, click it again to
 * go full screen.
 *
 * Implementation notes worth keeping:
 *
 *  - The click target is a real <button> covering the media, underneath the
 *    reading panel. The panel is `pointer-events-none` so a click over the
 *    copy still reaches the button — otherwise the middle of the hero, which
 *    is exactly where people aim, would be dead. The panel's own Play button
 *    re-enables pointer events for itself and for keyboard users.
 *  - The ambient loop plays here rather than a held still. The reference uses
 *    a static frame at this position, but a live frame makes the "click the
 *    video" interaction legible, and the loop is already loaded for the card.
 */
export function ProjectHero({ project }: { project: Project }) {
  const { openFilm } = useVideo();
  const label = `Play ${project.client} — ${project.title}`;

  return (
    <section
      /*
        `z-[var(--z-content)] bg-background` is the reveal-footer contract —
        the same pair HomeHero and ReelDesktop carry, for the same reason.

        The footer is fixed at `--z-reveal` and comes LATER in the document
        than this hero, so a hero left on the default layer loses the
        paint-order tie and the footer draws across its bottom half: the giant
        wordmark sitting over the film, cutting the title in two.

        It is not only a visual tie. `position: sticky` creates a stacking
        context whatever its z-index, so everything inside this section is
        trapped underneath the section's own level — including the reading
        panel, which already asks for `--z-content` and cannot get there from
        in here. That is why BOTH play affordances stopped working: hit
        testing follows paint order, and the footer was taking every click
        aimed at the lower half of the hero, "Play film" included.

        The ground matters too. MediaFrame's black is the only thing making
        this section opaque today, and a frame that has not decoded yet would
        be a hole straight through to the footer.

        `relative` used to sit alongside `sticky` here. Both set `position`,
        so which one won was down to the order Tailwind happened to emit them
        in — a coin toss next to a stacking bug. Sticky is the one that was
        winning and the one the layout needs; the other is gone.
      */
      className="sticky top-0 z-[var(--z-content)] h-dvh bg-background"
    >
      <button
        type="button"
        onClick={() => openFilm(heroFilmOf(project))}
        aria-label={label}
        className="group absolute inset-0 h-full w-full cursor-pointer"
      >
        <MediaFrame placeholder={project.loop.placeholder}>
          <AutoVideo asset={project.loop} priority />
        </MediaFrame>

        {/* Play affordance — always faintly present, firms up on hover. */}
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center"
          style={{ zIndex: "var(--z-media)" }}
        >
          <span className="grid size-20 place-items-center rounded-full bg-black/30 text-xl opacity-70 backdrop-blur-md transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] group-hover:scale-105 group-hover:bg-black/50 group-hover:opacity-100">
            ▶
          </span>
        </span>
      </button>

      {/* Reading panel. Transparent to clicks so the media button stays hittable. */}
      <div className="pointer-events-none absolute inset-0 z-[var(--z-content)] grid place-items-center bg-background/40 py-24 container">
        <div className="max-w-prose">
          <Reveal immediate staggerChildren className="flex flex-col items-start gap-8">
            {/*
              The counterpart to the "next story" card at the foot of the page,
              and the twin of the one on a stills set — above the title in both.
              `pointer-events-auto` is required: the panel around it is
              deliberately transparent to clicks so the media button underneath
              stays hittable, and without this the link would be unclickable.

              Set at foreground rather than the muted step the stills link
              uses. That is the same decision, not a different one: muted is
              contrast-checked against the page background, and there is no
              page background here — this sits over moving footage, where the
              house rule is full-strength type.
            */}
            <Link
              href="/stories"
              className="group/back pointer-events-auto inline-flex items-center gap-2 text-caption text-foreground/80 transition-colors hover:text-foreground"
            >
              <span
                aria-hidden
                className="inline-block transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-expo)] group-hover/back:-translate-x-1"
              >
                ←
              </span>
              All stories
            </Link>

            <div>
              <h1 className="text-display">
                <span className="font-medium">{project.client}</span>
                <br />
                <span className="font-light">{project.title}</span>
              </h1>
              <p className="mt-12 text-pretty">{project.summary}</p>
            </div>

            <button
              type="button"
              onClick={() => openFilm(heroFilmOf(project))}
              className="pointer-events-auto flex items-center gap-3 rounded-full bg-white/10 px-6 py-3 backdrop-blur-lg transition-colors hover:bg-white/20"
            >
              <span aria-hidden>▶</span>
              <span className="text-caption uppercase">Play film</span>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
