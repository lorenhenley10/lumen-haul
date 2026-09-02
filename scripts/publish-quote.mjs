#!/usr/bin/env node
//
// Build a client-facing quote out of a working quote, and drop it in
// public/q/ ready to deploy.
//
//   node scripts/publish-quote.mjs documents/quotes/stereotypes.html \
//     --company "Acme Studios" --contact "Jane Doe" --email "jane@acme.com"
//
// WHY THIS IS A SCRIPT AND NOT A COPY-PASTE. The working quotes carry my
// notes on how each number was arrived at: which figures had been wrong and
// why, what is a bundle rather than a sum, which line was left unticked on
// purpose. Every one of those is useful to whoever edits the file and ruinous
// to a client who opens View Source. Stripping them is the step that must not
// be forgotten, so it does not get left to memory.
//
// A HOSTED QUOTE IS PERSONALISED AT BUILD TIME, NOT IN THE BROWSER. A file in
// public/ is static: a recipient typing into it changes nothing for anybody
// else, and the next visitor still sees the placeholder. So the client's
// details are baked in here, and a different client means a different build.
//
// The output filename carries a random suffix. public/ has no auth in front
// of it, so the only thing stopping /q/ being enumerated by guessing at
// project names is that the names are not guessable.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { basename } from "node:path";

const args = process.argv.slice(2);
const source = args.find((a) => !a.startsWith("--"));

/** `--company "Acme"` → opts.company */
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[i + 1];
}

if (!source) {
  console.error("usage: publish-quote.mjs <quote.html> --company X --contact Y --email Z");
  process.exit(1);
}

const escape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let html = readFileSync(source, "utf8");

// --- 1. Every comment goes. This is the whole point of the script. --------
html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n");

// --- 2. The client block, filled from the flags ---------------------------
// Anything not supplied keeps its bracketed placeholder, which is visible
// enough on the page to catch before the link goes out.
const party = [
  ["company", "party-name"],
  ["contact", null],
  ["email", null],
];
html = html.replace(
  /<div class="label">Prepared for<\/div>\s*<address>[\s\S]*?<\/address>/,
  () => {
    const lines = party.map(([key, cls]) => {
      const value = opts[key] ? escape(opts[key]) : `[ ${key} ]`;
      return cls
        ? `        <span class="${cls}">${value}</span><br>`
        : `        ${value}<br>`;
    });
    // Trim the trailing <br> off the last line.
    lines[lines.length - 1] = lines[lines.length - 1].replace(/<br>$/, "");
    return `<div class="label">Prepared for</div>\n      <address>\n${lines.join("\n")}\n      </address>`;
  },
);

// --- 3. A recipient must not be able to type into a quote -----------------
html = html
  .replace(/ contenteditable="true"/g, "")
  .replace(/class="party-name fill"/g, 'class="party-name"')
  .replace(/<span class="fill">/g, "<span>")
  .replace(/<dd class="fill">/g, "<dd>")
  .replace(/class="row-title fill"/g, 'class="row-title"')
  .replace(/class="num amount fill"/g, 'class="num amount"');

// The paste/focus handler those fields needed has nothing left to bind to.
// The optional group takes the JS comment above it as well: that line says
// the word "contenteditable" too, and leaving it behind trips the check at
// the bottom of this file.
//
// THE COMMENT PATTERN CANNOT BE `\/\*[\s\S]*?\*\/`. Non-greedy still
// backtracks: faced with a comment here and the handler far below, it happily
// expands to the LAST `*/` that lets the rest of the pattern match, and the
// first attempt at this swallowed 39KB — every sheet in the document —
// between the stylesheet's opening comment and this handler. `[^*]|\*(?!\/)`
// cannot cross a `*/`, so the group matches exactly one comment.
html = html.replace(
  /\n[ \t]*(?:\/\*(?:[^*]|\*(?!\/))*\*\/[ \t]*\n)?[ \t]*document\.querySelectorAll\('\[contenteditable="true"\]'\)[\s\S]*?\n  \}\);\n/,
  "\n",
);

// --- 4. noindex, asserted in the page as well as in the header ------------
if (!/name="robots"/.test(html)) {
  html = html.replace(
    '<meta name="viewport"',
    '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">\n' +
      '<meta name="referrer" content="no-referrer">\n' +
      '<meta name="viewport"',
  );
}

// --- 5. The toolbar was addressed to whoever was editing the file ---------
html = html.replace(
  /<div class="toolbar-hint">[\s\S]*?<\/div>/,
  `<div class="toolbar-hint">\n    <b>${escape(opts.company || "Quote")}</b>\n` +
    `    <span>&nbsp;&nbsp;Tick or untick an optional line to see both totals</span>\n  </div>`,
);

// --- 6. Refuse to write anything that failed a check ----------------------
const checks = [
  ["source comments", (h) => !h.includes("<!--")],
  ["editable fields", (h) => !h.includes("contenteditable")],
  ["robots meta", (h) => /name="robots"/.test(h)],
  ["sheets intact", (h) => (h.match(/class="sheet"/g) || []).length >= 2],
];
const failed = checks.filter(([, ok]) => !ok(html)).map(([name]) => name);
if (failed.length) {
  console.error("REFUSED — failed: " + failed.join(", "));
  process.exit(1);
}

// --- 7. Write it -----------------------------------------------------------
const slug = basename(source, ".html").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
const name = `${slug}-${randomBytes(4).toString("hex")}.html`;
mkdirSync("public/q", { recursive: true });
writeFileSync(`public/q/${name}`, html);

const missing = party.filter(([k]) => !opts[k]).map(([k]) => k);
console.log(`\n  public/q/${name}`);
console.log(`  https://lumenhaul.com/q/${name}\n`);
if (missing.length) console.log(`  STILL PLACEHOLDER: ${missing.join(", ")}\n`);
console.log("  Commit and push to deploy.\n");
