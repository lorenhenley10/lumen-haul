import type { ImageAsset, VideoAsset, AspectRatio } from "./types";
import { stillsManifest } from "./stills.generated";

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

/**
 * Where derived media is served from.
 *
 * Unset  -> "/media/derived", i.e. the files in /public. Works offline with no
 *           configuration, which is what you want for local development.
 * Set    -> an absolute origin such as https://media.lumenhaul.com, pointing at
 *           the Cloudflare R2 bucket.
 *
 * The bucket's layout mirrors public/media/derived/ exactly (<slug>/loop.mp4,
 * <slug>/poster.jpg, <slug>/stills/NN.jpg), so switching between the two is a
 * single environment variable and nothing else in the codebase changes.
 *
 * NEXT_PUBLIC_ is required: these URLs are needed during render, both on the
 * server and in the browser.
 */
const DERIVED = (
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "/media/derived"
).replace(/\/$/, "");

/**
 * Cache-busting revisions for RE-CUT loops and posters.
 *
 * sync-r2.sh uploads these with `Cache-Control: immutable, max-age=1y` under
 * filenames that never change. `immutable` is a promise that a given URL's
 * bytes will never move, so the URL is the only thing that can tell a cache
 * otherwise — re-uploading the object is not enough.
 *
 * This is not theoretical. After re-cutting the FD loop, the bare URL served a
 * twelve-day-old body on every request (`cf-cache-status: HIT`) while the same
 * path with a `?v=` token returned the new bytes immediately. The Shoreline
 * poster had been stale the same way since its July re-cut, unnoticed, and it
 * is the frame behind the home hero.
 *
 * BUMP A SLUG HERE whenever you change its loop start in encode-media.sh.
 * Slugs absent from this map are still on their first cut and need no token.
 *
 * Loop and poster share one number because encode-media.sh always regenerates
 * them together. film.mp4 is deliberately left alone: films are encoded
 * independently and are hundreds of megabytes, so it gets its own bump if one
 * is ever re-encoded.
 */
const LOOP_REVISION: Record<string, number> = {
  // Re-cut to 8.5s, just past the "ELEVATED" intro title card.
  "fd-2022-buy-now-japan": 2,
  // 2: the folder changed film entirely — it held a studio set test, and now
  // holds the classic car show piece. Same paths, completely different footage,
  // so without this the old test stays in front of everyone for a year.
  "blazar-mantis-25-100": 2,
  // 2: re-cut from 15s to the tunnel exit at 41.5s.
  "born-to-ride": 2,
  // 2: re-cut to 37s in July; the poster never reached anyone behind the CDN.
  // 3: re-encoded from the regraded "Color + Audio fix final" master.
  // 4: again, from "Color + Audio fix final 2".
  "shoreline-f150-raptor": 4,
  // Re-cut from 60s to 1s. 60s landed inside the red-and-black lens product
  // sequence, so the preview was all graphic and no footage.
  "blazar-mantis-135": 2,
};

/** `?v=n` for a re-cut slug, or an empty string for a first cut. */
function loopRevision(slug: string): string {
  const revision = LOOP_REVISION[slug];
  return revision ? `?v=${revision}` : "";
}

/** The ambient loop for a project: silent, short, used on the home reel. */
export function derivedLoop(
  slug: string,
  opts: { alt: string; aspect?: AspectRatio },
): VideoAsset {
  const rev = loopRevision(slug);
  return {
    kind: "video",
    id: `${slug}-loop`,
    sources: [{ src: `${DERIVED}/${slug}/loop.mp4${rev}`, type: "video/mp4" }],
    poster: `${DERIVED}/${slug}/poster.jpg${rev}`,
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
    // The film's own bytes are untouched by a loop re-cut, so it keeps a clean
    // URL; the poster it shares with the loop does not.
    sources: [{ src: `${DERIVED}/${slug}/film.mp4`, type: "video/mp4" }],
    poster: `${DERIVED}/${slug}/poster.jpg${loopRevision(slug)}`,
    aspect: opts.aspect ?? "16/9",
    duration: opts.duration,
    alt: opts.alt,
  };
}

/**
 * Supporting stills, numbered 01..n by the encode script.
 *
 * Dimensions come from `stills.generated.ts` rather than being assumed, because
 * shoots mix orientations — Blazar and JOBY both contain portrait frames
 * alongside landscape ones. Declaring one aspect ratio for a whole project
 * would size half the gallery wrong.
 *
 * The list is driven by the manifest too, so adding or removing photos is a
 * re-run of ./scripts/encode-stills.sh with no edit here.
 */
export function derivedStills(slug: string, altPrefix: string): ImageAsset[] {
  const entries = stillsManifest[slug] ?? [];

  return entries.map((entry, i) => {
    const portrait = entry.height > entry.width;
    return {
      kind: "image",
      id: `${slug}-still-${entry.file.replace(".jpg", "")}`,
      src: `${DERIVED}/${slug}/stills/${entry.file}`,
      alt: `${altPrefix} — still ${i + 1}`,
      aspect: portrait ? "3/4" : "16/9",
      width: entry.width,
      height: entry.height,
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
 * The film behind the home hero. Reuses a project loop so the landing frame is
 * real footage rather than a placeholder card.
 *
 * The hero film also appears in the reel below it; that overlap is deliberate
 * and long-standing, so changing this does not require pulling the project out
 * of projects.ts.
 */
export const heroFilm = derivedLoop("shoreline-f150-raptor", {
  alt: "Lumen Haul showreel",
});
