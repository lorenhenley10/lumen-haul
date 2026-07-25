import type { ImageAsset, VideoAsset, AspectRatio } from "./types";

/**
 * Media registry + placeholder factory.
 *
 * Until real masters land, every asset points at the shared stand-in files in
 * /public/media/placeholder/. `placeholder: true` drives a dev-only badge and
 * keeps the build honest about what is still missing.
 *
 * TO SWAP IN REAL MEDIA: replace the `sources`/`poster` paths here and delete
 * the `placeholder` flag. No component changes.
 */

export const PLACEHOLDER_POSTER = "/media/placeholder/poster.svg";
export const PLACEHOLDER_STILL = "/media/placeholder/still.svg";

export function video(
  id: string,
  opts: {
    alt: string;
    aspect?: AspectRatio;
    duration?: number;
    src?: string;
    poster?: string;
  },
): VideoAsset {
  const isPlaceholder = !opts.src;
  return {
    kind: "video",
    id,
    // A placeholder asset carries NO sources on purpose. An empty source list
    // means the player renders the poster and issues zero network requests —
    // far better than pointing at a missing file and eating a 404 per tile.
    sources: isPlaceholder ? [] : [{ src: opts.src!, type: "video/mp4" }],
    poster: opts.poster ?? PLACEHOLDER_POSTER,
    aspect: opts.aspect ?? "16/9",
    // Declared duration drives reel pacing and progress UI even with no file.
    duration: opts.duration ?? 12,
    alt: opts.alt,
    placeholder: isPlaceholder,
  };
}

export function still(
  id: string,
  opts: {
    alt: string;
    aspect?: AspectRatio;
    src?: string;
    width?: number;
    height?: number;
  },
): ImageAsset {
  const isPlaceholder = !opts.src;
  return {
    kind: "image",
    id,
    src: opts.src ?? PLACEHOLDER_STILL,
    alt: opts.alt,
    aspect: opts.aspect ?? "16/9",
    width: opts.width ?? 1600,
    height: opts.height ?? 900,
    placeholder: isPlaceholder,
  };
}

/** Site-wide background film behind the home hero. */
export const heroFilm = video("hero-reel", {
  alt: "Lumen Haul showreel",
  duration: 24,
});
