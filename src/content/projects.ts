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
  /**
   * Folder the behind-the-scenes stills were encoded into. Defaults to `slug`.
   *
   * Needed once a story's URL stops matching its folders: encode-stills.sh
   * writes to a media folder, so renaming a slug would otherwise empty the
   * gallery silently — the page still builds, there is just nothing in it.
   */
  stills?: string;
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
    // The Salt Lake City photographs, shared with /stills/formula-drift.
    stills: "stills-fd-slc",
    summary:
      "The full Salt Lake City round, in-car and aerial, from morning practice through the last smoke-filled battle at night.",
    filmDuration: 890,
    year: 2022,
  },
  {
    // Named for the client, not a film: the story holds three, and a URL naming
    // one of them goes stale the moment the lead changes — which it has now
    // done twice. /stories/blazar-mantis-135 redirects here (see next.config.ts).
    slug: "blazar",
    client: "Blazar",
    title: "Ronin 4D + MANTIS 1.33X, Real-World Test",
    media: "blazar-mantis-133x",
    // Shares the MANTIS gallery with /stills/blazar. It used to borrow the
    // APEX-L set because there were no MANTIS stills; there are now, and they
    // are the same lenses these films are about.
    stills: "stills-blazar-mantis",
    summary:
      "The 1.33x set on a Ronin 4D across a full music video shoot — haze, hard colour and constant handheld movement, which is a harder test of a lens than any chart.",
    filmDuration: 277,
    moreFilms: [
      {
        media: "blazar-mantis-25-100",
        title: "MANTIS 25 & 100mm, Classic Car Show",
        summary:
          "A night shoot at a classic car show, cut to show the 25mm and 100mm wide open — string-light bokeh, headlight flare, and how the set holds skin at close focus.",
        duration: 55,
      },
      {
        media: "blazar-mantis-135",
        title: "MANTIS 135mm T3.2 First Look",
        summary:
          "The long end on its own, shot wide open on location — flare behaviour and focus falloff at 135mm.",
        duration: 290,
      },
      {
        media: "blazar-mantis-5-lens",
        title: "MANTIS 25 & 100mm, Full Five-Lens Comparison",
        summary:
          "The set measured against itself: the same setups walked through all five focal lengths, with the focal length and stop on screen throughout.",
        duration: 317,
      },
    ],
    year: 2025,
  },
  {
    slug: "shoreline-f150-raptor",
    client: "Shoreline Motoring",
    title: "Ford F-150 Raptor R",
    // One shoot, one encode: /stills/shoreline-motoring shows the same frames.
    stills: "stills-shoreline-f150",
    summary:
      "A build film for a custom Raptor R, shot to sit alongside the studio's stills work for the same client.",
    filmDuration: 76,
    moreFilms: [
      {
        media: "shoreline-amg-gt",
        title: "Mercedes-AMG GT S, BD-F25",
        summary:
          "The same treatment on a brushed-black AMG GT S — shot tight on the fitment, then let out to the whole car.",
        duration: 77,
      },
    ],
    year: 2024,
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
    moreFilms: [
      {
        media: "hotpit-irw-r1",
        title: "Irwindale, Round One",
        summary:
          "The whole of round one at Irwindale, over fifteen minutes of it — every run rather than the highlights, which is what the showcase was cut down from.",
        duration: 931,
      },
    ],
    year: 2023,
  },
  {
    slug: "blaque-diamond-model-s",
    client: "Blaque Diamond Wheels",
    title: "Tesla Model S Plaid",
    summary:
      "Product film for a wheel fitment on a Model S Plaid, shot ultrawide to keep the full stance of the car in frame.",
    filmDuration: 70,
    // The client is four fitments, not one, and /stills/blaque-diamond has
    // always shown them that way. These are the films that go with them.
    moreFilms: [
      {
        media: "blaque-diamond-raptor",
        title: "Ford F-150 Raptor, BD-O728",
        summary:
          "The truck taken out to open desert rather than shot in a bay — a textured black wheel against dust and low sun.",
        duration: 60,
      },
      {
        media: "blaque-diamond-model-3",
        title: "Tesla Model 3, BD-F29",
        summary:
          "A brushed silver fitment on a Model 3, shot in a garage where the light could be kept hard and directional.",
        duration: 55,
      },
      {
        media: "blaque-diamond-q50",
        title: "Infiniti Q50, BD-F25",
        summary:
          "The Q50 against glass and concrete, cut to hold the whole stance of the car in ultrawide before moving in on the wheel.",
        duration: 76,
      },
    ],
    year: 2023,
  },
  {
    /*
     * JOBY was on the site as photographs only — /stills/joby has carried the
     * Joshua Tree and mounted-product sets since launch — while the films from
     * the same shoot were in the masters and nowhere else. This is the story
     * they belong to, and it shares that shoot's gallery rather than starting a
     * second copy of it.
     *
     * It is the shortest piece on the slate by a distance: nine seconds, cut
     * for a product page rather than a screen. The Telepod cut that goes with
     * it is vertical and is waiting on a 9:16 format (see encode-media.sh).
     */
    slug: "joby",
    client: "JOBY",
    title: "Website Reel, Two Products",
    media: "joby-website-reel",
    stills: "stills-joby-joshua-tree",
    summary:
      "A short product reel cut for the JOBY site — two mounts, shown in use rather than on a plinth.",
    filmDuration: 9,
    year: 2024,
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
    // A story has one behind-the-scenes set regardless of how many films sit in
    // it, so this is a single folder — but not necessarily the slug's, once a
    // story's URL and its folders have diverged.
    gallery: derivedStills(seed.stills ?? seed.slug, label),
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
