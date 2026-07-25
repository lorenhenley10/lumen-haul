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
  { label: "Creators", href: "/creators" },
  { label: "Studio", href: "/studio" },
] as const;

export const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/", icon: "instagram" },
  { label: "LinkedIn", href: "https://linkedin.com/", icon: "linkedin" },
] as const;

/** Footer link grid — six columns on desktop, three on mobile. */
export const footerNav = [
  { label: "Home", href: "/" },
  { label: "Stories", href: "/stories" },
  { label: "Creators", href: "/creators" },
  { label: "Studio", href: "/studio" },
  { label: "Contact", href: "/studio#contact" },
  { label: "Instagram", href: "https://instagram.com/" },
] as const;

export const brand = {
  /** Wordmark used in the hero and footer. */
  wordmark: "/brand/LumenHaul Logo 2 white.png",
  wordmarkDark: "/brand/LumenHaul Logo 2.png",
  mark: "/brand/LumenHaul Logo Transparent.png",
} as const;
