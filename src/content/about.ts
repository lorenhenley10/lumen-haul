import type { Service } from "./types";

/**
 * /about copy.
 *
 * This replaced a placeholder studio page written for a large team — a contact
 * directory of eight departments with invented names, an address, a partners
 * network, a service production arm and a page of crew commitments. None of it
 * was true.
 *
 * THE CORRECTION THAT MATTERS, because the first rewrite got it wrong in the
 * other direction: this is not a solo-only operation. It is owner-led, and it
 * scales — single-operator where that serves the work, a full crew off a
 * standing roster where it does not. Copy here must not imply that one man
 * band is the ceiling; it is one end of a range.
 *
 * The other correction: the work is not "automotive" flatly. It is branded
 * automotive work, plus commercials for startups and established brands.
 *
 * Keep it honest in both directions. Do not inflate into a "we" that implies
 * permanent staff, and do not claim years or awards that have not been counted
 * — but do not undersell the range either.
 */

/**
 * The opening statement, set in display type.
 *
 * The original was tuned to fill eight lines at 1440x900 to match a reference
 * layout. This one is sized by what is true rather than to a line count, so
 * expect a shorter block than the old page had.
 */
export const aboutStatement =
  "Lumen Haul is a film and photography studio that scales to the job — a one man band automotive shoot, or a fully crewed commercial for a product rollout. I direct and shoot, and bring in a roster of crew I trust when the work calls for it. Branded automotive films, and commercials for startups and established brands.";

export const services: Service[] = [
  {
    title: "Video production",
    body: "Directing and cinematography, crewed to the brief. Single-operator where that serves the work, and a full unit — camera, lighting, grip, sound — where it does not. The same eye is on it either way.",
  },
  {
    title: "Commercials",
    body: "Product rollouts, launches and announcements for startups and established brands, from the first conversation about an idea through to final delivery.",
  },
  {
    title: "Automotive and motorsport",
    body: "Branded work for marques, builders and aftermarket brands, plus event and race coverage — the thread running through most of the slate.",
  },
  {
    title: "Editing and post",
    body: "Offline edit, colour, sound and delivery. I cut most of what I shoot, which usually shows up as fewer compromises between what was planned and what turned out to be possible on the day.",
  },
  {
    title: "Photography",
    body: "Stills shot alongside the motion work or on their own — vehicle, product and event coverage, finished to sit with the films rather than beside them.",
  },
];

/**
 * The only contact details on the site.
 *
 * `href` is stored next to the display string rather than derived, because the
 * two genuinely differ: a `tel:` link needs E.164 (+1, no punctuation) while
 * the visible number is grouped for reading.
 */
export const contact = {
  phone: "(970) 689-9617",
  phoneHref: "tel:+19706899617",
  email: "lorenhenley10@gmail.com",
} as const;
