# Lumen Haul

A film and photography studio site: full-bleed autoplaying video, scroll-driven
choreography, a fullscreen film player, and a distinct mobile interaction model.

Built as a structural recreation of the interaction design and motion
architecture at `letitrippictures.com`. **The structure is the reference; the
content is not.** All copy, project names and creator names in this repository
are invented placeholder material for Lumen Haul.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Documentation

| Document | What's in it |
|---|---|
| `AGENTS.md` | Start here if you're an agent. Ten rules, entry points |
| `docs/ARCHITECTURE.md` | Stack, boundaries, directory rules, the decisions already made |
| `docs/plan/00-OVERVIEW.md` | Build status and the slice queue |
| `docs/plan/01…07` | One executable slice per file |
| `docs/audit/routes.md` | Route inventory and page anatomy |
| `docs/audit/visual-system.md` | Colour, type, grid, layering |
| `docs/audit/motion-system.md` | Every animation, catalogued |
| `docs/audit/video-system.md` | Playback policy and player spec |
| `docs/audit/responsive.md` | Breakpoint behaviour, test matrix |

## Stack

Next.js 16 (App Router, static) · React 19 · TypeScript · Tailwind v4 ·
GSAP + ScrollTrigger · Motion · Lenis · native HTML5 video.

The animation boundary is deliberate: GSAP owns anything tied to scroll
position, Motion owns mount/unmount and layout transitions, CSS owns hover and
small state changes. See `docs/ARCHITECTURE.md` §1.

## Project layout

```
src/app/          Routes. Thin — pages compose, they don't implement
src/components/   layout · media · motion · providers · home · stories
src/content/      All copy and typed media metadata
src/lib/          cn, GSAP registration, motion tokens, hooks
public/brand/     Logo assets
public/media/     Placeholder poster + still
docs/             Audit, architecture, build plan
```

## Current state

**Built and verified:** design tokens, motion primitives, the video system and
fullscreen player, header/footer/nav/mobile menu, `/`, `/stories`,
`/stories/[slug]` (18 SSG pages), and a 404.

**Not built yet:** `/creators` and `/studio` — both are linked from the
navigation and currently 404. They are slices 01 and 02.

**Placeholder by design:**

- **Media.** No footage exists yet. Placeholder video assets carry an empty
  `sources` array, so `AutoVideo` renders the poster and issues no network
  request — better than 404ing on a missing file. A dev-only badge marks them.
  Swapping in real media is a config change in `src/content/media.ts` with no
  component changes.
- **Copy.** Every project, creator and studio string is invented and marked
  `PLACEHOLDER CONTENT`.
- **Fonts.** Inter Tight and JetBrains Mono stand in for licensed faces. Swap
  via `next/font/local` in `layout.tsx`, keeping the CSS variable names.
- **Brand.** The supplied assets are a square mark only (4167×4167) with no
  wordmark lockup, so the full-bleed wordmark is set as type rather than placed
  as an image.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Then check 390 / 768 / 1024 / 1440 and one pass with
`prefers-reduced-motion: reduce`.
