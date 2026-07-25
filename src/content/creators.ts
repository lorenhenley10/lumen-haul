import type { Creator } from "./types";
import { still, video } from "./media";

/**
 * PLACEHOLDER CONTENT — invented names, real structure.
 *
 * The /creators page is a hover index: each name reveals its `backdrop` full
 * bleed behind the list. Mixing videos and stills here is deliberate — the
 * backdrop layer must handle both.
 */

function makeCreator(
  slug: string,
  name: string,
  role: string,
  backdropIsVideo: boolean,
  bio: string,
): Creator {
  return {
    slug,
    name,
    role,
    backdrop: backdropIsVideo
      ? video(`${slug}-backdrop`, { alt: `${name} showreel`, duration: 14 })
      : still(`${slug}-backdrop`, { alt: `${name} portrait frame` }),
    portrait: still(`${slug}-portrait`, {
      alt: `${name}`,
      aspect: "1/1",
      width: 400,
      height: 400,
    }),
    bio,
  };
}

export const creators: Creator[] = [
  makeCreator("ada-refn", "Ada Refn", "Director", true, "Long takes, natural light, and a stubborn refusal to cover the scene."),
  makeCreator("malik-sorensen", "Malik Sørensen", "Cinematographer", true, "Shoots on whatever the story needs, which is usually less than the budget allows."),
  makeCreator("ines-moreau", "Ines Moreau", "Director / DOP", false, "Documentary instincts applied to commercial work."),
  makeCreator("tomas-beck", "Tomas Beck", "Director", true, "Comic timing, straight face."),
  makeCreator("priya-raman", "Priya Raman", "Cinematographer", true, "Macro, anamorphic, and an unreasonable number of practical lights."),
  makeCreator("june-okafor", "June Okafor", "Executive Producer", false, "Has never lost a schedule."),
  makeCreator("sasha-lindqvist", "Sasha Lindqvist", "Producer", true, "Runs the kind of set people come back to."),
  makeCreator("nils-haugen", "Nils Haugen", "Editor", true, "Cuts to breath, not to beat."),
  makeCreator("rae-alvarez", "Rae Alvarez", "Movement Director", false, "Choreographs for the lens, not the room."),
];

export function getCreator(slug: string): Creator | undefined {
  return creators.find((c) => c.slug === slug);
}
