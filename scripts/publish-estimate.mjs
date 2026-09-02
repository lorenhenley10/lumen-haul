#!/usr/bin/env node
//
// Build a client-facing estimate out of a working estimate, and drop it in
// public/q/ ready to deploy.
//
//   node scripts/publish-estimate.mjs documents/estimates/stereotypes.html \
//     --company "Acme Studios" --contact "Jane Doe" --email "jane@acme.com"
//
// WHY THIS IS A SCRIPT AND NOT A COPY-PASTE. The working estimates carry my
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

// The fill-in pad's invariants, shared with scripts/verify-estimate-fillpad.mjs
// so a file published today and a file checked in a year cannot disagree.
import { BLANKS, fillPadChecks } from "./estimate-checks.mjs";

const args = process.argv.slice(2);
const source = args.find((a) => !a.startsWith("--"));

/** `--company "Acme"` → opts.company */
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[i + 1];
}

if (!source) {
  console.error("usage: publish-estimate.mjs <estimate.html> --company X --contact Y --email Z");
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
        `        <span class="${classes}" role="textbox" aria-label="${label}" ` +
        `data-fill="${key}" data-placeholder="${label}">${value}</span><br>`
      );
    });
    // Trim the trailing <br> off the last line.
    lines[lines.length - 1] = lines[lines.length - 1].replace(/<br>$/, "");
    return `<div class="label">Prepared for</div>\n      <address>\n${lines.join("\n")}\n      </address>`;
  },
);

// --- 3. Lock everything EXCEPT the four fields meant to be filled in ------
// The rates, the totals and the tick boxes are the estimate. The client's name,
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
  '<dd class="field" role="textbox" aria-label="Shoot date" ' +
    'data-fill="shootdate" data-print ' +
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

// --- 3a. The estimate dates itself the day it is opened ---------------------
// A hosted estimate is a standing link, so a date baked in at build time is
// wrong the moment the month turns: open it in November and it still claims
// to have been estimated in September, against a validity that already lapsed.
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
  `<dd><span data-date="estimated">${fmt(today, shortD)}</span> &middot; ` +
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
/* The four blanks on the estimate. A dashed rule says "type here" on screen and
   prints as nothing, so a filled estimate looks typeset rather than filled in. */
.field {
  display: inline-block;
  min-width: 9ch;
  padding: 0 2px;
  outline: none;
  border-bottom: 1px dashed var(--rule);
  transition: background 160ms var(--ease), border-color 160ms var(--ease);
}
.field:hover { background: var(--fill); }
/* Focus has to read as MORE active than hover, not less. Setting the
   background to --paper here made it white, which is the sheet's own color,
   so clicking a field removed the hover grey and looked like nothing had
   happened. The grey stays and the rule goes solid instead. */
.field:focus {
  background: var(--fill);
  border-bottom: 1px solid var(--ink);
}
/* outline:none above removes the browser's ring, so keyboard focus needs one
   of its own. A background shift alone is not an indicator. */
.field:focus-visible {
  box-shadow: 0 0 0 2px var(--ink);
  border-radius: 1px;
}
.field:empty::before {
  content: attr(data-placeholder);
  color: var(--ink-3);
}

/* The fill-in pad — one collapsed bar above the sheet, at every width.

   IT EXISTS BECAUSE fit() SCALES THE SHEET TO THE WINDOW, which on a phone
   lands the blanks at about ten pixels tall. That is not a tap target, so
   the pad offers real inputs writing into the same four fields.

   IT IS CLOSED BY DEFAULT AND SHOWN EVERYWHERE, which is one decision and
   not two. Open, it spent four rows of height above the estimate — on a phone
   that was the whole first screen, and the estimate is the thing the link is
   for. Once it costs a single 44px bar, there is no longer any reason to
   gate it behind a width: a desktop reader gets a faster way in than
   hunting four dashed blanks on a scaled sheet, and the interaction is the
   same one on a monitor, a phone held upright and a phone turned sideways.

   <details>/<summary> RATHER THAN A BUTTON AND A CLASS. The open state, the
   Enter/Space handling and the expanded/collapsed announcement are all the
   browser's, and it still opens with scripting off — which matters here,
   because this file is served static with no framework under it. */
