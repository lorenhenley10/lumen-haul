"use client";

import Image from "next/image";
import { useState } from "react";
import { MediaFrame } from "@/components/media/media-frame";
import { ImageLightbox } from "@/components/media/image-lightbox";
import type { ImageAsset } from "@/content/types";

interface StillsGalleryProps {
  images: ImageAsset[];
  /** Set name, passed through to the viewer's corner label. */
  label: string;
}

/**
 * The contact sheet on a set's page.
 *
 * Denser than the index by design: six across on a desktop against the index's
 * four, and an 8px gutter against its 16px. The index is a considered choice
 * between eight bodies of work; this is one body of work, and it should read
 * as a sheet of frames rather than eight more decisions.
 *
 * Six across only above `lg`. Six thumbnails on a phone would be 55px wide —
 * the grid steps 2 → 3 → 6 so a frame is never smaller than a thumbnail needs
 * to be to be worth tapping.
 *
 * Thumbnails are uniformly boxed at 3/2, matching the index and the ratio the
 * frames are encoded at. A landscape frame therefore fills its box untouched;
 * only the portrait ones in a mixed set are cropped, which is what makes the
 * sheet read as one grid. The viewer shows every frame whole, at its own ratio,
 * so nothing is actually lost.
 */
export function StillsGallery({ images, label }: StillsGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {images.map((image, i) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`Open ${image.alt}`}
              className="group/frame block w-full cursor-zoom-in"
            >
              <MediaFrame
                aspect="3/2"
                rounded
                placeholder={image.placeholder}
                className="transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover/frame:scale-[1.02]"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                  // The optimiser refuses SVG, and a stand-in frame is one.
                  unoptimized={image.placeholder}
                  className="object-cover brightness-[0.85] transition-[scale,filter] duration-[var(--duration-slow)] ease-[var(--ease-out-expo)] group-hover/frame:scale-[1.05] group-hover/frame:brightness-100"
                />
              </MediaFrame>
            </button>
          </li>
        ))}
      </ul>

      <ImageLightbox
        images={images}
        index={openIndex}
        label={label}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
