import type { ImageAsset, VideoAsset, AspectRatio } from "./types";

/**
 * Media registry.
 *
 * Two kinds of asset live here:
 *
 * 1. REAL media, produced by `scripts/encode-media.sh` from the camera masters
 *    and written to /public/media/derived/<slug>/. The masters themselves are
 *    27GB of 4K at 40-113 Mbps, are gitignored, and are never served.
 *
 *      loop.mp4    ~10s silent excerpt, long side 1920 — home reel + card hover
 *      film.mp4    full piece with audio      — the fullscreen player
 *      poster.jpg  a frame from the loop's start point
 *      stills/NN.jpg  supporting photography
 *
 * 2. PLACEHOLDER assets, for anything without media yet. These carry an empty
 *    `sources` array on purpose: AutoVideo then renders the poster and issues
 *    zero network requests, which beats 404ing on a missing file.
 *
 * TO ADJUST CONTENT: edit projects.ts. To re-encode after adding masters, run
 * ./scripts/encode-media.sh (and ./scripts/encode-stills.sh for photos).
 */

export const PLACEHOLDER_POSTER = "/media/placeholder/poster.svg";
export const PLACEHOLDER_STILL = "/media/placeholder/still.svg";

const DERIVED = "/media/derived";

/** The ambient loop for a project: silent, short, used on the home reel. */
export function derivedLoop(
  slug: string,
  opts: { alt: string; aspect?: AspectRatio },
): VideoAsset {
  return {
    kind: "video",
    id: `${slug}-loop`,
    sources: [{ src: `${DERIVED}/${slug}/loop.mp4`, type: "video/mp4" }],
    poster: `${DERIVED}/${slug}/poster.jpg`,
    aspect: opts.aspect ?? "16/9",
    duration: 10,
    alt: opts.alt,
  };
}

/** The full piece, opened in the fullscreen player. Carries audio. */
export function derivedFilm(
  slug: string,
  opts: { alt: string; aspect?: AspectRatio; duration: number },
): VideoAsset {
  return {
    kind: "video",
    id: `${slug}-film`,
    sources: [{ src: `${DERIVED}/${slug}/film.mp4`, type: "video/mp4" }],
    poster: `${DERIVED}/${slug}/poster.jpg`,
    aspect: opts.aspect ?? "16/9",
    duration: opts.duration,
    alt: opts.alt,
  };
}

/** Supporting stills, numbered 01..n by the encode script. */
export function derivedStills(
  slug: string,
  count: number,
  altPrefix: string,
  aspect: AspectRatio = "16/9",
): ImageAsset[] {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      kind: "image",
      id: `${slug}-still-${n}`,
      src: `${DERIVED}/${slug}/stills/${n}.jpg`,
      alt: `${altPrefix} — still ${i + 1}`,
      aspect,
      width: 1600,
      height: aspect === "9/16" ? 2844 : 1067,
    };
  });
}

/** A video with no file behind it yet. Renders as poster only, fetches nothing. */
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
    sources: isPlaceholder ? [] : [{ src: opts.src!, type: "video/mp4" }],
    poster: opts.poster ?? PLACEHOLDER_POSTER,
    aspect: opts.aspect ?? "16/9",
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

/**
 * The film behind the home hero. Reuses the Blazar MANTIS loop so the landing
 * frame is real footage rather than a placeholder card.
 */
export const heroFilm = derivedLoop("blazar-mantis-135", {
  alt: "Lumen Haul showreel",
});
