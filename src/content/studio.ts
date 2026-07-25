import type { StudioSection } from "./types";

/**
 * PLACEHOLDER CONTENT — invented for Lumen Haul, real structure.
 *
 * Lengths are chosen deliberately, not arbitrarily: the opening statement runs
 * ~460 characters so it sets to roughly three lines of display type at desktop
 * and fills the same vertical block as the reference. Prose panels vary from
 * short (Virtual Production) to long (Commitments) so the layout is exercised
 * at both extremes and the page height genuinely changes per tab.
 *
 * Replace every string here with the studio's real copy. Do not change the
 * SHAPE without re-reading docs/audit/routes.md § /studio.
 */

/**
 * Length is tuned to LINE COUNT, not character count.
 *
 * The reference's opening statement sets to 8 lines at 1440x900, a 448px
 * block, and that proportion is most of the page's character. Ours is tuned to
 * the same 8 lines — but the two typefaces have different metrics, so matching
 * their character count exactly produced 9 lines and had to be trimmed.
 *
 * If you replace this copy, or swap in the licensed display face, re-measure
 * the section height rather than trusting the character count.
 */
export const studioStatement =
  "Lumen Haul is a film and photography studio built around a simple bias: that the most memorable work is usually the least decorated. We make commercials, documentaries and stills for brands that would rather be remembered than noticed, and we keep the crew small enough that everyone on set knows why the camera is where it is. We have been doing it for eleven years, from a converted print works, with an unreasonable amount of care.";

export const studioSections: StudioSection[] = [
  {
    id: "contact",
    label: "Contact",
    heading: "Contact",
    rows: [
      {
        label: "Business & Partnership",
        name: "June Okafor, EP",
        email: "june@lumenhaul.com",
        detail: "+44 20 7946 0100",
      },
      {
        label: "Production",
        name: "Sasha Lindqvist, Producer",
        email: "sasha@lumenhaul.com",
        detail: "Mon–Fri, 09:00–18:00",
      },
      {
        label: "Talent",
        name: "Rae Alvarez",
        email: "talent@lumenhaul.com",
      },
      {
        label: "Post & Colour",
        name: "Nils Haugen",
        email: "post@lumenhaul.com",
      },
      {
        label: "Press & Community",
        email: "press@lumenhaul.com",
      },
      {
        label: "Finance",
        email: "finance@lumenhaul.com",
      },
      {
        label: "Legal",
        email: "legal@lumenhaul.com",
      },
      {
        label: "General",
        email: "hello@lumenhaul.com",
      },
    ],
  },
  {
    id: "address",
    label: "Address",
    heading: "Address",
    body: [
      "The studio occupies a former print works on the east side of the city. There is a stage, a small grade suite, a kitchen that gets more use than either, and enough parking for a five-tonne truck if you tell us you are coming.",
      "Reception is open on weekdays. If you are delivering equipment outside those hours, call ahead and someone will meet you at the loading door rather than leaving you on the pavement with a flight case.",
    ],
  },
  {
    id: "partners",
    label: "Partners",
    heading: "Partners",
    body: [
      "We work with a standing group of collaborators rather than rebuilding a crew for every job. Grading, sound design, and the heavier visual effects work all go to the same three houses, and have done for long enough that briefs no longer need explaining twice.",
      "For work outside our own territories we partner with local service companies rather than flying a full crew and pretending we know the terrain. It is cheaper, it is faster, and the results are better because someone on the team has actually shot there before.",
      "If you represent a production company looking for a service partner in our region, the production address above is the right first contact.",
    ],
  },
  {
    id: "service",
    label: "Service",
    heading: "Service Production",
    body: [
      "We take on service production for overseas agencies and production companies: crew, kit, permits, locations, casting, and the parts of the schedule that only make sense if you have worked here before.",
      "Full-service or partial. Tell us which parts you want to keep and we will quote the rest.",
    ],
  },
  {
    id: "vp",
    label: "VP",
    heading: "Virtual Production",
    body: [
      "We run a modest LED volume and the pipeline around it — previs, environment build, on-set operation, and the colour work that keeps the wall and the foreground in agreement.",
      "It is not the right answer for every brief, and we will say so when it is not.",
    ],
  },
  {
    id: "commitments",
    label: "Commitments",
    heading: "Commitments",
    body: [
      "We publish our rates for crew positions and we pay them. Overtime is agreed before it happens, not discovered afterwards, and runners are paid from their first day rather than after an unpaid trial that somehow never ends.",
      "Sets run to a twelve-hour turnaround. Where a schedule cannot accommodate that, we change the schedule rather than the turnaround. This has cost us work and we have accepted the trade.",
      "On sustainability we measure rather than estimate: production carbon is tracked per job, reported to clients who ask, and reduced where the reduction is real rather than cosmetic. We do not buy offsets and describe a shoot as neutral.",
      "Casting and crewing briefs go out to a deliberately wider list than the one we already know. That is the only mechanism we have found that actually changes who ends up on the call sheet, and it requires doing every time rather than once a year.",
      "Every location we shoot in is left in the state we found it. Every supplier we use is paid to terms. Neither is remarkable, and both are worth writing down because the industry's record on them is not good.",
    ],
  },
];

export function getStudioSection(id: string): StudioSection | undefined {
  return studioSections.find((section) => section.id === id);
}
