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
   * THREE MASTERS ship in public/brand/, and this is derived from the white
   * one on transparency. That is not a preference — this interface is dark
   * only (docs/audit/visual-system.md), so white is the variant that belongs
   * on it. The black-on-transparent master and the flat JPEG are here for
   * light surfaces off the site; nothing in the app should reach for them.
   *
   * Regenerate with `node scripts/encode-brand.mjs`, which also cuts the
   * favicon set. The masters are 16667px square — around 278 megapixels — so
   * nothing renders them directly.
   *
   * The derived file is TRIMMED to the artwork: the master centres the mark in
   * a square canvas with a wide transparent margin, and left in, every render
   * would be mostly empty space. Size it by height and let the width follow.
   *
   * The intrinsic size is deliberately close to the largest on-screen render
   * (112px in the home hero) rather than the master's. Declaring the full
   * 16667px makes next/image generate variants nothing can see.
   */
  mark: "/brand/lumen-haul-mark.png",
  markWidth: 433,
  markHeight: 512,
} as const;
