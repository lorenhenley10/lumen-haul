import type { PlayableFilm, Project, StoryFilm } from "./types";
import { derivedFilm, derivedLoop, derivedStills } from "./media";

/**
 * The slate.
 *
 * Every project here is backed by REAL media transcoded from the camera
 * masters (see media.ts and scripts/encode-media.sh). One folder under
 * public/media/ = one project.
 *
 * ORDER IS INTENTIONAL. `index` and array position drive both the /stories
 * grid and the home reel — including the reel's numbered rail — so reordering
 * this array reorders the site and renumbers it to match. Nothing else needs
 * touching. The opening four were specified directly; 5-10 are sequenced for
 * visual rhythm, closing on the vertical product piece as a deliberate format
 * change.
 *
 * The home hero's background film is chosen separately, in media.ts, and is
 * currently the Shoreline Raptor. A project appearing both there and in the
 * reel is expected.
 *
 * TITLES AND SUMMARIES ARE EDITORIAL PLACEHOLDERS derived from the filenames.
 * They read correctly but were not supplied by the studio — adjust freely.
 * CREDITS are mostly empty because the real ones are unknown; the project page
 * hides the section when there are none.
 */

/**
 * One more film in the same story, rendered below the hero in this order.
 *
 * `media` is a folder under public/media/derived — NOT a project slug. A story
 * with several films has several media folders and one URL, so the two stopped
 * being the same thing the moment stories could hold more than one film.
 */
interface StoryFilmSeed {
  media: string;
  title: string;
  summary?: string;
  /** Duration of the full film in seconds, measured from the encode. */
  duration: number;
  vertical?: boolean;
}

interface ProjectSeed {
  slug: string;
  client: string;
  title: string;
  summary: string;
  /**
   * Media folder for the HERO film. Defaults to `slug`, which is right for
   * every single-film story. Set it when the lead film is not the one the URL
   * is named after.
   */
  media?: string;
  /** Duration of the full film in seconds, measured from the encode. */
  filmDuration: number;
  /** True for the two vertically-shot pieces. */
  vertical?: boolean;
  /** Further films in this story, in page order below the hero. */
  moreFilms?: StoryFilmSeed[];
  credits?: [string, string][];
  year: number;
}

const seeds: ProjectSeed[] = [
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
    slug: "blazar-mantis-135",
    client: "Blazar",
    title: "MANTIS 135mm First Look",
    summary:
      "A first look at the MANTIS 135mm T3.2 anamorphic, shot to show the lens doing what the spec sheet cannot: flare behaviour, focus falloff, and how it renders skin at close range.",
    filmDuration: 290,
    /*
     * The 25/100 set test sits BELOW the 135, not above it, which is the
     * reverse of what was asked — see the note in AGENTS-facing terms:
     *
     * The film requested for the lead slot ("MANTIS 25mm & 100mm Lens Test |
     * Classic Car Show") is not in public/media/Blazar/. The only 25/100 master
     * on disk is this one, a different edit: a studio set test with burned-in
     * focal-length and T-stop labels on nearly every frame, title cards, and
     * chart sequences. Leading with it would put those labels full-screen on the
     * home reel in place of a dynamic cut.
     *
     * Drop the car-show master in, add it to encode-media.sh, then set
     * `media:` on this seed to its folder and move the 135 into moreFilms.
     */
    moreFilms: [
      {
        media: "blazar-mantis-25-100",
        title: "MANTIS 25mm & 100mm Lens Test",
        summary:
          "The wider end of the set — flare, distortion and focus falloff at 25mm and 100mm, alongside the full five-lens comparison.",
        duration: 318,
      },
    ],
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
      "Shot handheld through a derelict, graffiti-covered building — close to the subject, kinetic, and cut to keep the location moving past the camera.",
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
  // Media folder for the hero. Same as the slug unless the story leads with a
  // film the URL is not named after.
  const heroMedia = seed.media ?? seed.slug;

  const moreFilms: StoryFilm[] = (seed.moreFilms ?? []).map((extra) => {
    const extraLabel = `${seed.client} — ${extra.title}`;
    const extraAspect = extra.vertical ? ("9/16" as const) : ("16/9" as const);
    return {
      id: extra.media,
      title: extra.title,
      summary: extra.summary,
      film: derivedFilm(extra.media, {
        alt: `${extraLabel}, full film`,
        aspect: extraAspect,
        duration: extra.duration,
      }),
      loop: derivedLoop(extra.media, {
        alt: `${extraLabel}, silent loop`,
        aspect: extraAspect,
      }),
    };
  });

  return {
    slug: seed.slug,
    client: seed.client,
    title: seed.title,
    index: i + 1,
    // Every project appears in the home reel; the slate is small enough that
    // holding work back from it would just make the reel feel thin.
    featured: true,
    summary: seed.summary,
    film: derivedFilm(heroMedia, {
      alt: `${label}, full film`,
      aspect,
      duration: seed.filmDuration,
    }),
    loop: derivedLoop(heroMedia, { alt: `${label}, silent loop`, aspect }),
    // Stills stay keyed to the SLUG, not the hero media folder: a story has one
    // behind-the-scenes set regardless of how many films sit in it.
    gallery: derivedStills(seed.slug, label),
    credits: (seed.credits ?? []).map(([role, name]) => ({ role, name })),
    moreFilms,
    year: seed.year,
  };
});

/** Home reel order — the featured subset, in slate order. */
export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/**
 * A story's hero film, in the shape the fullscreen player takes.
 *
 * Lives here so the "Client — Title" label is built once. Every surface that
 * opens the hero (the story card, the project page) shows the same string, and
 * the additional films below the hero build their labels the same way.
 */
export function heroFilmOf(project: Project): PlayableFilm {
  return {
    id: project.slug,
    title: `${project.client} — ${project.title}`,
    asset: project.film,
  };
}

/** Next project, wrapping — powers the "next story" link on project pages. */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
