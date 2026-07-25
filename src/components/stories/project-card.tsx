"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AutoVideo } from "@/components/media/auto-video";
import { MediaFrame } from "@/components/media/media-frame";
import { useVideo } from "@/components/media/video-provider";
import { useMediaQuery } from "@/lib/hooks";
import type { Project } from "@/content/types";

/**
 * Project card for the /stories grid.
 *
 * Preview playback is HOVER-GATED on pointer devices and viewport-gated on
 * touch: a phone has no hover, and starting eighteen previews because they are
 * technically on screen would be indefensible. `useMediaQuery('(hover: hover)')`
 * is the honest test for this — not a width breakpoint.
 *
 * Markup note: the play control is a real <button> and therefore CANNOT sit
 * inside the <a>. The card is a plain container with two separate interactive
 * children — a link to the case study, and a button that opens the film.
 */
export function ProjectCard({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const { openFilm } = useVideo();
  const canHover = useMediaQuery("(hover: hover)");

  const handleProgress = useCallback((ratio: number) => setProgress(ratio), []);

  // On hover-capable devices the pointer decides; elsewhere AutoVideo's own
  // viewport detection does (passing `undefined` hands control back to it).
  const active = canHover ? hovered : undefined;

  return (
    <div
      className="group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setProgress(0);
      }}
    >
      <div className="relative">
        <MediaFrame
          aspect="16/9"
          rounded
          placeholder={project.loop.placeholder}
          className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.01]"
        >
          <AutoVideo
            asset={project.loop}
            active={active}
            onProgress={handleProgress}
          />

          {/* Playhead for the preview loop. */}
          <div
            className="absolute bottom-0 left-0 h-[3px] rounded-r bg-white transition-opacity"
            style={{
              width: `${progress * 100}%`,
              opacity: active ? 1 : 0,
              transitionDuration: "var(--duration-fast)",
            }}
            aria-hidden
          />

          <button
            type="button"
            onClick={() => openFilm(project)}
            aria-label={`Play ${project.client} — ${project.title}`}
            className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-[var(--duration-fast)] focus-visible:opacity-100 group-hover/card:opacity-100"
          >
            <span className="grid size-14 place-items-center rounded-full bg-black/40 text-caption backdrop-blur-md">
              ▶
            </span>
          </button>
        </MediaFrame>
      </div>

      <div className="mt-4 grid grid-cols-8">
        <p className="mt-1 text-caption text-muted-foreground">
          [{String(project.index).padStart(2, "0")}]
        </p>
        <div className="col-span-7">
          <Link
            href={`/stories/${project.slug}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-60"
          >
            {project.client}
          </Link>
          <p className="mt-2 text-caption text-muted-foreground">
            {project.title}
          </p>
        </div>
      </div>
    </div>
  );
}
