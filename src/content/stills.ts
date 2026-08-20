import type { ImageAsset, StillsGallery, StillsProject } from "./types";
import { derivedStills } from "./media";

/**
 * The photography slate.
 *
 * ORDER IS INTENTIONAL — array position is the order on /stills and the order
 * "next set" walks. Nothing else needs touching to reorder the section.
 *
 * ## Every frame here is real
 *
 * The four stand-in sets this replaced are gone. The studio reorganised the
 * masters into public/media/Stills/ and public/media/Stories/, and the Stills
 * tree carries the structure this file describes: a folder per client, and
 * inside it a folder per body of work.
 *
 * ## Projects hold GALLERIES, not one flat list
 *
 * Most clients here are not one shoot. Shoreline Motoring is three cars,
 * Blaque Diamond four fitments, Blazar four lens lines. Each is a sheet of its
 * own on the client's page, under one banner — a single sheet mixing an AMG GT
 * with an F-150 reads as a folder rather than as a portfolio.
 *
 * ## Adding or changing a set
 *
 * 1. Put the photographs under public/media/Stills/<Client>/<Body of work>/.
 * 2. Add a `<stills-slug>|<folder>` line to scripts/encode-stills.sh and run
 *    it. It writes the frames, hashes their names and regenerates
 *    stills.generated.ts with real pixel dimensions.
 * 3. Add the folder to a project's `galleries` here.
 * 4. Run ./scripts/sync-r2.sh.
 *
 * No component changes at any point. Dimensions come from the generated
 * manifest, so a gallery of portrait frames sizes itself the moment it lands.
 *
 * ## Copy
 *
 * TITLES AND DESCRIPTIONS ARE EDITORIAL, written from what is actually in the
 * frames rather than supplied by the studio — same convention as projects.ts.
 * Client names and the vehicles and products named in gallery titles come from
 * the folders and filenames, so those are the studio's own.
 */
interface GallerySeed {
  /**
   * Folder under public/media/derived. A MEDIA folder, not a slug: these carry
   * a `stills-` prefix because they share the derived/ namespace with the story
   * slugs, and without it the Hotpit gallery and the Hotpit film would collide.
   */
  media: string;
  /** Shown above the sheet. Omit on a single-gallery project. */
  title?: string;
}

interface StillsSeed {
  slug: string;
  client: string;
  title: string;
  description: string;
  year: number;
  galleries: GallerySeed[];
}

const seeds: StillsSeed[] = [
  {
    slug: "shoreline-motoring",
    client: "Shoreline Motoring",
    title: "Builds",
    description:
      "Three builds for the same shop, each shot on delivery: static, lit, and framed to sell the stance rather than the spec sheet.",
    year: 2024,
    galleries: [
      { media: "stills-shoreline-f150", title: "Ford F-150 Raptor R" },
      { media: "stills-shoreline-amg-gt", title: "Mercedes-AMG GT" },
      { media: "stills-shoreline-rs6", title: "Audi RS6 Avant, 1886 Wheels" },
    ],
  },
  {
    slug: "blaque-diamond",
    client: "Blaque Diamond Wheels",
    title: "Fitments",
    description:
      "Catalogue photography shot for the wheel rather than the car — low, close, and framed to keep the full face of the fitment in every frame.",
    year: 2023,
    galleries: [
      { media: "stills-blaque-diamond-model-3", title: "Tesla Model 3, BD-F29" },
      { media: "stills-blaque-diamond-raptor", title: "Ford F-150 Raptor, BD-O728" },
      { media: "stills-blaque-diamond-q50", title: "Infiniti Q50, BD-F25" },
      { media: "stills-blaque-diamond-a5", title: "Audi A5, BD-F25" },
    ],
  },
  {
    slug: "joby",
    client: "JOBY",
    title: "Product and Lifestyle",
    description:
      "Mounts and grips photographed in use rather than on seamless — clamped to a railing, carried into the desert, held by someone actually shooting with them.",
    year: 2024,
    galleries: [
      { media: "stills-joby-lifestyle", title: "Mounted Product" },
      { media: "stills-joby-joshua-tree", title: "Joshua Tree" },
    ],
  },
  {
    slug: "blazar",
    client: "Blazar",
    title: "Lens Lines",
    description:
      "Four lens lines shot the same way: on a rig, in a room, with someone behind the camera. Product photography that shows the glass working.",
    year: 2025,
    galleries: [
      { media: "stills-blazar-mantis", title: "MANTIS" },
      { media: "stills-blazar-apex-l", title: "APEX-L" },
      { media: "stills-blazar-beetle", title: "BEETLE" },
      { media: "stills-blazar-remus-m", title: "REMUS-M" },
    ],
  },
  {
    slug: "formula-drift",
    client: "Formula Drift",
    title: "Buy Now Japan",
    description:
      "Two rounds covered on stills for the same team — on track and in the paddock, shot wide open through the smoke.",
    year: 2022,
    galleries: [
      { media: "stills-fd-slc", title: "Salt Lake City" },
      // The filenames say so: FDIRWBNJ — Irwindale, Buy Now Japan.
      { media: "stills-fd-buy-now-japan", title: "Irwindale" },
    ],
  },
  {
    slug: "hotpit-autofest",
    client: "Hotpit Autofest",
    title: "Top 40",
    description:
      "A weekend of competition cut to forty frames — runs, smoke and the crowd, delivered for the event's own channels.",
    year: 2023,
    galleries: [{ media: "stills-hotpit-autofest" }],
  },
  {
    slug: "cf-moto",
    client: "CF Moto",
    title: "Canyon Ride",
    description:
      "A sportbike shot moving on canyon roads, panned at speed through the corners and out into the light.",
    year: 2024,
    galleries: [{ media: "stills-cf-moto" }],
  },
];

export const stillsProjects: StillsProject[] = seeds.map((seed) => {
  const label = `${seed.client} — ${seed.title}`;

  const galleries: StillsGallery[] = seed.galleries.map((gallery) => ({
    id: gallery.media,
    title: gallery.title,
    images: derivedStills(
      gallery.media,
      gallery.title ? `${label}, ${gallery.title}` : label,
    ),
  }));

  const first: ImageAsset | undefined = galleries[0]?.images[0];
  if (!first) {
    // Every gallery here is backed by encoded frames. An empty one means a
    // folder was renamed without re-running encode-stills.sh, and failing
    // loudly at build beats shipping a page with an empty banner.
    throw new Error(
      `Stills project "${seed.slug}" has no frames. Check the media folders in scripts/encode-stills.sh.`,
    );
  }

  return {
    slug: seed.slug,
    client: seed.client,
    title: seed.title,
    description: seed.description,
    year: seed.year,
    // The face of the set is the first frame of the first gallery, which is
    // why gallery order is worth thinking about: it picks the banner too.
    hero: first,
    galleries,
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
