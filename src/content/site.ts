/** Site-wide configuration: identity, navigation, and social links. */

export const site = {
  name: "Lumen Haul",
  tagline: "An award-winning studio blending true filmmaking craft with future-ready innovation.",
  description:
    "Lumen Haul is a film and photography studio making work for brands that would rather be remembered than noticed.",
  url: "https://lumenhaul.com",
  email: "hello@lumenhaul.com",
} as const;

/**
 * Primary navigation. Order is the on-screen order, and also the order the
 * header's sliding indicator animates through.
 */
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Studio", href: "/studio" },
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
  { label: "Studio", href: "/studio" },
  { label: "Contact", href: "/studio#contact" },
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
