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
   * Shown in the footer on every page, quoted on /about, and published in the
   * Organization structured data — so it has to be an address that is actually
   * monitored, and it is now the only one anyone is given.
   *
   * THIS HAS GONE WRONG ONCE, in the direction it is going again. The original
   * build shipped hello@lumenhaul.com, which resolved nowhere: a visitor
   * writing to it was writing to nobody, and nothing on this side reported the
   * failure. It was replaced with a Gmail address precisely because that one
   * was certain to arrive. This is a return to the domain, so whether it works
   * depends on MX records rather than on anything in this repo — send a live
   * test to it before trusting it, not after.
   *
   * Kept in step with `contact.email` in about.ts; there is only one inbox, and
   * the two are written out separately.
   */
  email: "loren@lumenhaul.com",
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
   * are square and large — 4167px across the last few sets, 16667px in an
   * earlier one — so nothing renders them directly.
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
   * is the tell: each cut of the shape trims to its own width against the same
   * 512 height. The current one is 433 wide; the lighter-stroked cut before it
   * was 430, and the one before that 433 again.
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
  markWidth: 433,
  markHeight: 512,

  /**
   * The logo Google is pointed at for the Organization entity — the knowledge
   * panel, not the favicon beside a result. That is a separate signal from
   * `mark`, and it MUST NOT be repointed at `mark` to "use the real logo".
   *
   * Google renders this against a purely white background and warns that
   * light-toned logos will not survive it. `mark` is the WHITE mark on
   * TRANSPARENCY, which on white renders as nothing at all — the failure is
   * total and invisible from here, because the file loads fine and only
   * disappears at the far end.
   *
   * THE ONLY INVERTED ASSET IN THE BUILD: black mark on white, where the site
   * and every other derived file is white on dark. That inversion is confined
   * to this one line and the one file it names. Nothing renders it in the app,
   * and it is not a second brand variant creeping in — it is the off-site cut
   * Google needs, kept out of the site's own dark-only system on purpose.
   *
   * It is 512x512 against Google's 112x112 minimum, and `encode-brand.mjs`
   * recuts it from master-black.png alongside everything else, so it tracks
   * the logo automatically. It sits in /public rather than behind a Next file
   * convention because those append a content hash to the URL, and structured
   * data has to name a stable absolute address that Google can recrawl.
   *
   * Path only, no host. `organizationSchema` joins it to `site.url`; Google
   * requires an absolute URL here and a bare path would be dropped.
   */
  seoLogo: "/brand/lumen-haul-seo-logo.png",
} as const;

/**
 * Organization structured data, rendered as JSON-LD on the home page.
 *
 * This is what tells Google WHICH logo belongs to the studio. It is not the
 * favicon: the icon beside a search result comes from icon.png / favicon.ico
 * and is already handled by the file conventions in src/app. This one feeds
 * the knowledge panel, and the two can disagree for weeks without either
 * being broken, because Google recrawls and recaches them on separate clocks.
 *
 * ON THE HOME PAGE, ONCE. Google asks for organization markup on the home page
 * or a single page describing the organization, so this does not belong in the
 * layout — rendering it site-wide would put a second, competing Organization
 * entity on every route.
 *
 * Serialised here rather than in the component so the logo path stays out of
 * the page, and so the verify script can import the same object it checks
 * against instead of restating it.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}${brand.seoLogo}`,
  description: site.description,
  email: site.email,
  sameAs: socialLinks.map(({ href }) => href),
} as const;

/**
 * The same object as a string safe to drop into a <script> tag.
 *
 * `<` is escaped because a literal `</script>` anywhere in the serialised data
 * would close the tag early and spill the rest into the document. Nothing in
 * the content contains one today; this costs nothing and removes the class of
 * bug rather than the instance.
 */
export const organizationJsonLd = JSON.stringify(organizationSchema).replaceAll(
  "<",
  "\\u003c",
);
