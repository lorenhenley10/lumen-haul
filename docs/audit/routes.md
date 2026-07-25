# Reference Audit — Route Inventory

Reference: `https://letitrippictures.com` — audited 2026-07-24 via live DOM/CSS
inspection at 1440×900, 1280×720 and 390×844.

**Reference stack (detected, for context only — we are not copying it):**
SvelteKit + Tailwind v4 (shadcn-style token names) + Lenis + GSAP ScrollTrigger
(`pin-spacer` elements present in the DOM) + Mux `<mux-video>` web components
for all video. Fonts: PP Neue Montreal (display) + Commit Mono (UI).

> **Content note.** The reference's client list, project names and copy are
> another studio's property. This build reproduces the *structure, layout,
> interaction model and motion design* — never their content. All project,
> creator and studio copy in `src/content/` is invented placeholder material
> for Lumen Haul and is marked as such.

---

## Route map

| Route | Purpose | Rendering | Notes |
|---|---|---|---|
| `/` | Showreel entry | Static | Two entirely separate DOM trees for desktop / mobile |
| `/stories` | Project index | Static | 18-card grid |
| `/stories/[slug]` | Project case study | SSG | 18 slugs |
| `/creators` | Talent index | Static | Hover-crossfade backdrop index |
| `/creators/[slug]` | Creator detail | SSG | Linked from index |
| `/studio` | About / contact | Static | Tabbed anchor sections |
| `/studio#contact` | Contact anchor | — | Target of every CTA on the site |

Global chrome: fixed header on every route; reveal footer on every route.
There is no search, no filtering, no pagination, and no auth anywhere.

---

## `/` — Home

The most complex route, and the only one whose desktop and mobile versions are
**different interaction models rather than different layouts**. See
`responsive.md` for why this matters.

### Desktop (≥ `md`)

Two full-viewport sections plus the revealed footer. Total scroll height was
~2056px at a 720px viewport — i.e. the whole page is under 3 screens.

**Section 1 — Hero** (`sticky top-0 h-dvh overflow-hidden`)
- Full-bleed background video, `brightness-80`, `bg-black/20` scrim over it.
- Centred wordmark image + tagline paragraph (`max-w-xs`, centred).
- Bottom: a 7-layer **progressive blur** stack (`.gradient-blur` with seven
  nested divs) behind a "Scroll to Explore" caption.
- Held in place by CSS `position: sticky`, not a GSAP pin.