.fillpad {
  background: #1c1c1c;
  font-family: var(--font-mono);
}

/* Both halves of the pad align to the sheet below rather than to the window,
   so on a wide screen the bar reads as belonging to the estimate and not to the
   backdrop. Below 8.5in the max-width stops binding and it goes full bleed. */
.fillpad-title {
  display: flex;
  align-items: center;
  gap: 9px;
  /* 44px, not the toolbar's ~40: this one is a tap target. */
  min-height: 44px;
  max-width: var(--sheet-w);
  margin: 0 auto;
  padding: 0 18px;
  font-size: 10px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #a3a3a3;
  cursor: pointer;
  transition: color 160ms var(--ease);
  /* TWO MARKERS TO SUPPRESS, NOT ONE. list-style covers Chrome and Firefox;
     ::-webkit-details-marker is the only one Safari listens to, and Safari
     is most of the phones this link gets opened on. */
  list-style: none;
  -webkit-user-select: none;
  user-select: none;
}
.fillpad-title::-webkit-details-marker { display: none; }
.fillpad-title:hover { color: #fff; }
.fillpad-title:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }

/* The arrow. A chevron off two borders — down when closed, up when open — so
   the bar says which way it goes, not merely that it does something. */
.fillpad-title::after {
  content: "";
  width: 5px;
  height: 5px;
  margin-top: -3px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg);
  transition: transform 220ms var(--ease);
}
.fillpad[open] .fillpad-title::after {
  margin-top: 2px;
  transform: rotate(225deg);
}

.fillpad-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 11px 16px;
  max-width: var(--sheet-w);
  margin: 0 auto;
  padding: 3px 18px 19px;
}
/* There are four fields, so they go 1, 2 or 4 across and never 3. Fitting as
   many as the width allows -- auto-fit with a minmax track -- put three on a
   row and stranded the fourth under them at every desktop width, which reads
   as a layout bug rather than a wrap. Four across also rhymes with the
   project / date / location / validity strip on the sheet below. */
/* minmax(0, 1fr), NEVER a bare 1fr. A bare 1fr is minmax(auto, 1fr), and the
   auto floor is the item's own min-content width -- for a text input that is
   its default size=20, about 233px with the padding. Two of those plus a gap
   is wider than a 480px phone, so the tracks refused to shrink and the whole
   DOCUMENT took a horizontal scrollbar at 480, 760 and 844. Zeroing the floor
   here and on the input below is what lets the tracks divide the width. */
