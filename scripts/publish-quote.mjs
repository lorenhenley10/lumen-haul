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
// THE BLANKS ARE FILLED IN THE BROWSER; EVERYTHING ELSE IS LOCKED. A file in
// public/ is static, so nothing typed into it is saved for the next visitor.
// That is exactly why it works: open the link, type the client, the contact,
// the email and the shoot date, print the PDF, send that. One hosted file
// serves every job and no redeploy is needed per client.
//
// Passing --company and friends bakes a value in as the starting text, which
// is worth doing when a link is going to a named client rather than being
// used as a pad. Either way the four blanks stay typeable and the rates,
// totals and tick boxes do not.
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
  ["company", "party-name", "Client / Company"],
  ["contact", null, "Contact name"],
  ["email", null, "Email"],
];
html = html.replace(
  /<div class="label">Prepared for<\/div>\s*<address>[\s\S]*?<\/address>/,
  () => {
    const lines = party.map(([key, cls, label]) => {
      const value = opts[key] ? escape(opts[key]) : "";
      const classes = ["field", cls].filter(Boolean).join(" ");
      return (
        `        <span class="${classes}" ` +
        `data-fill="${key}" data-placeholder="${label}">${value}</span><br>`
      );
    });
    // Trim the trailing <br> off the last line.
    lines[lines.length - 1] = lines[lines.length - 1].replace(/<br>$/, "");
    return `<div class="label">Prepared for</div>\n      <address>\n${lines.join("\n")}\n      </address>`;
  },
);

// --- 3. Lock everything EXCEPT the four fields meant to be filled in ------
// The rates, the totals and the tick boxes are the quote. The client's name,
// their contact, their email and the shoot date are the blanks on it, and
// leaving those typeable is what lets one hosted file serve every job: fill
// them in the browser, print, send the PDF. Nothing is saved back to the
// server, so what a recipient types is theirs alone.
//
// The shoot date has to be converted before the blanket strip below runs.
html = html.replace(
  /<dd class="fill" contenteditable="true">\[ [^\]]*\]<\/dd>/,
  // data-print: this is the ONE blank whose prompt should still print when
  // it is left empty, because "To be confirmed" is a true thing to say about
  // an unbooked date. An unfilled client name prints nothing instead.
  '<dd class="field" data-fill="shootdate" data-print ' +
    'data-placeholder="To be confirmed"></dd>',
);

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

