import type { ImageAsset, StillsProject } from "./types";
import { derivedStills, still } from "./media";

/**
 * The photography slate.
 *
 * ORDER IS INTENTIONAL — array position is the order on /stills and the order
 * "next set" walks. Nothing else needs touching to reorder the section.
 *
 * ## Which sets have real photographs and which do not
 *
 * Four sets are backed by REAL frames already encoded into
 * public/media/derived/<folder>/stills/ by scripts/encode-stills.sh. The other
 * four carry PLACEHOLDER frames: `still()` with no `src` returns the stand-in
 * SVG with `placeholder: true`, which renders a dev-only badge so a stand-in
 * cannot quietly ship. The layout is built against a mix on purpose — real
 * frames prove the grid holds mixed orientations, placeholders prove it holds
 * a set that has not been shot yet.
 *
 * ## Adding the real photography
 *
 * 1. Add a `<slug>|<folder under public/media>` line to scripts/encode-stills.sh
 *    and run it. It writes the frames and regenerates stills.generated.ts with
 *    their real pixel dimensions.
 * 2. Set `media` here to that folder and delete `placeholderFrames`.
 * 3. Run ./scripts/sync-r2.sh.
 *
 * No component changes. Dimensions come from the generated manifest, so a set
 * of portrait frames sizes itself correctly the moment it lands.
 *
 * ## Copy
 *
 * TITLES AND DESCRIPTIONS ARE EDITORIAL PLACEHOLDERS, written from what the
 * work is rather than supplied by the studio — same convention as projects.ts.
 * Client names are the confirmed list in about.ts and are NOT placeholder.
 */
interface StillsSeed {
  slug: string;
  client: string;
  title: string;
  description: string;
  year: number;
  /**
   * Folder under public/media/derived holding this set's frames. It is a MEDIA
   * folder, not a slug: the Shoreline photographs were encoded alongside the
   * film of the same shoot and stay in that folder, so the two names diverge.
   */
  media?: string;
  /** Stand-in frames to render until the real set is encoded. */
  placeholderFrames?: number;
}

const seeds: StillsSeed[] = [
  {
    slug: "shoreline-raptor-r",
    client: "Shoreline Motoring",
    title: "Ford F-150 Raptor R",
    description:
      "The stills half of the Raptor R build, shot on the same day as the film — the truck static and lit, rather than moving.",
    year: 2024,
    media: "shoreline-f150-raptor",
  },
  {
    slug: "blaque-diamond-model-s",
    client: "Blaque Diamond Wheels",
    title: "Model S Plaid, BD-F29",
    description:
      "A fitment set shot for the wheel rather than the car: low, close, and framed to keep the full face of the BD-F29 in every frame.",
    year: 2023,
    media: "blaque-diamond-model-s",
  },
  {
    slug: "blazar-apex-l",
    client: "Blazar",
    title: "APEX-L, Lifestyle",
    description:
      "Product photography for the APEX-L primes, shot in use rather than on a table — the lens on a rig, in a room, with someone behind it.",
    year: 2025,
    media: "blazar-mantis-135",
  },
  {
    slug: "fd-slc-2022",
    client: "Formula Drift",
    title: "Buy Now Japan, Salt Lake City",
    description:
      "A full round covered on stills as well as film: paddock, grid and the last battles of the night, shot wide open under the lights.",
    year: 2022,
    media: "fd-2022-buy-now-japan",
  },
  {
    slug: "watanabe-wheels",
    client: "Watanabe Wheels",
    title: "Catalogue Set",
    description:
      "Studio and street frames for a catalogue refresh, shot to one lighting setup so the whole range reads as one set.",
    year: 2025,
    placeholderFrames: 8,
  },
  {
    slug: "1886-wheels",
    client: "1886 Wheels",
    title: "Forged Programme",
    description:
      "Close work on finish and machining — the detail a catalogue photograph has to carry when the buyer cannot hold the wheel.",
    year: 2025,
    placeholderFrames: 6,
  },
  {
    slug: "hotpit-autofest",
    client: "Hotpit Autofest",
    title: "Event Coverage",
    description:
      "A weekend shot as it happened: cars, crews and the crowd, delivered same-day for the event's own channels.",
    year: 2023,
    placeholderFrames: 10,
  },
  {
    slug: "eufymake-product",
    client: "eufy Make",
    title: "Product Set",
    description:
      "Controlled product photography on seamless, cut to a shot list rather than a shoot day — every angle the listing needs.",
    year: 2025,
    placeholderFrames: 6,
  },
];

/** Stand-in frames for a set that has not been shot or encoded yet. */
function placeholderStills(slug: string, altPrefix: string, count: number) {
  return Array.from({ length: count }, (_, i) =>
    still(`${slug}-still-${i + 1}`, {
      alt: `${altPrefix} — frame ${i + 1}`,
      // Portrait every third frame. A gallery of identical landscape boxes
      // would hide the one thing worth testing before the real set arrives:
      // that mixed orientations sit in the grid without breaking the rhythm.
      aspect: i % 3 === 2 ? "3/4" : "16/9",
      width: i % 3 === 2 ? 1200 : 1600,
      height: i % 3 === 2 ? 1600 : 1066,
    }),
  );
}

export const stillsProjects: StillsProject[] = seeds.map((seed) => {
  const label = `${seed.client} — ${seed.title}`;
  const images: ImageAsset[] = seed.media
    ? derivedStills(seed.media, label)
    : placeholderStills(seed.slug, label, seed.placeholderFrames ?? 6);

  return {
    slug: seed.slug,
    client: seed.client,
    title: seed.title,
    description: seed.description,
    year: seed.year,
    // The first frame is the set's face. A real set opens on its strongest
    // photograph because encode-stills.sh samples in shoot order and the
    // selects lead; when a set is empty, the stand-in keeps the tile boxed at
    // the right size rather than collapsing the grid row.
    hero:
      images[0] ??
      still(`${seed.slug}-hero`, { alt: label, aspect: "3/4", width: 1200, height: 1600 }),
    images,
  };
});

export function getStillsProject(slug: string): StillsProject | undefined {
  return stillsProjects.find((project) => project.slug === slug);
}

/** Next set, wrapping — powers the "next set" link at the foot of a set page. */
export function getNextStillsProject(slug: string): StillsProject {
  const i = stillsProjects.findIndex((project) => project.slug === slug);
  return stillsProjects[(i + 1) % stillsProjects.length];
}
