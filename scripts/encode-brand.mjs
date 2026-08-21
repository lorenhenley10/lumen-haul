#!/usr/bin/env node
//
// Derive every brand asset the site serves from the logo masters.
//
// The masters in public/brand/ are big square PNGs — 4167px in the current set,
// 16667px in the one before it. Nothing renders those directly: next/image
// would have to decode the whole thing to draw a 112px mark, and at the larger
// size ffmpeg refuses it outright. This writes the small, purpose-cut files the
// app actually points at, so re-cutting them later is a re-run rather than a
// hunt.
//
//   public/brand/lumen-haul-mark.png   the mark in the page — hero, footer, header
//   src/app/icon.png                   browser tab icon (Next's file convention)
//   src/app/apple-icon.png             iOS home screen
//   src/app/favicon.ico                legacy tab icon, 16/32/48
//   src/app/opengraph-image.png        the card behind a shared link
//
// The two tab icons are the WHITE MARK AT FULL SIZE ON TRANSPARENCY, with no
// ground behind it. That is a deliberate choice and it has a known cost: white
// on transparency is faint against a light tab strip. A black disc was tried
// and taken back out. `disc` below still works if it is ever wanted again.
//
// WHITE ON TRANSPARENT is the site's variant: this is a dark-only interface
// (see docs/audit/visual-system.md). master-black.png and master-flat.jpg are
// here for light surfaces off-site — decks, invoices, an email signature — and
// nothing in the app should reach for them.
//
// NOTE THAT THIS TRIMS, so where the artwork sits inside the master's canvas,
// and how much of it the artwork fills, make NO difference to what ships. Two
// revisions in a row changed only those two things and produced byte-identical
// output. If the mark should render smaller or sit differently on the page,
// that is an `h-*` in the components that draw it, not an export setting.
//
// A revision that changes the DRAWING does come through. Check the trimmed
// dimensions this prints: they move when the artwork does.
//
// Usage: node scripts/encode-brand.mjs
//
// sharp is already a dependency (Next uses it for image optimisation), so this
// adds nothing to install.

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * STABLE FILENAME, on purpose. The exports arrive named for whichever revision
 * they are — "Logo Design final", "Logo Design7", "Logo Design centered" — and
 * pointing this script at one of those means every new logo silently breaks it,
 * which is exactly what happened once already. Updating the logo is now:
 * overwrite this file, re-run this script.
 */
const WHITE_MASTER = join(root, "public/brand/master-white.png");

/**
 * `--color-background`, converted from the token rather than eyeballed.
 *
 * Every icon that has a ground uses it: the disc behind the two tab icons, and
 * the full-bleed plate behind apple-icon, which needs one because iOS ignores
 * alpha and composites onto WHITE. Deriving it from the token means the icons
 * stay the same near-black as the site if that token ever moves.
 */
function oklchToHex(lightness) {
  // Achromatic, so a = b = 0 and the LMS terms collapse to L cubed.
  const linear = lightness ** 3;
  const channel =
    linear <= 0.0031308
      ? linear * 12.92
      : 1.055 * linear ** (1 / 2.4) - 0.055;
  const byte = Math.round(Math.min(Math.max(channel, 0), 1) * 255);
  return `#${byte.toString(16).padStart(2, "0").repeat(3)}`;
}

const BACKGROUND = oklchToHex(0.1543);

/** The master with its transparent margin removed, as raw PNG bytes. */
async function trimmedMark() {
  return sharp(WHITE_MASTER, { limitInputPixels: false })
    // The artwork sits in the middle of a square canvas with a wide
    // transparent margin. Left in, every `h-28` render would be mostly empty
    // space and the mark would read half the size it should.
    .trim()
    .png()
    .toBuffer();
}

/**
 * The mark centred in a square box, at `scale` of the box's shorter side.
 *
 * `disc` fills a circle behind it. That is what makes a tab icon work on a
 * light browser: the mark is white, and white on transparency is invisible
 * against a light tab strip. A black disc gives it its own ground, so the icon
 * reads the same whatever the browser paints behind it.
 *
 * Nothing uses `disc` today — the tab icons went back to a bare white mark —
 * but it is kept because it is the one fix for the white-on-light-chrome
 * problem. If it is turned back on, the scale has to come DOWN with it: the
 * mark is 430x512, so fitted to `scale` its bounding-box corners sit at
 * `scale * 0.653` from the centre and leave the disc entirely at scale 0.765.
 * 0.66 leaves 14% of the radius as margin; 0.70 leaves 9%.
 */
async function squareIcon(mark, size, scale, { background, disc } = {}) {
  return plate(mark, size, size, scale, { background, disc });
}

