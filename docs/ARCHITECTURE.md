# Architecture

**Read this before writing any code in this repository.** It records the
decisions that have already been made, and why. If you find yourself about to
make a foundational choice, it should already be answered here — if it isn't,
raise it rather than inventing one.

---

## 1. Stack

| Layer | Choice | Version | Why this and not the alternative |
|---|---|---|---|
| Framework | **Next.js, App Router** | 16.2 | Static export of every route; `generateStaticParams` for project/creator pages. There is no server data, no auth, no mutation — this site is a static asset with rich client behaviour |
| Language | **TypeScript** | 5.x | Typed media config is the whole point of `src/content` |
| Styling | **Tailwind CSS v4** | 4.x | CSS-first `@theme` tokens; no JS config file to drift from the CSS |
| Scroll choreography | **GSAP + ScrollTrigger** | 3.15 | The only mature answer for scrubbed, staggered, scroll-linked timelines with reliable cleanup |
| GSAP/React glue | **@gsap/react** | latest | `useGSAP({scope})` auto-reverts everything on unmount. This is what stops route changes leaking ScrollTriggers |
| UI state animation | **Motion for React** | 12.x | `layoutId` (nav indicator) and `AnimatePresence` (overlays). GSAP has no equivalent of either |
| Smooth scroll | **Lenis** | 1.3 | The reference's glide is a real part of its character. Wired to GSAP's ticker so there is one rAF loop |
| Video | **Native HTML5 `<video>`** | — | See §5 |
| Utilities | clsx + tailwind-merge | — | `cn()` only |

**Rejected:** a component library (this is a bespoke visual system — shadcn
tokens would fight it), Framer Motion's scroll utilities (overlaps GSAP with no
clear boundary), GSAP Draggable + Inertia (a 20-line hand-rolled momentum
loop is more readable and carries no plugin question), and Mux/HLS (see §5).

### The animation boundary — non-negotiable

Two animation systems coexist. Mixing them arbitrarily is how a codebase
becomes unmaintainable, so the split is by **category, not by preference**:

| Use | System |
|---|---|
| Anything tied to scroll position | **GSAP + ScrollTrigger** |
| Timeline choreography, staggers, text reveals | **GSAP** |
| Enter/exit of a mounting/unmounting element | **Motion `AnimatePresence`** |
| An element moving between two DOM positions | **Motion `layoutId`** |
| Hover, focus, active, colour, small opacity | **CSS transitions** |
| Continuous readouts (progress bars, scrubbers) | **Direct style writes**, no transition |

If a need doesn't fit a row, it is a design question, not an implementation
one. Ask.

---

## 2. Directory structure

```
src/
  app/                      Routes only. Thin — pages compose, they don't implement
    layout.tsx              Fonts, metadata, provider stack, header, player
    globals.css             ALL design tokens
    page.tsx                Home (bespoke shell)
    not-found.tsx
    stories/page.tsx        Index
    stories/[slug]/page.tsx Case study (SSG)
    creators/…              TO BUILD
    studio/…                TO BUILD
  components/
    layout/                 Header, footer, nav, mobile menu, PageShell
    media/                  VideoProvider, AutoVideo, MediaFrame, FullscreenPlayer
    motion/                 Reveal, SplitText, Parallax, ProgressiveBlur
    providers/              LenisProvider
    home/                   HomeHero, ReelDesktop, ReelMobile
    stories/                ProjectCard, ProjectHero, DragGallery
  content/                  ALL copy and media metadata. Typed
  lib/                      cn, gsap registration, motion tokens, hooks
public/
  brand/                    Logo assets
  media/placeholder/        Stand-in poster + still
docs/
  audit/                    What the reference does
  plan/                     What to build next, slice by slice
```

**Rules:**

- A route file composes components and passes content. It contains no layout
  primitives, no animation, no media paths.
- **No component may contain a literal media path.** Everything comes from
  `src/content`.
- **No component may contain a magic duration, easing, colour or gutter.**
  Everything comes from a token in `globals.css` or `lib/motion.ts`.
- Client components only where interactivity demands it. `MediaFrame`,
  `ProgressiveBlur`, `SiteFooter` and `PageShell` are deliberately server
  components.

---

## 3. Client/server boundary

Server by default. `"use client"` is required for, and limited to:

- anything using `useGSAP`, Motion, or a browser API,
- `SiteHeader` (pathname + mute state), `MobileMenu`,
- every component in `components/media/` except `MediaFrame`,
- `ReelDesktop`, `ReelMobile`, `HomeHero`, `ProjectCard`, `ProjectHero`,
  `DragGallery`.

Pages, `PageShell`, `SiteFooter`, `MediaFrame` and `ProgressiveBlur` stay on
the server.

### Provider stack (order is load-bearing)

```
<VideoProvider>          ← outermost: player needs it AND Lenis
  <LenisProvider>
    <SiteHeader />
    {children}
    <FullscreenPlayer /> ← mounted once, portalled to body
  </LenisProvider>
</VideoProvider>
```

`VideoProvider` must sit **outside** `LenisProvider` because the fullscreen
player stops Lenis when it opens and therefore needs both contexts in scope.

---

## 4. Design system

All tokens live in `src/app/globals.css` under `@theme`. Summary in
`docs/audit/visual-system.md`; the CSS is the source of truth.

Token groups: colour (neutral, chroma 0), typography (two families, four
steps, fluid display), spacing (`--spacing-container: 1rem`,
`--spacing-top-section: 16rem`), radii, shadow (exactly one), motion
(5 durations, 3 easings), aspect ratios, and a named z-index scale.

