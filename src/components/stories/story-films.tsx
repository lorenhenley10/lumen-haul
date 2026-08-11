"use client";

import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { useVideo } from "@/components/media/video-provider";
import { Reveal } from "@/components/motion/reveal";
import type { StoryFilm } from "@/content/types";

interface StoryFilmsProps {
  /** Prefixes each film's label in the player, matching the hero's format. */
  client: string;
  films: StoryFilm[];
}

/**
 * The films in a story after the hero.
 *
 * Sits directly below the hero — before the behind-the-scenes gallery — because
 * these are the work, and the gallery is support material. Scrolling off the
 * hero should land on another film, not on stills.
 *
 * Each block behaves exactly like the hero: the ambient loop plays in place,
 * the whole frame is one play affordance, and clicking opens the same
 * fullscreen player. That consistency is the point — a visitor who has already
 * clicked the hero knows what these do without being told.
 *
 * The section label is deliberately quiet and the film titles carry the
 * heading step. The type scale has no size between `text-heading` and the 14px
 * UI step, so making the label a second `text-heading` would set it the same
 * size as the titles underneath it and flatten the hierarchy.
 */
export function StoryFilms({ client, films }: StoryFilmsProps) {
  const { openFilm } = useVideo();

  if (films.length === 0) return null;

  return (
    <section className="container pt-32">
      <Reveal>
        <p className="text-caption text-muted-foreground uppercase">
          {films.length === 1 ? "Also in this story" : "More in this story"}
        </p>
      </Reveal>

      <div className="mt-8 flex flex-col gap-24">
        {films.map((film) => (
          /* `scroll-mt` clears the fixed header for any link that targets a
             specific film by id. */
          <article key={film.id} id={film.id} className="scroll-mt-32">
            <Reveal y={16}>
              <button
                type="button"
                onClick={() =>
                  openFilm({
                    id: film.id,
                    title: `${client} — ${film.title}`,
                    asset: film.film,
                  })
                }
                aria-label={`Play ${client} — ${film.title}`}
                className="group/film block w-full cursor-pointer text-left"
              >
                <div className="relative">
                  <MediaFrame
                    aspect={film.loop.aspect}
                    rounded
                    placeholder={film.loop.placeholder}
                  >
                    <AutoVideo asset={film.loop} />
                  </MediaFrame>

                  {/* Play affordance — faint at rest, firms up on hover, same
                      as the hero's. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid place-items-center"
                    style={{ zIndex: "var(--z-media)" }}
                  >
                    <span className="grid size-16 place-items-center rounded-full bg-black/30 text-lg opacity-70 backdrop-blur-md transition-all duration-[var(--duration-base)] ease-[var(--ease-out-expo)] group-hover/film:scale-105 group-hover/film:bg-black/50 group-hover/film:opacity-100">
                      ▶
                    </span>
                  </span>
                </div>

                <h2 className="text-heading mt-6">{film.title}</h2>
                {film.summary && (
                  <p className="mt-3 max-w-prose text-pretty text-muted-foreground">
                    {film.summary}
                  </p>
                )}
              </button>
            </Reveal>
          </article>
        ))}
      </div>
    </section>
  );
}