/**
 * The mark centred on a plate of any shape, at `scale` of the SHORTER side.
 *
 * Scaling off the shorter side is what makes one number safe on both a square
 * and a landscape card: on anything wider than it is tall, height is what runs
 * out first, and height is what every crop eats into.
 */
async function plate(mark, width, height, scale, { background, disc } = {}) {
  const size = Math.min(width, height);
  const inner = Math.round(size * scale);
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: "inside" })
    .png()
    .toBuffer();

  const layers = [];
  if (disc) {
    // Drawn as SVG so the edge is anti-aliased. A composited raster circle at
    // 16px would have a visibly stepped edge.
    layers.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
          `<circle cx="${width / 2}" cy="${height / 2}" r="${size / 2}" fill="${disc}"/>` +
          `</svg>`,
      ),
      top: 0,
      left: 0,
    });
  }
  layers.push({ input: resized, gravity: "centre" });

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

/**
 * Assemble a multi-size .ico.
 *
 * ICO entries may be whole PNGs rather than the old BMP payload, which every
 * browser in use has understood for well over a decade — so this is three
 * PNGs, an index, and no bitmap encoder.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, data }, i) => {
    const entry = i * 16;
    // 0 means 256 in this field; nothing here is that large, but the rule is
    // the reason the field is a single byte.
    directory.writeUInt8(size >= 256 ? 0 : size, entry);
    directory.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    directory.writeUInt8(0, entry + 2); // palette size
    directory.writeUInt8(0, entry + 3); // reserved
    directory.writeUInt16LE(1, entry + 4); // colour planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(data.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.data)]);
}

const mark = await trimmedMark();
const { width, height } = await sharp(mark).metadata();
console.log(`trimmed master: ${width}x${height}`);

// The page mark. Tallest render on the site is the home hero at 112px, so 512
// covers it at better than 4x without shipping a megabyte to draw a logo.
const pageMark = await sharp(mark)
  .resize({ height: 512 })
  .png({ compressionLevel: 9 })
  .toBuffer();
await writeFile(join(root, "public/brand/lumen-haul-mark.png"), pageMark);

// Tab icon: the white mark at full size on transparency, no ground behind it.
// It fills the box — `fit: inside` on a portrait mark means it touches top and
// bottom — and takes the colour of whatever the browser paints behind it.
await writeFile(join(root, "src/app/icon.png"), await squareIcon(mark, 256, 1));

// iOS. A full-bleed plate rather than a disc: the OS masks home-screen icons
// into its own rounded square, so a circle inside that would only shrink the
// mark inside a shape nobody sees. Alpha is not honoured here either, which is
// why this one has always had a background.
await writeFile(
  join(root, "src/app/apple-icon.png"),
  await squareIcon(mark, 180, 0.6, { background: BACKGROUND }),
);

// The social card. Everything else here is an icon the OS or browser draws at
// a known size; this one is an image other people's software crops.
//
// It needs a ground for the same reason apple-icon does, and more urgently:
// there was no card at all before this, so scrapers fell back to icon.png and
// unfurled a white mark on transparency — invisible in every light-themed
// client that renders a link.
//
// 1200x630 — 1.91:1, the shape every surface that unfurls a link is built
// around. Facebook, LinkedIn and Slack ask for it outright; X's large card and
// iMessage crop to 2:1, which takes 15px off each end of this and nothing off
// the mark; Discord shows it whole.
//
// It was square for a day, on request, and a square is the one shape none of
// them show as sent — each crops it, so the framing exported is not the
// framing anyone sees. Cutting to the target shape is the difference between
// choosing the composition and letting six scrapers each choose their own. The
// other way out, a square with `twitter:card` set to `summary`, buys the same
// safety by demoting the card to a thumbnail beside the text.
//
// The mark takes 0.6 of the short side — 378px tall on a 630px card. Smaller
// was tried first and reads as an afterthought once a client draws the card at
// 500px wide, which is the size that matters; this is the largest that still
// keeps its margins under every crop. The 2:1 pass leaves 111px of clear plate
// above and below it, and the square WhatsApp takes out of the middle keeps
// the mark whole with 156px to spare on each side.
await writeFile(
  join(root, "src/app/opengraph-image.png"),
  await plate(mark, 1200, 630, 0.6, { background: BACKGROUND }),
);

// Legacy tab icon, the same way: full size, transparent.
await writeFile(
  join(root, "src/app/favicon.ico"),
  buildIco(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await squareIcon(mark, size, 1),
      })),
    ),
  ),
);

const marked = await sharp(pageMark).metadata();
console.log(`page mark:   ${marked.width}x${marked.height}`);
console.log(`apple plate: ${BACKGROUND}`);
console.log("wrote icon.png, apple-icon.png, favicon.ico, opengraph-image.png");
