//
// Structural invariants for the fill-in pad on a published estimate.
//
// These live apart from publish-estimate.mjs because they have to run against
// two different things. The publish script checks its own output before it
// writes it; the verify script checks files in public/q/ that were published
// months ago and, being hand-editable static HTML, may have been touched
// since. One list, imported by both, so the two cannot drift.
//
// Every failure here is silent from the inside. The file still renders, the
// blanks still fill, the estimate still prints — the pad is just permanently
// open, or gone above 640px, or no longer wired to a field. Nothing throws
// and no build goes red.
//

/** @typedef {[name: string, ok: (html: string) => boolean]} Check */

const count = (html, needle) => html.split(needle).length - 1;

/** The four values a recipient is meant to type. Everything else is locked. */
export const BLANKS = ["company", "contact", "email", "shootdate"];

/** @type {Check[]} */
export const fillPadChecks = [
  // <details>/<summary>, not a div and a click handler. The semantics are
  // the point: a div would need JS to open, JS to be focusable, and ARIA to
  // announce, and this file is static with no framework under it.
  [
    "fill pad is a details/summary disclosure",
    (h) =>
      count(h, '<details class="fillpad"') === 1 &&
      count(h, '<summary class="fillpad-title">') === 1,
  ],

  // `open` on the <details> is one word, and it is the difference between a
  // 44px bar and four input rows shoved between the toolbar and the estimate.
  [
    "fill pad starts collapsed",
    (h) => !/<details[^>]*\bclass="fillpad"[^>]*\bopen\b/.test(h),
  ],

  // The pad used to be phone-only, hidden by `.fillpad { display: none; }`
  // and revived inside a max-width media query. Re-gating it by width is the
  // regression this catches: the only remaining hide is the print one.
  [
    "fill pad shows at every width",
    (h) =>
      !h.includes(".fillpad { display: none; }") &&
      count(h, ".fillpad { display: none !important; }") === 1,
  ],

  // The regression that cost a cycle: `repeat(n, 1fr)` is `repeat(n, minmax(
  // auto, 1fr))`, and that auto floor is the input's own min-content width —
  // about 233px — so the tracks refused to divide a 480px screen and the whole
  // document took a horizontal scrollbar. It looks correct in the CSS and only
  // shows up in a browser at a width nobody thought to open.
  [
    "fill pad grid tracks can shrink",
    (h) => !/\.fillpad-fields \{ grid-template-columns: repeat\(\d+, 1fr\)/.test(h),
  ],

  // Catches both directions: a pad input that writes nowhere, and a blank on
  // the sheet with no input pointing at it. Counted BY NAME — a bare count of
  // `data-pad="` also matches the script block, which builds its selector by
  // concatenation, and would pass a file missing a field.
  [
    "fill pad is wired to every blank",
    (h) => BLANKS.every((k) => count(h, `data-pad="${k}"`) === 1),
  ],
];
