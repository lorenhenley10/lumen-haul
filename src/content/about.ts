import type { Service } from "./types";

/**
 * /about copy.
 *
 * This replaced a placeholder studio page written for a large team — a contact
 * directory of eight departments, an address, a partners network, a service
 * production arm and a page of crew commitments. None of it was true. Lumen
 * Haul is one person, so the page is now one statement, what that person does,
 * and how to reach them.
 *
 * Keep it that way. The temptation with an about page is to inflate: to write
 * "we" for one person, to claim years or awards that have not been counted, to
 * describe a network that is really a phone contact. Everything here is either
 * verifiable from the work on the site or plainly true.
 */

/**
 * The opening statement, set in display type.
 *
 * The previous statement was tuned to fill eight lines at 1440x900, because it
 * was matched to a reference layout. This one is deliberately shorter — the
 * honest version of this page is not eight lines long, and padding it back out
 * would mean inventing something. Expect a shorter block than the old page had.
 */
export const aboutStatement =
  "Lumen Haul is a one-person studio. I direct, shoot and cut the work myself, so the person you brief is the person behind the camera and the person in the edit. Mostly automotive, motorsport and product films, with the stills to match.";

export const services: Service[] = [
  {
    title: "Video production",
    body: "Directing and cinematography, from the first conversation about an idea through to the shoot itself. Single-operator where the job suits it, with a crew brought in where it does not.",
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
