/** Site-wide configuration: identity, navigation, and social links. */

export const site = {
  name: "Lumen Haul",
  /**
   * The line under the wordmark on the hero, and the default page title.
   *
   * DO NOT RESTORE THE PREVIOUS ONE. It read "An award-winning studio blending
   * true filmmaking craft with future-ready innovation" — which is, character
   * for character, the `caption` field on letitrippictures.com, the site this
   * build was referenced against. It was another studio's positioning running
   * as this one's headline, and it made an awards claim nobody here had
   * counted.
   *
   * Keep any replacement to things that are true and checkable from the work:
   * what gets made, and how. No awards, no years, no superlatives.
   *
   * Two sentences rather than one em-dashed clause, because layout.tsx sets the
   * page title as `${name} — ${tagline}` and a dash here makes that read
   * "Lumen Haul — ... — ...".
   */
  tagline:
    "Branded films, commercials and stills. Crewed to the job, cut in-house.",
  description:
    "Lumen Haul is a film and photography studio making work for brands that would rather be remembered than noticed.",
  url: "https://lumenhaul.com",
  /**
   * Shown in the footer on every page, so it has to be an address that is
   * actually monitored. It was hello@lumenhaul.com, a placeholder from the
   * original build — a visitor writing to it would have been writing to nobody.
   * Kept in step with the address on /about; there is only one inbox.
   */
  email: "lorenhenley10@gmail.com",
} as const;

/**
 * Primary navigation. Order is the on-screen order, and also the order the
 * header's sliding indicator animates through.
 */
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Stills", href: "/stills" },
  { label: "About", href: "/about" },
] as const;

export const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/lumenhaul/",
    icon: "instagram",
  },
  // LinkedIn removed until there's a real profile to link — an icon
  // pointing at linkedin.com's homepage is worse than no icon at all.
] as const;

/** Footer link grid — three columns on mobile, five across on desktop. */
export const footerNav = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Stills", href: "/stills" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/about#contact" },
  { label: "Instagram", href: "https://www.instagram.com/lumenhaul/" },
] as const;

export const brand = {
  /**
   * The studio mark: in the header, above the set wordmark in the hero, and
   * again in the footer.
   *
   * FOUR MASTERS ship in public/brand/ under stable names — master-white.png,
   * master-black.png, master-flat.jpg and master-flat-black.jpg — and this is
   * derived from the white one. That is not a preference: this interface is
   * dark only (docs/audit/visual-system.md), so white is the variant that
   * belongs on it. The other three are for surfaces off the site and nothing
   * in the app should reach for them.
   *
   * The names are stable BECAUSE the exports' own names are not. Updating the
   * logo means overwriting master-white.png and re-running
   * `node scripts/encode-brand.mjs`, which also cuts the favicon set — not
   * repointing the script at whatever the new export was called. The masters
   * are square and large — 4167px in the current set, 16667px in the one
   * before — so nothing renders them directly.
   *
   * The derived file is TRIMMED to the artwork: the master centres the mark in
   * a square canvas with a wide transparent margin, and left in, every render
   * would be mostly empty space. Size it by height and let the width follow.
   *
   * WHICH MEANS SCALING OR MOVING THE MARK INSIDE THE MASTER CHANGES NOTHING
   * HERE. The trim removes the margin either way: two revisions in a row
   * altered only the artwork's size and position in its canvas and produced a
   * derived file identical to within resampling noise. To make the mark render
   * smaller, change the `h-*` at the places that draw it — the home hero, the
   * mobile reel, the footer and the header. The favicon set is separate again;
   * those ratios are icon composition, not the site's sizing.
   *
   * A revision that changes the DRAWING does come through, and the width above
   * is the tell: the current mark is a lighter-stroked cut of the same shape
   * and trims to 430x512 where its predecessor trimmed to 433x512.
   *
   * The intrinsic size is deliberately close to the largest on-screen render
   * (88px in the home hero) rather than the master's. Declaring the master's
   * full size makes next/image generate variants nothing can see.
   *
   * DRAWN `unoptimized` AT EVERY CALL SITE — the header (twice), the footer,
   * the home hero and the mobile reel. The file is a 10KB PNG that never
   * renders larger than 88px, so an optimised variant saves nothing worth
   * having, and it lives in /public with no long-lived Cache-Control of its
   * own. That last part is what made it worth changing: the optimizer's cache
   * entry expired on the default four-hour TTL, so the mark was re-transformed
   * six times a day, on the two pages every visit passes through, forever.
   */
  mark: "/brand/lumen-haul-mark.png",
  markWidth: 430,
  markHeight: 512,
} as const;
