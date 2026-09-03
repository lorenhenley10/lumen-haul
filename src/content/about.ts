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
 * The opening statement, in two parts.
 *
 * The original was tuned to fill eight lines at 1440x900 to match a reference
 * layout. This one is sized by what is true rather than to a line count.
 *
 * IT IS SPLIT BECAUSE OF TYPE, NOT MEANING — the words are unchanged. Set as
 * one paragraph at the display step it ran five lines of roughly ninety
 * characters, which is past twice a readable measure: a slab rather than a
 * statement. The first sentence is what the studio IS and carries the page at
 * display size; the rest qualifies it and belongs at reading size, in a column
 * narrow enough to read.
 *
 * Keep that division if you rewrite: `lead` is a claim, `support` is how it
 * works. Anything explaining or justifying belongs in neither — see the tone
 * note above.
 */
export const aboutLead =
  "A commercial production company for automotive, mobility, technology, and ambitious consumer brands.";

export const aboutSupport =
  "High-end commercial production shaped by story, movement, and design.";

export const services: Service[] = [
  {
    title: "Launch and growth",
    body: "Product launches, funding announcements, founder stories and campaign assets for startups and early-stage brands. Multicam interviews, plus coverage for launch events, conferences and demo days.",
  },
  {
    title: "Automotive and motorsport",
    body: "Work for car brands, shops and aftermarket companies, plus motorsport and automotive event coverage. Rolling shots, studio and on location.",
  },
  {
    title: "Commercials and brand films",
    body: "Campaigns, brand films and product spots for established companies and agencies. Full crew, full production, handled from the first call through final delivery.",
  },
  {
    title: "Photography",
    body: "Vehicle, product and event stills, shot alongside the film or booked on their own.",
  },
  {
    title: "Post production",
    body: "Editing, color, sound and finishing, supervised by the person who directed the shoot.",
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
  email: "loren@lumenhaul.com",
} as const;
