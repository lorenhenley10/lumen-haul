# Build Plan — Overview

## How to use this plan

You are one of several agents building this site in sequence. The
architecture is already decided and the shared systems are already built. Your
job is to execute one slice well and hand over a clean repository.

**Before you touch anything:**

1. Read `docs/ARCHITECTURE.md` end to end. It is the contract.
2. Read the audit doc relevant to your slice (`docs/audit/`).
3. Read your slice file in this directory, in full.
4. Run `npm run build` to confirm the repo is green *before* you start. If it
   isn't, fix that first and say so.

**While you work:**

- Reuse the primitives. `Reveal`, `SplitText`, `AutoVideo`, `MediaFrame`,
  `PageShell`, `TabNav` already exist and already handle reduced motion,
  cleanup, lazy loading and the reveal-footer trap. Writing a new one is almost
  always the wrong call.
- Never hardcode a colour, duration, easing, gutter, z-index or media path.
- Never nest a `<button>` inside an `<a>`.
- Add content to `src/content/`, never inline in a component.

**Before you hand off:** run the verification block at the bottom of your slice
file and confirm each item. Do not mark a slice done on a failing build.

## Status

| # | Slice | Status | Depends on |
|---|---|---|---|
| — | Foundation: tokens, motion, video, layout, home, stories, project page | **Done** | — |
| — | Home reel: pinned scroll sequence | **Done** | — |
| 01 | Creators index + detail | **Removed by request** | — |
| 02 | Studio page | **Done** | — |
| 03 | Home polish: parallax, hero exit, reel hover previews | To do | — |
| 04 | Page transitions | To do | — |
| 05 | Real media pipeline | To do | 03 |
| 06 | Performance & accessibility pass | To do | all |
| 07 | SEO, metadata, launch readiness | To do | all |

**Slice 01 (Creators) is removed, not deferred.** The route, its nav entry,
the footer link, and the placeholder content/plan files have all been deleted
by request. If a creators page is wanted later, it is a fresh build with no
scaffold to resume — there is nothing left to reference.

## What is already built

Working, verified, and not to be rewritten:

- **Design tokens** — `src/app/globals.css`. Colour, type (fluid display
  ramp), spacing, radii, shadow, motion, aspect ratios, named z-index scale.
- **Motion primitives** — `Reveal`, `SplitText`, `Parallax`, `ProgressiveBlur`.
  All reduced-motion aware, all auto-cleaning via `useGSAP({scope})`.
- **Video system** — `VideoProvider` (global mute + open film), `AutoVideo`
  (lazy attach, offscreen pause, poster floor, save-data), `MediaFrame`,
  `FullscreenPlayer` (focus trap, scroll lock, keyboard, scrubber, auto-hide).
- **Layout** — `SiteHeader` with `TabNav` (Motion `layoutId` indicator),
  `MobileMenu`, `SiteFooter` (reveal footer), `PageShell`.
- **Smooth scroll** — `LenisProvider`, wired to GSAP's ticker, disabled under
  reduced motion, resets scroll + refreshes ScrollTrigger per route.
- **Routes** — `/` (both desktop and mobile trees), `/stories`,
  `/stories/[slug]` (SSG), `/stills`, `/stills/[slug]` (SSG), `/about`
  (`/studio` redirects to it), `not-found`. There is no `/creators` — see
  Status above.
- **Stills** — the photography section. Index of eight sets, a set page with a
  full-bleed banner and a six-up contact sheet, and a viewer with a lightbox
  and a true-fullscreen state. Content lives in `src/content/stills.ts`, which
  documents how to swap a placeholder set for real frames. Half the slate is
  still stand-in imagery and is badged as such in development.
- **Home reel** — a pinned, scroll-driven sequence: 1.5 viewport heights per
  film, bubble fill scrubbed to scroll, timed crossfades, release after the
  last film. Measured against the reference; see `docs/audit/motion-system.md`
  §3 before touching it.
- **Content layer** — typed `Project`, `Creator`, `StudioSection`, `VideoAsset`,
  `ImageAsset`; placeholder factories; 18 projects; 9 creators.

## Known state and caveats

- **All media is placeholder.** Placeholder video assets carry an empty
  `sources` array, so only posters render and no requests are made. This is
  intended — see slice 05.
- **All copy is invented** for Lumen Haul and must be replaced by the studio.
  Do not copy the reference site's client names or text.
- **Fonts are substituted** (Inter Tight / JetBrains Mono) for licensed faces.
- **Brand assets are a square mark only.** The hero/footer wordmark is set as
  type, not placed as an image.
- There is no `/creators` route or nav entry. It was built once as a blank
  scaffold, then removed entirely by request — do not re-add it speculatively.

## Verification, every slice

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Then in a browser: 390, 768, 1024, 1440, plus one pass with
`prefers-reduced-motion: reduce`. Confirm no console errors and no horizontal
scrollbar at any width.
