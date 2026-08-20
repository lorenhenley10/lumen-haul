import Image from "next/image";
import Link from "next/link";
import { MediaFrame } from "@/components/media/media-frame";
import type { StillsProject } from "@/content/types";

/**
 * One set on the /stills index.
 *
 * A SERVER component, deliberately. The whole tile is a single link and the
 * hover is pure CSS, so there is no state, no effect and no reason to ship
 * this to the browser — the animation boundary in ARCHITECTURE.md §1 puts
 * hover on CSS transitions precisely so surfaces like this stay on the server.
 *
 * The hover is two moves against each other, not one: the frame grows a
 * hair (1.5%) while the photograph inside it grows more (6%) and lifts out of
 * its resting dim. The frame clips the overflow, so the image appears to push
 * against the edges of a box that barely moves. One 6% scale on the whole tile
 * would read as a card popping; this reads as a photograph coming forward.
 *
 * 1.5% of a 350px tile is 5px, against a 16px gutter — a hovered tile never
 * touches its neighbour.
 */
export function StillsTile({ project }: { project: StillsProject }) {
  return (
    <Link href={`/stills/${project.slug}`} className="group/tile block">
      <MediaFrame
        aspect="3/4"
        rounded
        placeholder={project.hero.placeholder}
        className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover/tile:scale-[1.015]"
      >
        <Image
          src={project.hero.src}
          alt={project.hero.alt}
          fill
          // Mirrors the grid exactly — four up at lg, three at md, two below.
          // Without this every tile requests a full-width variant of a
          // quarter-width box.
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          // next/image refuses to optimise SVG unless dangerouslyAllowSVG is
          // set, and the stand-in frame IS an SVG — so a placeholder set would
          // 400 on every tile. Real photographs still go through the optimiser.
          unoptimized={project.hero.placeholder}
          className="object-cover brightness-[0.85] transition-[scale,filter] duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover/tile:scale-[1.06] group-hover/tile:brightness-100"
        />
      </MediaFrame>

      <div className="mt-4">
        <p className="transition-opacity duration-[var(--duration-fast)] group-hover/tile:opacity-60">
          {project.client}
        </p>
        <p className="mt-2 text-caption text-muted-foreground">
          {project.title}
        </p>
      </div>
    </Link>
  );
}