// Grant editing back to exactly the elements carrying a data-fill. Doing it
// positively, after a blanket strip, means the attribute order in the markup
// does not matter — an earlier version tested with a lookahead and silently
// locked every blank, because class= comes before contenteditable=.
html = html.replace(/(<[^>]*\sdata-fill="[^"]*")/g, '$1 contenteditable="true"');

// --- 3a. The quote dates itself the day it is opened ---------------------
// A hosted quote is a standing link, so a date baked in at build time is
// wrong the moment the month turns: open it in November and it still claims
// to have been quoted in September, against a validity that already lapsed.
// Both dates are therefore computed in the page, and the validity term on
// the last sheet is driven from the same value so the two cannot disagree.
//
// The text written here is the build date, which is the honest fallback if
// scripting is off: stale eventually, but never a date nobody chose.
const today = new Date();
const expires = new Date(today.getTime());
expires.setDate(expires.getDate() + 30);
const fmt = (d, o) => d.toLocaleDateString("en-GB", o);
const shortD = { day: "numeric", month: "short" };
const shortY = { day: "numeric", month: "short", year: "numeric" };
const longY = { day: "numeric", month: "long", year: "numeric" };

html = html.replace(
  /<dd>[^<]*&middot; <span id="valid-date">[^<]*<\/span><\/dd>/,
  `<dd><span data-date="quoted">${fmt(today, shortD)}</span> &middot; ` +
    `<span data-date="valid">${fmt(expires, shortY)}</span></dd>`,
);

html = html.replace(
  /Holds until [0-9]+ [A-Za-z]+ [0-9]{4}\./,
  `Holds until <span data-date="valid-long">${fmt(expires, longY)}</span>.`,
);

// --- 3b. The blanks need an affordance on screen and none on paper -------
html = html.replace(
  "</style>",
  `
/* The four blanks on the quote. A dashed rule says "type here" on screen and
   prints as nothing, so a filled quote looks typeset rather than filled in. */
.field {
  display: inline-block;
  min-width: 9ch;
  padding: 0 2px;
  outline: none;
  border-bottom: 1px dashed var(--rule);
  transition: background 160ms var(--ease), border-color 160ms var(--ease);
}
.field:hover { background: var(--fill); }
.field:focus {
  background: #fff;
  border-bottom-color: var(--ink);
}
.field:empty::before {
  content: attr(data-placeholder);
  color: var(--ink-3);
}

@media print {
  .field { border-bottom: 0; background: none; padding: 0; min-width: 0; }
  /* An unfilled client name must NOT print its prompt: "Client / Company" on
     a sent quote reads as a template nobody finished. An unfilled date may,
     because "To be confirmed" is a true thing to say about a date. */
  .field:empty::before { content: ""; }
  .field[data-print]:empty::before {
    content: attr(data-placeholder);
    color: var(--ink-2);
  }
}
</style>`,
);

html = html.replace(
  "</body>",
  `<script>
/* Fill the blanks, print, send the PDF. Nothing is posted anywhere: this only
   keeps a half-filled quote from being lost to an accidental refresh, and it
   never leaves the device it was typed on. */
(function () {
  /* Re-date the quote to whenever it is being read. Validity is 30 days out
     from that, and the term on the last sheet reads from the same value. */
  var now = new Date();
  var until = new Date(now.getTime());
  until.setDate(until.getDate() + 30);
  var stamp = {
    quoted: now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    valid: until.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    "valid-long": until.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  };
  Object.keys(stamp).forEach(function (k) {
    [].forEach.call(document.querySelectorAll('[data-date="' + k + '"]'), function (el) {
      el.textContent = stamp[k];
    });
  });

  var KEY = "lumen-haul-quote:" + location.pathname;
  var fields = [].slice.call(document.querySelectorAll("[data-fill]"));
  if (!fields.length) return;

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    fields.forEach(function (el) {
      if (saved[el.dataset.fill]) el.textContent = saved[el.dataset.fill];
    });
  } catch (e) { /* private window, blocked storage: fall through empty */ }

  function save() {
    try {
      var out = {};
      fields.forEach(function (el) { out[el.dataset.fill] = el.textContent.trim(); });
      localStorage.setItem(KEY, JSON.stringify(out));
    } catch (e) { /* nothing to do; the page still works */ }
  }

  fields.forEach(function (el) {
    el.addEventListener("input", save);

    /* contenteditable leaves a stray <br> behind when you delete the last
       character, and :empty stops matching, so the prompt never comes back. */
    el.addEventListener("blur", function () {
      if (!el.textContent.trim()) el.innerHTML = "";
      save();
    });

    el.addEventListener("paste", function (e) {
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, t.replace(/\\s+/g, " "));
    });
  });
})();
</script>
</body>`,
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
    `    <span>&nbsp;&nbsp;Click the client details and shoot date to fill them in &middot; tick an optional line to see both totals &middot; then print</span>\n  </div>`,
);

// --- 6. Refuse to write anything that failed a check ----------------------
const checks = [
  ["source comments", (h) => !h.includes("<!--")],
  // Not "no editable fields" any more: exactly four, and every one of them
  // carrying a data-fill. Catches both over-stripping (the blanks stop
  // working) and under-stripping (a client can retype a rate).
  ["exactly four blanks", (h) =>
    (h.match(/contenteditable="true"/g) || []).length === 4 &&
    (h.match(/data-fill="/g) || []).length === 4],
  ["robots meta", (h) => /name="robots"/.test(h)],
  // Count each slot by name, not occurrences of `data-date="`. The script
  // block that fills them builds its selector by concatenation, so a loose
  // count sees four and fails a file that is perfectly correct.
  ["three date slots", (h) =>
    ["quoted", "valid", "valid-long"].every(
      (k) => (h.match(new RegExp('data-date="' + k + '"', "g")) || []).length === 1,
    )],
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
