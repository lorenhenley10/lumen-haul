#!/usr/bin/env node
//
// Check that the home page still tells Google which logo belongs to the studio.
//
// This guards the Organization JSON-LD that feeds the KNOWLEDGE PANEL. It is
// not the favicon beside a search result — that comes from the icon.png and
// favicon.ico file conventions in src/app, on Google's own separate recrawl
// clock, which is why the two can disagree for weeks with nothing wrong.
//
// The failure this exists to catch is silent from the inside. Every part of it
// keeps working when it breaks: the page renders, the JSON parses, the image
// URL returns 200. It only fails at the far end, in a panel nobody here can
// see, weeks after the deploy that caused it.
//
// Usage:
//   node scripts/verify-organization-logo.mjs                      # localhost
//   node scripts/verify-organization-logo.mjs https://lumenhaul.com
//
// Run it against the dev server BEFORE deploying. That is the whole point of
// the origin rewrite below.

import sharp from "sharp";
import { organizationSchema } from "../src/content/site.ts";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:3000/");

/**
 * Walk a JSON-LD document into a flat list of entities.
 *
 * A block may be one object, an array of them, or an `@graph` holding the
 * real entities — all three are valid and all three appear in the wild, so
 * finding the Organization means flattening rather than indexing.
 */
function collectEntities(value) {
  if (Array.isArray(value)) return value.flatMap(collectEntities);
  if (!value || typeof value !== "object") return [];
  const graph = Array.isArray(value["@graph"])
    ? value["@graph"].flatMap(collectEntities)
    : [];
  return [value, ...graph];
}

function isOrganization(entity) {
  const type = entity["@type"];
  return (
    type === "Organization" ||
    (Array.isArray(type) && type.includes("Organization"))
  );
}

const pageResponse = await fetch(target);
if (!pageResponse.ok) {
  throw new Error(`Home page returned HTTP ${pageResponse.status}: ${target}`);
}

const html = await pageResponse.text();
const blocks = [
  ...html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ),
];

const entities = blocks.flatMap((match) => {
  try {
    return collectEntities(JSON.parse(match[1]));
  } catch {
    throw new Error("Home page contains invalid JSON-LD");
  }
});

const organizations = entities.filter(isOrganization);
if (organizations.length === 0) {
  throw new Error("Home page is missing Organization JSON-LD");
}
// Two Organization entities is worse than none: Google has to pick, and the
// one it picks is not the one you were looking at. The usual cause is the
// markup being lifted into the layout so it renders on every route.
if (organizations.length > 1) {
  throw new Error(
    `Home page declares ${organizations.length} Organization entities; there must be exactly one`,
  );
}

// Compared against the exported object rather than a copy of its values. A
// restated expectation here would be a second source of truth that drifts
// silently the first time site.ts changes and this file does not.
const [organization] = organizations;
for (const [property, expected] of Object.entries(organizationSchema)) {
  const actual = organization[property];
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(
      `Organization.${property} must be ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

// Google needs an absolute URL. A bare path is not resolved against the page,
// it is dropped, and the logo silently reverts to whatever Google had before.
let logoUrl;
try {
  logoUrl = new URL(organization.logo);
} catch {
  throw new Error(
    `Organization.logo must be an absolute URL, received ${JSON.stringify(organization.logo)}`,
  );
}

// THE ORIGIN REWRITE. site.ts hardcodes the production host, so fetching
// `organization.logo` verbatim would check production no matter what was
// passed in — a local run would pass on the strength of the last deploy and
// prove nothing about the build about to replace it.
const logoOnTarget = new URL(logoUrl.pathname + logoUrl.search, target);

const logoResponse = await fetch(logoOnTarget, { redirect: "manual" });
if (logoResponse.status >= 300 && logoResponse.status < 400) {
  // Googlebot follows redirects, so this is a warning rather than a failure —
  // but structured data should name the URL that answers, not one that points
  // at it.
  console.warn(
    `WARNING  logo redirects: ${logoOnTarget} -> ${logoResponse.headers.get("location")}`,
  );
} else if (!logoResponse.ok) {
  throw new Error(
    `Organization logo returned HTTP ${logoResponse.status}: ${logoOnTarget}`,
  );
}

const followed = await fetch(logoOnTarget);
if (!followed.ok) {
  throw new Error(
    `Organization logo returned HTTP ${followed.status}: ${logoOnTarget}`,
  );
}

const contentType = followed.headers.get("content-type") ?? "";
if (!contentType.startsWith("image/")) {
  throw new Error(
    `Organization logo served as ${contentType || "no content type"}, not an image`,
  );
}

const bytes = Buffer.from(await followed.arrayBuffer());
const image = sharp(bytes);
const { width, height } = await image.metadata();

// Google's documented floor. Anything under it is ignored outright.
if (width < 112 || height < 112) {
  throw new Error(
    `Organization logo is ${width}x${height}; Google requires at least 112x112`,
  );
}

// THE TRAP THIS FILE EXISTS FOR. Google composites the logo onto a purely
// white background. The studio mark is white on transparency, so pointing
// `brand.seoLogo` at it — the obvious-looking "use the real logo" edit —
// produces a file that loads, passes every check above, and renders as an
// empty white rectangle in the one place it is used.
//
// So the test is not "is this image light" — the shipped logo is black on
// white and is therefore mostly light, legitimately. It is: DO THE SAME THING
// GOOGLE DOES, flatten onto white, and ask whether anything survives.
const flattened = await sharp({
  create: {
    width,
    height,
    channels: 4,
    background: "#ffffff",
  },
})
  .composite([{ input: bytes }])
  .raw()
  .toBuffer({ resolveWithObject: true });

let contrasting = 0;
for (let i = 0; i < flattened.data.length; i += flattened.info.channels) {
  // Rec. 709 luminance. Weighted rather than a flat mean because a mid green
  // and a mid blue read very differently against white.
  const luminance =
    0.2126 * flattened.data[i] +
    0.7152 * flattened.data[i + 1] +
    0.0722 * flattened.data[i + 2];
  if (luminance < 200) contrasting++;
}

const contrastShare = contrasting / (width * height);
// 3% is deliberately low. A thin-stroked mark on a white plate covers less of
// its box than it looks like it does — the shipped logo sits around 12% — and
// the failure this catches is total, not marginal, so the threshold only has
// to separate "something is there" from "nothing is".
if (contrastShare < 0.03) {
  throw new Error(
    `Organization logo is ${(100 * (1 - contrastShare)).toFixed(1)}% white once flattened; ` +
      `Google draws it on white, so this would render as a blank square`,
  );
}

// Reported, not enforced. Transparency is fine as long as what remains
// survives the flatten above, and the check that matters already ran.
const { data, info } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
let opaque = 0;
for (let i = 0; i < data.length; i += info.channels) {
  if (data[i + 3] >= 200) opaque++;
}
const opaqueShare = opaque / (info.width * info.height);

console.log(`Organization logo verified against ${target.origin}`);
console.log(`  logo declared  ${organization.logo}`);
console.log(`  fetched from   ${logoOnTarget}`);
console.log(`  ${width}x${height} ${contentType}`);
console.log(
  `  ${(100 * opaqueShare).toFixed(0)}% opaque, ${(100 * contrastShare).toFixed(1)}% of the box survives flattening onto white`,
);
