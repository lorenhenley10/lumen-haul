import type { Project } from "./types";
import { still, video } from "./media";

/**
 * PLACEHOLDER CONTENT.
 *
 * These projects exist to exercise the layout at realistic lengths — short and
 * long client names, one- and two-line titles, varying credit counts. They are
 * invented for Lumen Haul and must be replaced with the studio's real slate
 * before launch. The SHAPE is what implementation agents should preserve.
 */

function makeProject(
  index: number,
  slug: string,
  client: string,
  title: string,
  summary: string,
  credits: [string, string][],
  featured = false,
  galleryCount = 8,
): Project {
  return {
    slug,
    client,
    title,
    index,
    featured,
    summary,
    film: video(`${slug}-film`, {
      alt: `${client} — ${title}, full film`,
      duration: 30,
    }),
    loop: video(`${slug}-loop`, {
      alt: `${client} — ${title}, silent loop`,
      duration: 12,
    }),
    gallery: Array.from({ length: galleryCount }, (_, i) =>
      still(`${slug}-still-${i + 1}`, {
        alt: `${client} — ${title}, behind the scenes ${i + 1}`,
        aspect: i % 3 === 1 ? "3/4" : "16/9",
      }),
    ),
    credits: credits.map(([role, name]) => ({ role, name })),
    year: 2025 - Math.floor(index / 6),
  };
}

export const projects: Project[] = [
  makeProject(
    1,
    "northwind-first-light",
    "Northwind",
    "First Light",
    "A single unbroken take from dusk to sunrise, shot across three coastlines in one continuous night.",
    [
      ["Director", "Ada Refn"],
      ["DOP", "Malik Sørensen"],
      ["Producer", "June Okafor"],
      ["Colour", "Haul Post"],
    ],
    true,
  ),
  makeProject(
    2,
    "meridian-the-long-way",
    "Meridian",
    "The Long Way",
    "Six drivers, six countries, one road. A film about the distance people will travel to be understood.",
    [
      ["Director", "Ada Refn"],
      ["DOP", "Priya Raman"],
      ["Producer", "June Okafor"],
    ],
    true,
  ),
  makeProject(
    3,
    "atlas-athletic-hold-the-line",
    "Atlas Athletic",
    "Hold the Line",
    "Ninety seconds of held breath. Shot at 1000fps on a practice pitch at four in the morning.",
    [
      ["Director", "Tomas Beck"],
      ["DOP", "Malik Sørensen"],
      ["Producer", "Sasha Lindqvist"],
      ["Sound", "Field Studio"],
    ],
    true,
  ),
  makeProject(
    4,
    "cascade-quiet-machines",
    "Cascade",
    "Quiet Machines",
    "An industrial documentary that refuses to raise its voice, cut in-camera across eleven factory floors.",
    [
      ["Director", "Ines Moreau"],
      ["DOP", "Ines Moreau"],
      ["Producer", "June Okafor"],
    ],
    true,
  ),
  makeProject(
    5,
    "verity-plainly-put",
    "Verity",
    "Plainly Put",
    "A financial brand with nothing to hide, told entirely in single-sentence titles and one long dolly.",
    [
      ["Director", "Tomas Beck"],
      ["DOP", "Priya Raman"],
      ["Producer", "Sasha Lindqvist"],
    ],
    true,
  ),
  makeProject(
    6,
    "solstice-audio-room-tone",
    "Solstice Audio",
    "Room Tone",
    "Sound design first, picture second. The edit was cut to a binaural recording made in an empty hall.",
    [
      ["Director", "Ada Refn"],
      ["DOP", "Malik Sørensen"],
      ["Sound", "Field Studio"],
    ],
    true,
  ),
  makeProject(
    7,
    "harbour-co-the-crossing",
    "Harbour & Co.",
    "The Crossing",
    "Two weeks on a working ferry, filmed with a crew of three and no artificial light.",
    [
      ["Director", "Ines Moreau"],
      ["DOP", "Ines Moreau"],
      ["Producer", "June Okafor"],
    ],
    true,
  ),
  makeProject(
    8,
    "orchard-everything-in-season",
    "Orchard",
    "Everything in Season",
    "A year compressed into ninety seconds, returning to the same tree eleven times.",
    [
      ["Director", "Tomas Beck"],
      ["DOP", "Priya Raman"],
      ["Producer", "Sasha Lindqvist"],
    ],
    true,
  ),
  makeProject(
    9,
    "pallas-institute-open-record",
    "Pallas Institute",
    "Open Record",
    "Archive footage and new photography intercut to the frame, tracing forty years of public research.",
    [
      ["Director", "Ada Refn"],
      ["Editor", "Nils Haugen"],
      ["Producer", "June Okafor"],
    ],
    true,
  ),
  makeProject(
    10,
    "kestrel-no-fixed-address",
    "Kestrel",
    "No Fixed Address",
    "Shot on 16mm across four cities without a permit between them.",
    [
      ["Director", "Ines Moreau"],
      ["DOP", "Malik Sørensen"],
    ],
  ),
  makeProject(
    11,
    "belvedere-the-slow-hour",
    "Belvedere",
    "The Slow Hour",
    "A hospitality film paced to the length of an actual dinner service.",
    [
      ["Director", "Tomas Beck"],
      ["DOP", "Priya Raman"],
    ],
  ),
  makeProject(
    12,
    "ferrous-works-hard-material",
    "Ferrous Works",
    "Hard Material",
    "Macro photography of welds, cooled and reheated, cut as a music piece.",
    [
      ["Director", "Ada Refn"],
      ["DOP", "Ada Refn"],
    ],
  ),
  makeProject(
    13,
    "lumen-haul-house-reel",
    "Lumen Haul",
    "House Reel",
    "Everything above, ninety seconds, no titles.",
    [["Editor", "Nils Haugen"]],
  ),
  makeProject(
    14,
    "vantage-second-position",
    "Vantage",
    "Second Position",
    "A dance film built around a camera that never occupies the best seat.",
    [
      ["Director", "Ines Moreau"],
      ["Choreography", "Rae Alvarez"],
    ],
  ),
  makeProject(
    15,
    "coastal-line-tide-tables",
    "Coastal Line",
    "Tide Tables",
    "Timelapse and live action married on a single locked-off frame over six weeks.",
    [
      ["Director", "Tomas Beck"],
      ["DOP", "Malik Sørensen"],
    ],
  ),
  makeProject(
    16,
    "juniper-small-print",
    "Juniper",
    "Small Print",
    "Comedy in one room, three actors, and a legal disclaimer read aloud in full.",
    [
      ["Director", "Ada Refn"],
      ["Producer", "Sasha Lindqvist"],
    ],
  ),
  makeProject(
    17,
    "north-star-radio-night-shift",
    "North Star Radio",
    "Night Shift",
    "Portraits of the people awake at 3am, lit only by what was already there.",
    [
      ["Director", "Ines Moreau"],
      ["DOP", "Priya Raman"],
    ],
  ),
  makeProject(
    18,
    "granta-field-notes",
    "Granta",
    "Field Notes",
    "A publishing campaign shot as if it were a nature documentary.",
    [
      ["Director", "Tomas Beck"],
      ["Editor", "Nils Haugen"],
    ],
  ),
];

/** Home reel order — the featured subset, in index order. */
export const featuredProjects = projects.filter((p) => p.featured);

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Next project, wrapping — powers the "next story" link on project pages. */
export function getNextProject(slug: string): Project {
  const i = projects.findIndex((p) => p.slug === slug);
  return projects[(i + 1) % projects.length];
}
