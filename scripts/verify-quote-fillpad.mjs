#!/usr/bin/env node
//
// Check every published quote in public/q/ still has a working fill-in pad.
//
// A quote in public/q/ is a standing link that outlives the working file it
// was cut from — documents/quotes/ is gitignored and will not exist in a
// fresh clone, so these files get edited in place rather than republished.
// Republishing is not an option either: the random suffix in the filename is
// the only thing keeping /q/ from being enumerated by guessing project names,
// so a rebuild would hand out a new URL and break the one already sent.
//
// In-place edits need a check that runs in place. This is it. The assertions
// are the same ones publish-quote.mjs refuses to write without, imported
// rather than copied.
//
// Usage:
//   node scripts/verify-quote-fillpad.mjs                 # everything in public/q
//   node scripts/verify-quote-fillpad.mjs path/to/one.html
//

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { fillPadChecks } from "./quote-checks.mjs";

const QUOTE_DIR = "public/q";

const listPublished = () => {
  try {
    return readdirSync(QUOTE_DIR)
      .filter((name) => name.endsWith(".html"))
      .map((name) => join(QUOTE_DIR, name));
  } catch {
    // No public/q at all is not a failure. It means nothing is published yet.
    return [];
  }
};

const args = process.argv.slice(2);
const targets = args.length ? args : listPublished();

if (!targets.length) {
  console.log(`  no quotes in ${QUOTE_DIR}/ — nothing to check`);
  process.exit(0);
}

/** @returns {{ file: string, failed: string[] }} */
const inspect = (file) => {
  const html = readFileSync(file, "utf8");
  return { file, failed: fillPadChecks.filter(([, ok]) => !ok(html)).map(([name]) => name) };
};

const results = targets.map(inspect);

console.log("");
for (const { file, failed } of results) {
  if (failed.length) console.log(`  FAIL  ${file}\n          ${failed.join("\n          ")}`);
  else console.log(`  ok    ${file}`);
}
console.log("");

if (results.some((r) => r.failed.length)) process.exit(1);
