"use client";

import Image from "next/image";
import { useVideo } from "@/components/media/video-provider";
import { Reveal } from "@/components/motion/reveal";
import type { Project } from "@/content/types";

/**
 * Project page hero.
 *
 * A held poster frame with a reading panel over it. The film itself is NOT
 * playing behind the copy — the case study opens on a still, and the film is
 * something the visitor chooses to start. That restraint is the point: it
 * makes "Play film" a real action rather than a redundant one.
 */
export function ProjectHero({ project }: { project: Project }) {
  const { openFilm } = useVideo();

  return (
    <section className="sticky top-0 h-dvh">
      <div className="absolute inset-0">
        <Image
          src={project.film.poster}
          alt={project.film.alt}
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 z-[var(--z-media)] grid place-items-center bg-background/40 py-24 container">
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
              className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-3 backdrop-blur-lg transition-colors hover:bg-white/20"
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