**Section 2 — Featured reel** (`h-dvh`, GSAP-pinned)
- Nine `<a>` elements stacked at `absolute inset-0`, each a full-bleed film.
- A **scroll-driven pinned sequence**: the section pins at `y = 900` and holds
  for **12150px** (the spacer's `padding-bottom`), 1350px — 1.5 viewport
  heights — per film, then releases.
- Exactly one film is visible at a time; crossing a segment boundary crossfades
  to the next over a fixed ~0.5s, with the outgoing film fading out on top of
  the incoming one. Full spec in `motion-system.md` §3.
- Each slide overlays a centred `h2` in two weights: client in `font-medium`,
  title in `font-light tracking-tight`.
- **Index rail**, right edge, vertically centred: a `w-9` pill,
  `bg-primary/10 backdrop-blur-lg rounded-full shadow-base`, containing
  `01`–`09` as square buttons. Contains:
  - an absolutely-positioned active pill that translates by index,
  - inside it an `origin-top` fill that acts as a **playback progress meter**,
  - top and bottom gradient fade masks (`h-8`) over an internally scrollable,
    scrollbar-hidden list capped at `max-h-[198px]` (5.5 items × 36px),
  - per-button hover preview layer (`opacity-0 group-hover:opacity-100`),
  - numerals set in `mix-blend-difference` so they read on either state.
- Videos are **lazy**: `playback-id` is absent until a slide becomes active.
  All nine sat paused with only their poster attribute set.

**Footer** — revealed beneath (see below).

### Mobile (< `md`)

A completely different tree (`main > div.md:hidden`):

- A **`fixed inset-0 h-svh snap-y snap-mandatory overflow-y-auto` container**
  that owns its own scrolling — the window itself does not scroll.
- Panel 1: hero (`h-svh snap-start`) — inline video, wordmark, tagline. No
  progressive blur, no "scroll to explore".
- Panels 2..10: **title only** (`h-svh snap-start bg-black/20 p-12`), each a
  link wrapping the two-weight `h2`.
- Each title panel has a **sibling** `pointer-events-none fixed inset-0 -z-1
  h-svh duration-200 opacity-0` element holding that project's video. The film
  layer is fixed; the titles snap past it; opacity crossfades to match the
  snapped panel.
- Final panel: the footer, as a `h-svh snap-start` gradient panel.
- Footer computes to `position: static` here, not fixed.

---

## `/stories` — Project index

- `main.pt-top-section relative container min-h-dvh pb-16` — the
  `--spacing-top-section: 16rem` clearance under the fixed header.
- `section.grid grid-cols-1 gap-x-4 gap-y-16 md:grid-cols-2 xl:grid-cols-3`.
  Note the very generous **`gap-y-16` against a tight `gap-x-4`** — rows breathe,
  columns nearly touch.
- 18 cards. Card anatomy:
  - `div.relative aspect-video overflow-hidden rounded-lg` media frame,
  - inside it: `<mux-video>`, a `div.progress absolute bottom-0 left-0 h-[3px]
    rounded-r bg-white` playhead, and a `<button>` (opens the fullscreen player),
  - meta row `div.mt-4 grid grid-cols-8`: `[01]` index in column 1,
    `col-span-7` holding client name then `p.text-muted-foreground mt-2 text-xs`
    title.
- Index format is bracketed and zero-padded: `[01]`… `[18]`.

## `/stories/[slug]` — Case study

- **Hero** `section.sticky top-0 h-dvh` — a poster **image** (not video) at
  `absolute inset-0 object-cover`, with a `bg-background/35 container grid
  place-items-center py-24` reading panel over it.
  - `max-w-prose` column: `h1` with the two-weight client/title lockup, a
    `space-y-4 text-justify hyphens-auto mt-12` description, and a **"Play
    Video"** button (`icon-[mingcute--play-fill]` + uppercase label) that opens
    the fullscreen player.
- **Transition** `div.to-background h-96 bg-linear-to-b from-transparent` — a
  384px gradient that dissolves the hero edge into the page background.
- **Split-text title** `p.h2` centred, absolutely positioned, built as
  per-word `div.overflow-hidden pr-[1em]` masks each containing **per-character
  divs** — i.e. a masked character reveal. Content: "(Behind the Scenes)".
- **Drag gallery** `section.relative h-dvh w-full cursor-grab overflow-hidden`
  containing `div.polka absolute will-change-transform` sized
  **`width: 500vw; height: 500vh; top: -200vh; left: -200vw`**, with
  `touch-action: none` and a `translate3d` transform — a throwable canvas
  roughly 5×5 viewports, centred on load.

## `/creators` — Talent index

- `main.pt-top-section relative container min-h-dvh`.
- ~24 stacked backdrop layers, each
  `-top-top-section absolute right-0 bottom-0 left-0 -z-1 brightness-80
  duration-200 max-md:hidden opacity-0` — one per creator, a **mix of videos
  and images**, crossfading on hover. Note `max-md:hidden`: the whole backdrop
  system is desktop-only.
- `section.flex justify-between gap-x-8 pb-16 max-md:flex-col md:flex-wrap
  md:items-center md:gap-y-4` — names flow inline and wrap on desktop, stack
  with `border-t` dividers on mobile.
- Each entry: `h2.text-display` name + a `size-10 rounded-full border` portrait.
- Hovering dims the siblings (`transition-opacity duration-150`).

## `/studio` — About & contact

**Entirely typographic. `main` contains ZERO images and ZERO videos** — all
eight images in the document are in the footer. Do not add photography here.

- `main.pt-top-section container` (256px top clearance, 16px gutters, no
  max-width — 1425px wide at a 1440px viewport).
- `section` with one large `h1.text-display text-pretty hyphens-auto` studio
  statement. ~465 characters, setting to **8 lines / 448px** at 1440×900. That
  opening proportion carries the page.
- `nav.shadow-base relative w-fit mt-16` — the **same pill tab component as the
  header**, 36px tall, six tabs: Contact, Address, Partners, Service, VP,
  Commitments. Right-edge `w-12` (48px) gradient fade over a horizontally
  scrollable strip (623px of content in a 358px track at 390px wide).
- `section.mt-8 pb-16` holding the selected panel: `h2.mb-6` (32px at desktop,
  24px at mobile) plus either rows or prose.

### The tabs are a CONTENT SWITCHER, not scroll-spy anchors

This is the easiest thing to get wrong, and it looks identical in a static
screenshot. **Only the selected panel exists in the DOM at a time**, and the
document height changes as you switch (measured 1699px on the shortest panel,
3586px on the longest). Building it as anchor links down one long page would
behave nothing like the reference.

- **Contact** is the only tabular panel: 8 rows of
  `div.grid border-b py-4 last:border-b-0 md:grid-cols-2 lg:grid-cols-4`
  (label / name / email / detail).
- **Every other panel** is a single `div.space-y-4 text-justify hyphens-auto`
  prose column: **16px/1.5 mono, uppercase, justified, `-0.05em`** — a larger,
  denser step than the 14px UI text. Justification only works with the
  hyphenation; keep both.

**The panel swap is instant.** Sampled across 24 consecutive frames during a
tab change, the content block held `opacity: 1` with no transform throughout.
The only animated element is the pill indicator, which slides *and resizes*
(measured 104px → 65px over ~350ms, ease-out) — i.e. a FLIP, which is what
Motion's `layoutId` produces.

---

## Global chrome

### Header (all routes)

`header.pt-container fixed top-0 right-0 left-0 z-50 flex justify-center
bg-linear-to-b from-background/10 to-transparent`

- A gradient wash, never a solid bar — no horizontal edge is ever drawn across
  the film.
- Inner: `container flex items-center justify-between lg:grid lg:grid-cols-6`.
- Desktop (`lg+`): a back button, the centred pill nav (`col-span-4 mx-auto`),
  and a right cluster of mute toggle + Instagram + LinkedIn icon buttons.
- Pill nav: `ul.relative flex w-fit items-center overflow-hidden overflow-x-auto
  rounded-full bg-white/10 backdrop-blur-lg` with an absolutely positioned
  `bg-white` indicator behind the active item.
- **Nav items are `<button>`s, not `<a>`s** in the reference (client-side
  transition control). We use real links instead — see `ARCHITECTURE.md`.
- Below `lg`: a home icon on the left; mute + a "Menu" button on the right.
- Mobile menu: `fixed inset-0 bg-background/15 backdrop-blur-xl origin-top
  opacity-0 lg:hidden` — scales from the top edge. Contains a `divide-y` link
  list and a marquee CTA to `/studio#contact` at the bottom.

### Footer (all routes)

`footer.bg-background pt-container z-1 w-full lg:fixed lg:bottom-0 lg:left-0`

- **`lg:fixed`** — a reveal footer. Page content scrolls up and off it; the
  footer does not get pushed down. Below `lg` it is a normal static block.
- Contents: a full-width wordmark image, an email pill, a
  `grid-cols-3 lg:grid-cols-6` link grid, a CTA block with an `opacity-0`
  `bg-foreground` hover-fill overlay, and a copyright / credit row
  (`py-8 max-sm:flex-col`).

### Fullscreen player (global overlay)

`div.bg-background fixed inset-0 z-999` containing the video and a bottom
control bar. Full spec in `video-system.md`.
