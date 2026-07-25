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
};

export default nextConfig;
