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
 *
 * ON TONE: this page is read by people deciding whether to hire the studio, so
 * it is written to sound assured rather than eager. Two rules that follow from
 * that, both learned by getting them wrong first:
 *
 *   - Never name the small end of the range as an identity. "One man band" was
 *     accurate and still cost the page its footing: it describes a limit where
 *     the truth is a capability. Say what the studio can field, not what it can
 *     shrink to.
 *   - State, do not justify. Earlier drafts explained why the arrangement works
 *     ("which usually shows up as fewer compromises..."). Confidence is the
 *     absence of that argument. Say the thing and stop.
 */

/**
 * The opening statement, set in display type.
 *
 * The original was tuned to fill eight lines at 1440x900 to match a reference
 * layout. This one is sized by what is true rather than to a line count, so
 * expect a shorter block than the old page had.
 */
export const aboutStatement =
  "Lumen Haul is a film and photography studio working in automotive, motorsport and brand. I direct and shoot every project, and build the crew around it — a lean unit where that serves the work, a full commercial team where it does not. Brief, shoot and edit stay in the same hands.";

export const services: Service[] = [
  {
    title: "Direction and cinematography",
    body: "Every project directed and shot in-house. A lean unit where that serves the work; camera, lighting, grip and sound where it does not.",
  },
  {
    title: "Commercials and brand films",
    body: "Launches, product rollouts and announcements for startups and established names, from the first conversation through to final delivery.",
  },
  {
    title: "Automotive and motorsport",
    body: "Branded work for marques, builders and aftermarket brands, alongside race and event coverage.",
  },
  {
    title: "Post production",
    body: "Offline, colour, sound and finishing. Cut by the person who shot it, so the film delivered is the film that was planned.",
  },
  {
    title: "Photography",
    body: "Stills shot alongside the film or commissioned on their own — vehicle, product and event.",
  },
];

/**
 * Clients, confirmed by the studio.
 *
 * DELIBERATELY NOT DERIVED from projects.ts, even though it would stay in sync
 * for free. Not every piece on the slate is a commission — Born to Ride is
 * directed work and Los Lamentos is not a client — so generating this list
 * would have put names under a "clients" heading that do not belong there.
 * That is the one error this section cannot afford.
 *
 * Add a name here only when the studio confirms it. A client with no work on
 * the site yet still belongs; a project on the site does not automatically.
 */
export const clients = [
  "Formula Drift",
  "Blazar",
  "Nozomio",
  "Shoreline Motoring",
  "Blaque Diamond Wheels",
  "Hotpit Autofest",
  "1886 Wheels",
  "Watanabe Wheels",
  "Buy Now Japan",
  "eufy Make",
] as const;

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
