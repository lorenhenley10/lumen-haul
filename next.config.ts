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
    ];
  },
};

export default nextConfig;
