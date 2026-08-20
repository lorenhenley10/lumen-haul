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
   * The studio mark, used above the set wordmark in the hero and footer.
   *
   * Derived from `Lumen Haul Logo.png`, which ships as RGB on solid black. The
   * mark sits over video, so it needs real transparency — the derived file
   * carries the glow in its alpha channel and is trimmed to the artwork, with
   * none of the source's surrounding dead space.
   *
   * It is PORTRAIT (roughly 3:5). Size it by height and let the width follow;
   * a square box would leave it floating in its own padding.
   *
   * The intrinsic size is deliberately close to the largest on-screen render
   * (80px tall) rather than the source artwork's. Declaring the full 512×860
   * makes next/image generate a 1080px variant of a 48px logo — a slow encode
   * for a payload nothing can see.
   */
  mark: "/brand/lumen-haul-mark.png",
  markWidth: 384,
  markHeight: 645,
} as const;
