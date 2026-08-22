/**
 * next/image loader: resolve a width to a file that already exists.
 *
 * Wired up as `images.loader: "custom"` in next.config.ts, which takes the
 * optimizer out of the path completely — next/image writes whatever this
 * function returns straight into `src` and `srcSet`, and no request ever
 * reaches /_next/image.
 *
 * THAT IS THE WHOLE POINT. Vercel bills an Image Transformation per
 * (photograph, width, quality) that misses its cache, against 5,000 a month.
 * With 451 stills across the galleries, warming the site costs more than the
 * month allows — which is exactly what happened when the library went from 10
 * frames to 481 in nine days. Cloudflare's transformation product has the same
 * 5,000 ceiling, so the fix is not to pick a different meter but to stop
 * generating widths on demand at all.
 *
 * scripts/encode-stills-ladder.sh cuts the rungs once, into R2. R2 charges
 * nothing for egress, so a frame costs the same on its ten-thousandth view as
 * its first, and there is no ceiling to run into.
 *
 * ANYTHING THIS LOADER DOES NOT RECOGNISE IS RETURNED UNTOUCHED. A custom
 * loader is global, so it sees every optimised image on the site, not just the
 * stills — and a URL with no ladder behind it must degrade to the original
 * rather than 404. Today the stills are the only images that reach it: the
 * brand mark and the SVG placeholders are `unoptimized` at their call sites,
 * and the lightbox has always served originals.
 */

/**
 * The rungs on disk, ascending. Must match `RUNGS` in
 * scripts/encode-stills-ladder.sh — a width that resolves to a rung folder the
 * encoder never wrote is a 404, not a fallback.
 *
 * There is deliberately no rung above 1600: the narrowest master is 1706px, so
 * 1600 is the last width that is a downscale for every frame. Wider requests
 * fall through to the master itself, which is the top rung by definition.
 */
const RUNGS = [384, 640, 1080, 1600] as const;

/**
 * Matches a still under either origin — the R2 bucket in deployment
 * (`https://media.lumenhaul.com/<slug>/stills/<file>.jpg`) or /public in local
 * development (`/media/derived/<slug>/stills/<file>.jpg`), since
 * NEXT_PUBLIC_MEDIA_BASE_URL is what switches between them.
 *
 * The capture splits the path at the last slash so a rung can be inserted as
 * its own segment. Anchored at `/stills/` so nothing else on the site can
 * match by accident, and it explicitly refuses a path that already carries a
 * rung, which would otherwise nest `w640/w640/`.
 */
const STILL = /^(.*\/stills\/)(?!w\d+\/)([^/]+\.jpe?g)$/i;

export default function r2ImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const match = STILL.exec(src);
  if (!match) return src;

  // The smallest rung that still covers the requested width. Rounding UP
  // matters: the browser asked for this many pixels because that is what it
  // intends to draw, and handing it the rung below would show a soft frame on
  // a page whose whole job is photographs.
  const rung = RUNGS.find((r) => r >= width);

  // Wider than every rung — the master is the answer, and it is already the
  // URL we were given.
  if (rung === undefined) return src;

  const [, dir, file] = match;
  return `${dir}w${rung}/${file}`;
}
