import type { Project } from "./types";
import { derivedFilm, derivedLoop, derivedStills } from "./media";

/**
 * The slate.
 *
 * Every project here is backed by REAL media transcoded from the camera
 * masters (see media.ts and scripts/encode-media.sh). One folder under
 * public/media/ = one project.
 *
 * ORDER IS INTENTIONAL. `index` and array position drive both the /stories
 * grid and the home reel, so reordering this array reorders the site. The
 * first five positions were specified directly; 6-10 are sequenced for visual
 * rhythm — cinematic, then motorsport, then automotive, then documentary,
 * closing on the vertical product piece as a deliberate format change.
 *
 * TITLES AND SUMMARIES ARE EDITORIAL PLACEHOLDERS derived from the filenames.
 * They read correctly but were not supplied by the studio — adjust freely.
 * CREDITS are mostly empty because the real ones are unknown; the project page
 * hides the section when there are none.
 */

interface ProjectSeed {
  slug: string;
  client: string;
  title: string;
  summary: string;
  /** Duration of the full film in seconds, measured from the encode. */
  filmDuration: number;
  /** True for the two vertically-shot pieces. */
  vertical?: boolean;
  credits?: [string, string][];
  year: number;
}

const seeds: ProjectSeed[] = [
  {
    slug: "blazar-mantis-135",
    client: "Blazar",
    title: "MANTIS 135mm First Look",
    summary:
      "A first look at the MANTIS 135mm T3.2 anamorphic, shot to show the lens doing what the spec sheet cannot: flare behaviour, focus falloff, and how it renders skin at close range.",
    filmDuration: 290,
    year: 2025,
  },
  {
    slug: "nozomio-folk-doordash",
    client: "Nozomio",
    title: "Folk × DoorDash Giveaway",
    summary:
      "A short promo cut for a credit giveaway campaign — fast, bright, and built to hold attention in a feed rather than a cinema.",
    filmDuration: 34,
    year: 2025,
  },
  {
    slug: "fd-2022-buy-now-japan",
    client: "Formula Drift",
    title: "Buy Now Japan, Salt Lake City",
    summary:
      "The full Salt Lake City round, in-car and aerial, from morning practice through the last smoke-filled battle at night.",
    filmDuration: 890,
    year: 2022,
  },
  {
    slug: "shoreline-f150-raptor",
    client: "Shoreline Motoring",
    title: "Ford F-150 Raptor R",
    summary:
      "A build film for a custom Raptor R, shot to sit alongside the studio's stills work for the same client.",
    filmDuration: 76,
    year: 2024,
  },
  {
    slug: "88-silo",
    client: "88",
    title: "Silo",
    summary:
      "The finished piece — shot wide, graded cool, and cut long enough to let the location do the work.",
    filmDuration: 88,
    year: 2024,
  },
  {
    slug: "los-lamentos",
    client: "Los Lamentos",
    title: "Promo Film",
    summary:
      "A near-three-minute promo shot on location, paced deliberately slowly against the usual conventions of the format.",
    filmDuration: 174,
    year: 2024,
  },
  {
    slug: "hotpit-autofest",
    client: "Hotpit Autofest",
    title: "Elliot Bright Driver Showcase",
    summary:
      "A driver showcase built around one competitor across a full event weekend, cut to the rhythm of the runs rather than a music bed.",
    filmDuration: 143,
    year: 2023,
  },
  {
    slug: "blaque-diamond-model-s",
    client: "Blaque Diamond Wheels",
    title: "Tesla Model S Plaid",
    summary:
      "Product film for a wheel fitment on a Model S Plaid, shot ultrawide to keep the full stance of the car in frame.",
    filmDuration: 70,
    year: 2023,
  },
  {
    slug: "born-to-ride",
    client: "Born to Ride",
    title: "Short Film",
    summary:
      "A short documentary piece shot at 2:1, following its subject without narration.",
    filmDuration: 83,
    credits: [
      ["Director", "Loren Henley"],
      ["Director", "Gabriel Bendana"],
    ],
    year: 2023,
  },
  {
    slug: "joby-joshua-tree",
    client: "JOBY",
    title: "Telepod, Joshua Tree",
    summary:
      "Product content shot on location in Joshua Tree, cut vertical for mobile placement alongside a full product stills set.",
    filmDuration: 23,
    vertical: true,
    year: 2023,
  },
];

export const projects: Project[] = seeds.map((seed, i) => {
  const label = `${seed.client} — ${seed.title}`;
  const aspect = seed.vertical ? ("9/16" as const) : ("16/9" as const);

  return {
    slug: seed.slug,
    client: seed.client,
    title: seed.title,
    index: i + 1,
    // Every project appears in the home reel; the slate is small enough that
    // holding work back from it would just make the reel feel thin.
    featured: true,
    summary: seed.summary,
    film: derivedFilm(seed.slug, {
      alt: `${label}, full film`,
      aspect,
      duration: seed.filmDuration,
    }),
    loop: derivedLoop(seed.slug, { alt: `${label}, silent loop`, aspect }),
    gallery: derivedStills(seed.slug, label),
    credits: (seed.credits ?? []).map(([role, name]) => ({ role, name })),
    year: seed.year,
  };
});

/** Home reel order — the featured subset, in slate order. */
export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Next project, wrapping — powers the "next story" link on project pages. */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
