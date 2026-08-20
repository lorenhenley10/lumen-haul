import Image from "next/image";
import type { ImageAsset } from "@/content/types";

/**
 * The banner at the top of a set's page.
 *
 * Full-bleed, and with NOTHING set over it. Every other hero on this site
 * carries its title on a scrim over the media, because there the media is
 * footage and the frame is arbitrary. Here the media is the work: the title
 * and the description sit underneath, where they caption the photograph
 * instead of covering it.
 *
 * The one overlay is a short gradient at the top edge, which is not decoration
 * — the header floats over this section, and its own wash is not enough to
 * hold a white nav pill against a bright sky.
 *
 * A server component: an image and a gradient, no interactivity.
 */
export function StillsBanner({ image }: { image: ImageAsset }) {
  return (
    <section className="relative h-[62svh] min-h-[380px] w-full overflow-hidden bg-black lg:h-[78dvh]">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        // Above the fold on every set page — the one image on the site that
        // should never wait for an intersection observer.
        priority
        sizes="100vw"
        unoptimized={image.placeholder}
        className="object-cover"
      />

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-background/70 to-transparent"
      />

      {image.placeholder && process.env.NODE_ENV !== "production" && (
        <span className="pointer-events-none absolute top-container left-container rounded-full bg-black/70 px-2 py-0.5 text-[10px] tracking-normal text-white/70">
          Placeholder
        </span>
      )}
    </section>
  );
}