@media screen and (min-width: 480px) {
  .fillpad-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media screen and (min-width: 760px) {
  .fillpad-fields { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
.fillpad label {
  display: grid;
  gap: 5px;
  font-size: 9.5px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #a3a3a3;
}
.fillpad input {
  /* See the grid note above: an input carries an intrinsic width and will not
     go under it unless told to. width:100% then fills whatever track it lands
     in, at one column or at four. */
  min-width: 0;
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #3d3d3d;
  border-radius: 2px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  /* 16px exactly: iOS Safari zooms the viewport when a focused input is
     set smaller, and the zoom does not come back on blur. */
  font-size: 16px;
  letter-spacing: 0;
}
.fillpad input:focus-visible { outline: 2px solid #fff; outline-offset: 1px; }

/* <details> has no open transition of its own. This is decoration only — the
   fields are laid out and reachable on the first frame either way, and the
   reduced-motion block above already flattens it to nothing. */
@keyframes fillpad-open {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: none; }
}
.fillpad[open] .fillpad-fields { animation: fillpad-open 220ms var(--ease); }

/* On a phone the toolbar hint truncates to something like "Click the cli...".
   Drop it; the bar below carries the instruction. */
@media screen and (max-width: 640px) {
  .toolbar-hint span { display: none; }
}

@media print {
  .fillpad { display: none !important; }
  .field { border-bottom: 0; background: none; padding: 0; min-width: 0; }
  /* An unfilled client name must NOT print its prompt: "Client / Company" on
     a sent estimate reads as a template nobody finished. An unfilled date may,
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
   keeps a half-filled estimate from being lost to an accidental refresh, and it
   never leaves the device it was typed on. */
(function () {
  /* Re-date the estimate to whenever it is being read. Validity is 30 days out
     from that, and the term on the last sheet reads from the same value. */
  var now = new Date();
  var until = new Date(now.getTime());
  until.setDate(until.getDate() + 30);
  var stamp = {
    estimated: now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    valid: until.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    "valid-long": until.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  };
  Object.keys(stamp).forEach(function (k) {
    [].forEach.call(document.querySelectorAll('[data-date="' + k + '"]'), function (el) {
      el.textContent = stamp[k];
    });
  });

  /* NOT "lumen-haul-estimate:", even though everything else was renamed.
     This is the address of a half-typed draft in someone's browser, not a
     word anyone reads. Renaming it silently discards whatever is under the
     old key the moment this deploys. It stays for the same reason /q/ does. */
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

  /* The phone pad and the blanks on the sheet are two ways into one value,
     so each writes to the other. Without this, filling the pad and then
     printing would produce an estimate with empty blanks on it. */
  var pads = [].slice.call(document.querySelectorAll("[data-pad]"));
  function syncPads() {
    pads.forEach(function (input) {
      var target = document.querySelector('[data-fill="' + input.dataset.pad + '"]');
      if (target) input.value = target.textContent.trim();
    });
  }
  syncPads();

  pads.forEach(function (input) {
    input.addEventListener("input", function () {
      var target = document.querySelector('[data-fill="' + input.dataset.pad + '"]');
      if (!target) return;
      /* Assigning textContent to "" leaves a text node behind and :empty
         stops matching, so the prompt never returns. Clear the markup. */
      if (input.value) target.textContent = input.value;
      else target.innerHTML = "";
      save();
    });
  });

  fields.forEach(function (el) {
    el.addEventListener("input", function () { syncPads(); save(); });

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

// --- 3c. A tappable way in, at every width --------------------------------
// The sheet scales to fit a phone, which lands the blanks at about ten pixels
// tall. That is not a tap target. Reflowing the document would fix it and
// break the thing the document is for: what you see has to be what prints.
// So the sheet is left alone and a set of real inputs is offered above it,
// writing into the same fields.
//
// COLLAPSED BY DEFAULT, AND SHOWN AT EVERY WIDTH. It used to be phone-only
// and always open, which spent four input rows above the estimate — on a phone
// that was the entire first screen, and the estimate is what the link is for.
// Closed it costs one 44px bar, and at that price there is no reason to hide
// it from a desktop reader, who otherwise has to find four dashed blanks on
// a scaled sheet. Screen only either way; @media print drops it.
//
// The disclosure is a real <details>, so the open state, Enter/Space and the
// expanded/collapsed announcement come from the browser and it still opens
// with scripting off. The CSS is in 3b; the invariants are in estimate-checks.mjs.
html = html.replace(
  /(<\/div>\s*)(<section class="sheet")/,
  `$1<details class="fillpad">
  <summary class="fillpad-title">Fill in this estimate</summary>
  <div class="fillpad-fields">
    <label>Client / Company<input type="text" data-pad="company" autocomplete="organization"></label>
    <label>Contact name<input type="text" data-pad="contact" autocomplete="name"></label>
    <label>Email<input type="email" data-pad="email" autocomplete="email" inputmode="email"></label>
    <label>Shoot date<input type="text" data-pad="shootdate"></label>
  </div>
</details>

$2`,
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
  `<div class="toolbar-hint">\n    <b>${escape(opts.company || "Estimate")}</b>\n` +
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
    BLANKS.every((k) => (h.match(new RegExp('data-fill="' + k + '"', "g")) || []).length === 1)],
  ["robots meta", (h) => /name="robots"/.test(h)],
  // The pad — a details/summary bar, collapsed, at every width, wired to all
  // four blanks. Counted by NAME inside estimate-checks.mjs, never by bare
  // attribute: the script block builds its selectors by concatenation, so a
  // loose count of `data-pad="` sees the markup plus the JavaScript and fails
  // a file that is correct. This is the third check to get that wrong;
  // naming the keys is the fix that sticks.
  ...fillPadChecks,
  ["blanks are labelled", (h) =>
    (h.match(/aria-label="/g) || []).length === 4],
  ["three date slots", (h) =>
    ["estimated", "valid", "valid-long"].every(
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