**Fonts are substituted.** Inter Tight and JetBrains Mono stand in for licensed
faces. Swap via `next/font/local` in `layout.tsx`, keeping the same CSS
variable names — nothing else names a family.

**Brand assets are a square mark only** (16667×16667 masters), with no wordmark
lockup. The full-bleed wordmark in the hero and footer is therefore **set as
type**, not placed as an image. If a real wordmark asset arrives, replace those
two type blocks.

Three masters ship: white on transparency, black on transparency, and a flat
JPEG. The white one is the site's — this interface is dark only — and
`node scripts/encode-brand.mjs` cuts it down into the page mark and the whole
favicon set. Nothing renders a master directly.

---

## 5. Video architecture

Full spec in `docs/audit/video-system.md`.

### Why native `<video>` and not Mux/HLS

The reference streams through Mux. We use native `<video>` because: there is no
Mux account or asset pipeline for this project; the studio's footage volume is
small enough that adaptive streaming is not yet load-bearing; and native video
keeps the build a pure static asset with no third-party runtime.

The abstraction is designed so this stays reversible. Every consumer talks to
`AutoVideo` and `VideoAsset`, never to a `<video>` tag. Adopting Mux later
means rewriting `AutoVideo`'s internals and the `VideoSource` type — roughly
one file — with no page changes.

### Components

| Component | Job |
|---|---|
| `VideoProvider` | Global mute flag + the single open fullscreen film |
| `AutoVideo` | Lazy source attachment, viewport play/pause, poster floor, reduced-motion and save-data suppression, progress reporting |
| `MediaFrame` | Aspect ratio, clipping, black backing, dev placeholder badge |
| `FullscreenPlayer` | The modal film player |

`AutoVideo`'s `active` prop overrides viewport detection — that is how the reel
plays exactly one of nine on-screen videos.

### Media config

`src/content/media.ts` exposes `video()` and `still()` factories. A placeholder
asset carries an **empty `sources` array**, so `AutoVideo` renders the poster
and issues no network request. Declared `duration` still drives reel pacing.

---

## 6. Motion architecture

Full catalogue in `docs/audit/motion-system.md`.

Primitives in `src/components/motion/`: `Reveal` (the house entrance —
reach for this first), `SplitText` (masked word/char reveal, split in JSX not
by DOM mutation), `Parallax` (scrubbed), `ProgressiveBlur` (pure CSS).

**Pinning:** two different mechanisms, for two different jobs.

- **CSS `position: sticky`** holds the home hero while the reel scrolls up over
  it, and holds project-page heroes. No scroll distance is consumed.
- **GSAP ScrollTrigger `pin`** drives the home reel, which *does* consume scroll:
  the section locks and each film is allotted `SEGMENT_VH` (1.5) viewport
  heights of scroll before the reel advances and, after the last film, releases.

**Reel progress is scroll-driven, not a timer.** `index = floor(progress × n)`
and `fill = fract(progress × n)`; the fill is written straight to the DOM each
frame rather than through React state, because routing a 60fps readout through
a re-render would re-render nine slides to move one bubble.

But the **crossfade and the rail pill are timed tweens**, not scrubbed — the
reference does the same, and it is what keeps a fast flick from smearing. See
`docs/audit/motion-system.md` §3.

**Reduced motion:** read `useReducedMotion()` *before* building a timeline and
skip it entirely. Always render the final state — never leave content at
`opacity: 0`.

**Cleanup:** all GSAP goes through `useGSAP({ scope })`. `LenisProvider`
refreshes ScrollTrigger and resets scroll on every pathname change.

---

## 7. The reveal footer (a known trap)

The footer is `lg:fixed` at the bottom on a layer *behind* the page. Content
scrolls up and off to uncover it. This only works if:

1. the scrolling content is **opaque** (`bg-background`), and
2. there is **scroll room** reserved after the content.

Miss either and the giant footer wordmark ghosts through the middle of your
page. This bug was hit and fixed during the foundation build.

**Therefore: use `<PageShell>` for every route except home.** It handles both.
Home has a bespoke shell because its desktop tree ends in the reel.

---

## 8. Routing, SEO, error states

- Static generation everywhere. `generateStaticParams` + `dynamicParams = false`
  on `/stories/[slug]`; same pattern for `/creators/[slug]`.
- Metadata: a title template in the root layout; per-route `generateMetadata`
  supplying title, description and an OG image (use the project's poster).
- `not-found.tsx` exists and is styled. Add `error.tsx` and `loading.tsx` per
  slice as needed.
- Every page needs `<main id="main">` — the skip link targets it. `PageShell`
  provides this.

---

## 9. Accessibility commitments

Not optional, and cheaper to keep than to retrofit:

- Skip link to `#main` in the root layout.
- Focus ring token (`--color-ring`), never removed.
- Split text carries the real string on `aria-label`; fragments `aria-hidden`.
- The fullscreen player is a real modal: `role="dialog"`, `aria-modal`, focus
  trap, focus restore, Escape.
- The scrubber is a real `role="slider"` with `aria-valuetext` and arrow keys.
- Hidden reel slides are `aria-hidden` with `tabIndex={-1}` so they are not
  reachable.
- Decorative media is `aria-hidden`; meaningful media carries real `alt`.
- **A `<button>` may never be nested inside an `<a>`.** Story cards are a
  container with two sibling interactive children, not a link wrapping a
  button.

---

## 10. Verification

Every slice must pass before handoff:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Then verify in a browser at 390 / 768 / 1024 / 1440, and once with
`prefers-reduced-motion: reduce`.
