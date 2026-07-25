# Slice 02 — Studio page ✅ DONE

**Status: implemented.** `/studio` is live at `src/app/studio/page.tsx` with
`src/components/studio/studio-tabs.tsx` and `src/content/studio.ts`.

This file is kept as a record of what was built and, more importantly, of a
**wrong assumption in the original plan** so nobody reintroduces it.

---

## The original plan was wrong

The first draft of this slice specified a **scroll-spy anchor nav**: all six
sections rendered down one long page, an `IntersectionObserver` highlighting
the current tab, and `lenis.scrollTo` on tab click.

The reference does none of that. It is a **content switcher** — only the
selected panel is in the DOM, and the document height changes as you move
between tabs (1699px on the shortest panel, 3586px on the longest). A
scroll-spy build would look right in a screenshot and behave nothing like it.

**Do not "fix" the tabs by turning them back into anchors.**

---

## What was actually built

- **Instant panel swap.** Verified against the reference across 24 consecutive
  frames during a tab change: the content block stays at `opacity: 1` with no
  transform. Only the pill indicator animates — it slides *and resizes*
  (104px → 65px over ~350ms), which is a FLIP, handled by `TabNav`'s Motion
  `layoutId`. **Do not add a fade to the panel swap.**
- **Deep links.** `/studio#contact` is linked from the footer, mobile menu and
  header CTA. The hash is read via `useSyncExternalStore`, not copied into
  state by a mount effect — an effect would render panel 0 and then re-render,
  flashing the wrong content. The hash is kept current with `replaceState`
  (which does not emit `hashchange`, so it cannot feed back).
- **Two panel kinds.** `StudioSection` carries either `rows` (the contact
  directory, `md:grid-cols-2 lg:grid-cols-4`) or `body` prose paragraphs —
  never both.
- **`.text-prose`** added to `globals.css`: 16px/1.5, `-0.05em`, justified with
  `hyphens: auto`. A larger, denser step than the 14px UI text.
- **No images or videos.** The reference's `main` contains none; the page is
  carried entirely by type. Adding photography would be the obvious way to
  make it worse.

## Token fixes this slice forced

Two defects in the shared system surfaced here and are now corrected:

1. **`--text-heading` maxed at 24px**; the reference reaches **32px**. Now
   `clamp(1.5rem, 1rem + 1.25vw, 2rem)`.
2. **`.container` was capped at 1280px.** It was declared in
   `@layer components`, but Tailwind v4 ships its own `container` utility with
   per-breakpoint max-widths, and the utility layer outranks components — so
   the override silently lost on *every page*. It is now `@utility container`
   with `max-width: none`.

Also corrected: `--text-display--letter-spacing` was `-0.02em`; the reference
measures `-0.8px` at 56px, i.e. `-0.0143em`.

## Verified against the reference

Desktop (1440×900) and mobile (390×844), measured on both sites:

| Property | Reference | Ours |
|---|---|---|
| container width @1440 | 1425px | 1425px |
| statement block | 448px / 8 lines | 448px / 8 lines |
| tab strip height | 36px | 36px |
| tab padding / size | 24px / 14px | 24px / 14px |
| h1 @1440 / @390 | 56px / 32px | 56px / 32px |
| h2 @1440 / @390 | 32px / 24px | 32px / 24px |
| prose | 16px/24px justify | 16px/24px justify |
| tab strip scroll width @390 | 623px | 623px |
| edge fade | 48px | 48px |
| contact rows @1440 | 4 columns | 4 columns |
| footer @390 | static | static |

## Still outstanding

- **All copy is placeholder** and invented for Lumen Haul. Real studio
  statement, addresses, partners, service/VP descriptions and commitments are
  needed, plus real contact names and emails.
- The statement's length is tuned to **8 lines, not a character count** — the
  substitute display face has different metrics from the intended one.
  Re-measure the section height when either the copy or the font changes.
