"use client";

import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { useVideo } from "@/components/media/video-provider";
import { Reveal } from "@/components/motion/reveal";
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
    <section className="relative sticky top-0 h-dvh">
      <button
        type="button"
        onClick={() => openFilm(project)}
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
              onClick={() => openFilm(project)}
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
