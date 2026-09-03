import type { NextConfig } from "next";

/**
 * next/image refuses remote sources unless their host is allowlisted. Rather
 * than hardcoding the R2 domain in two places, derive it from the same
 * NEXT_PUBLIC_MEDIA_BASE_URL that src/content/media.ts reads.
 *
 * When the variable is unset (local development against /public) there is no
 * remote host to allow and the list stays empty.
 */
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];

if (mediaBase && /^https?:\/\//i.test(mediaBase)) {
  const url = new URL(mediaBase);
  remotePatterns.push({
    protocol: url.protocol.replace(":", "") as "http" | "https",
    hostname: url.hostname,
    pathname: "/**",
  });
}

const nextConfig: NextConfig = {
  images: {
    /**
     * THE OPTIMIZER IS OUT OF THE PATH. `loader: "custom"` means next/image
     * writes whatever src/lib/r2-image-loader.ts returns straight into `src`
     * and `srcSet`; nothing reaches /_next/image, and no width is generated on
     * demand by anybody.
     *
     * This is a cost decision, not a performance one. Vercel bills an Image
     * Transformation for every (photograph, width) that misses its cache,
     * against 5,000 a month. The stills library went from 10 frames to 481 in
     * nine days and spent 75% of the allowance warming itself; at 451 gallery
     * stills the site cannot be crawled once inside a month's budget.
     * Cloudflare's own transformation product has the SAME 5,000 ceiling and
     * the same failure mode past it, so moving the work there would have
     * bought a different invoice rather than a fix.
     *
     * The widths are cut once by scripts/encode-stills-ladder.sh and live in
     * R2 beside their masters. R2 charges nothing for egress, so a frame costs
     * the same on its ten-thousandth view as its first, and there is no
     * monthly ceiling to run into.
     */
    loader: "custom",
    loaderFile: "./src/lib/r2-image-loader.ts",

    /**
     * The widths a browser is allowed to ask for. THESE ARE FILENAMES NOW, not
     * parameters — each one below 2560 has to exist as a `w<N>/` folder in R2
     * or it is a 404, so this list and `RUNGS` in encode-stills-ladder.sh move
     * together.
     *
     * 2560 has no rung folder on purpose: it IS the master the encoder already
     * wrote, and the loader returns the original URL for anything that wide.
     *
     * 384 is the only entry that needs to be an imageSize rather than a device
     * size — imageSizes apply solely to images that pass `sizes`, which is
     * every gallery tile, and a 50vw tile on a phone lands there. Everything
     * larger is a device size. There is no 3840 tier any more: the masters are
     * 2560, so it only ever upscaled.
     */
    deviceSizes: [640, 1080, 1600, 2560],
    imageSizes: [384],

    /**
     * Kept, though a custom loader means Next never consults them: they are
     * the allowlist the BUILT-IN optimizer would use, and if this project ever
     * drops the loader, an empty list here would silently refuse every remote
     * still rather than fail loudly.
     */
    remotePatterns,
  },

  /**
   * /studio became /about. The old path was live, is linked from the footer of
   * every page that has been indexed so far, and `/studio#contact` was the
   * header CTA — so it redirects rather than 404s. The fragment survives a 308
   * on its own; browsers reattach it to the destination.
   */
  async redirects() {
    return [
      { source: "/studio", destination: "/about", permanent: true },
      /*
       * The Blazar story was named after a film rather than the client, and
       * went stale as soon as a different film took the lead. The old path was
       * live and indexed, so it redirects rather than 404s.
       */
      {
        source: "/stories/blazar-mantis-135",
        destination: "/stories/blazar",
        permanent: true,
      },
      /*
       * The stills slate was rebuilt around the reorganised masters: seven
       * clients, each holding one or more galleries, replacing eight sets of
       * which half were stand-ins. These URLs were live, so they land on the
       * client that now holds that work rather than 404ing.
       */
      {
        source: "/stills/shoreline-raptor-r",
        destination: "/stills/shoreline-motoring",
        permanent: true,
      },
      {
        source: "/stills/blaque-diamond-model-s",
        destination: "/stills/blaque-diamond",
        permanent: true,
      },
      {
        source: "/stills/blazar-apex-l",
        destination: "/stills/blazar",
        permanent: true,
      },
      {
        source: "/stills/fd-slc-2022",
        destination: "/stills/formula-drift",
        permanent: true,
      },
      /*
       * These three were stand-in sets with no photographs behind them. There
       * is no equivalent to send them to, so they land on the index.
       */
      { source: "/stills/watanabe-wheels", destination: "/stills", permanent: true },
      { source: "/stills/1886-wheels", destination: "/stills", permanent: true },
      { source: "/stills/eufymake-product", destination: "/stills", permanent: true },
      /*
       * JOBY was pulled from the slate. The page was live, so its URL lands on
       * the index rather than a dead end — a visitor following an old link gets
       * the rest of the work instead of a 404.
       */
      {
        source: "/stories/joby-joshua-tree",
        destination: "/stories",
        permanent: true,
      },
    ];
  },

  /**
   * Two families of standing link are served as static files out of public/:
   * client estimates in /q/, and internal briefs in /brief/. Both are
   * world-readable to anyone holding the URL — there is no auth in front of a
   * file in public/. The filenames carry a random suffix so neither directory
   * can be enumerated by guessing.
   *
   * This is the second half of that. Each of those pages already carries a
   * robots meta tag; a meta tag only works on something that parses the HTML,
   * so this header covers the fetches that do not. Between them, a client's
   * name, the scope of their job and its price — and, under /brief/, the
   * studio's own target lists and pricing bands — stay out of search results.
   *
   * NOT robots.txt, deliberately. That file is public, so listing these paths
   * in it would advertise them to exactly the people the random filename is
   * meant to hide them from.
   */
  async headers() {
    const noIndex = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive, nosnippet",
      },
    ];

    return [
      { source: "/q/:path*", headers: noIndex },
      { source: "/brief/:path*", headers: noIndex },
    ];
  },
};

export default nextConfig;
