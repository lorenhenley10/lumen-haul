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
  images: { remotePatterns },

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
};

export default nextConfig;
