#!/usr/bin/env node
//
// Derive every brand asset the site serves from the logo masters.
//
// The masters in public/brand/ are 16667x16667 PNGs — around 278 megapixels
// each. Nothing renders those directly: next/image would have to decode a
// quarter-billion pixels to draw a 112px mark, and ffmpeg refuses the size
// outright. This writes the small, purpose-cut files the app actually points
// at, so re-cutting them later is a re-run rather than a hunt.
//
//   public/brand/lumen-haul-mark.png   the mark in the page — hero, footer, header
//   src/app/icon.png                   browser tab icon (Next's file convention)
//   src/app/apple-icon.png             iOS home screen
//   src/app/favicon.ico                legacy tab icon, 16/32/48
//
// WHITE ON TRANSPARENT is the site's variant: this is a dark-only interface
// (see docs/audit/visual-system.md) and the black master is here for light
// surfaces off-site — decks, invoices, a light email signature.
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
const WHITE_MASTER = join(root, "public/brand/Lumen Haul Logo Design white transp.png");

/**
 * `--color-background`, converted from the token rather than eyeballed.
 *
 * Only apple-icon needs it: iOS ignores alpha and composites an icon onto
 * WHITE, so a white mark on transparency would arrive invisible. Every other
 * icon here keeps its transparency.
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

/** The mark centred in a square box, at `scale` of the box's shorter side. */
async function squareIcon(mark, size, scale, background) {
  const inner = Math.round(size * scale);
  const resized = await sharp(mark)
    .resize(inner, inner, { fit: "inside" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: "centre" }])
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

// Tab icon. Keeps its transparency, so it takes the colour of whatever the
// browser paints behind it.
await writeFile(
  join(root, "src/app/icon.png"),
  await squareIcon(mark, 256, 0.72),
);

// iOS. The one asset that gets a plate, because alpha is not honoured there.
await writeFile(
  join(root, "src/app/apple-icon.png"),
  await squareIcon(mark, 180, 0.6, BACKGROUND),
);

// Legacy tab icon. Small sizes get proportionally more of the box: at 16px
// there is no room for margin and the mark still has to be recognisable.
await writeFile(
  join(root, "src/app/favicon.ico"),
  buildIco(
    await Promise.all(
      [16, 32, 48].map(async (size) => ({
        size,
        data: await squareIcon(mark, size, 0.88),
      })),
    ),
  ),
);

const marked = await sharp(pageMark).metadata();
console.log(`page mark:   ${marked.width}x${marked.height}`);
console.log(`apple plate: ${BACKGROUND}`);
console.log("wrote icon.png, apple-icon.png, favicon.ico");
