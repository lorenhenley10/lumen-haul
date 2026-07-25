# Reference Audit — Motion System

Every meaningful animation observed on the reference, with the implementation
method we have chosen for each. Durations marked ≈ are estimated from CSS
transition values and observed feel; exact GSAP timeline values are not
readable from the compiled bundle.

**House easing:** a fast-out / long-settle curve. Our tokens:
`--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` for entrances,
`--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1)` for things that move and
stop, `--ease-out-quad` for small hover changes.

---

## Animation categories

Every animation on the site falls into one of these. **Implementation agents
must not invent a category.** If a design need doesn't fit one, raise it rather
than writing a bespoke timeline.

| Category | Owner | Primitive |
|---|---|---|
| Page entrance | GSAP | `Reveal immediate` / hero timeline |
| Scroll reveal | GSAP + ScrollTrigger | `<Reveal>` |
| Text / mask reveal | GSAP | `<SplitText>` |
| Parallax | GSAP (scrubbed) | `<Parallax>` |
| Media crossfade | CSS transition | `opacity` + duration token |
| Pinned sequence | GSAP ScrollTrigger `pin` | see §3 |
| Nav indicator | Motion `layoutId` | `<TabNav>` |
| Overlay / menu | Motion `AnimatePresence` | `<MobileMenu>`, player |
| Hover preview | CSS + React state | `<ProjectCard>` |
| Cursor drag | Hand-rolled rAF | `<DragGallery>` |
| Button micro-interaction | CSS transition | utility classes |

> **Pinning note — CORRECTED.** An earlier revision of this document claimed
> the home reel's pin distance was ~0px and recommended CSS `sticky`. **That was
> wrong**, and the measurement error is worth recording so nobody repeats it:
> the reference was measured with the browser pane hidden, which suspends
> autoplay and rAF. The page never initialised, so ScrollTrigger had not yet
> sized the pin and the spacer read as its unpinned height.
>
> Re-measured with the pane visible, the reference's pin-spacer is **13050px
> tall with 12150px of `padding-bottom`** against a 900px section — 13.5
> viewports of pin distance. The reel is a genuine scroll-driven pinned
> sequence. See §3.
>
> **Lesson: never measure scroll or media behaviour in a hidden/backgrounded
> pane.** Confirm the page is live (videos playing, rAF running) first.

---

## Catalogue

### 1. Hero entrance — `/`

| | |
|---|---|
| Elements | Wordmark, tagline, scroll caption |
| Trigger | Mount (above the fold — a scroll trigger would never fire) |
| Initial | Wordmark `yPercent: 110` inside an `overflow-hidden` mask; tagline `y: 16, autoAlpha: 0`; caption `autoAlpha: 0` |
| Final | All at rest |
| Duration | 1.2s wordmark, 0.6s others |
| Stagger | Overlapping: tagline at `-=0.7`, caption at `-=0.5` |
| Easing | `expo.out` |
| Scrubbed / pinned | No / No |
| Mobile | Same, minus the progressive blur and scroll caption |
| Reduced motion | Skipped entirely; renders at rest |
| Implementation | GSAP timeline in `HomeHero` |

**Gotcha, already hit and fixed:** the wordmark is set at `leading-[0.82]`, so
its glyphs overflow their line box and an `overflow-hidden` mask shears the cap
tops off. The animated element needs em-based vertical padding to contain the
glyphs — see the comment in `home-hero.tsx`.

### 2. Hero → reel handoff — `/`

| | |
|---|---|
| Elements | Hero section, reel section |
| Trigger | Scroll |
| Behaviour | Hero is `sticky top-0 h-dvh`; the opaque reel section scrolls up over it |
| Duration | Scroll-linked |
| Scrubbed | Yes (native) |
| Mobile | Replaced by scroll-snap; no sticky handoff |
| Reduced motion | Unchanged — this is layout, not decoration |
| Implementation | CSS `position: sticky` |

### 3. Reel — pinned scroll sequence — `/` desktop

The centrepiece interaction. Measured precisely from the live reference.

| | |
|---|---|
| Elements | Pinned section, 9 stacked slides, index rail |
| Trigger | Scroll. Pin starts when the section's top hits the viewport top |
| Pin start | `y = 900` at a 900px viewport — i.e. immediately after the sticky hero |
| Distance per film | **1350px = 1.5 viewport heights** |
| Total pin distance | 9 × 1350 = **12150px** (= the spacer's `padding-bottom`) |
| Pin spacer height | 900 (section) + 12150 = **13050px** |
| Release | After the 9th film completes; section returns to normal flow |
| Mobile | **No pin at all** — replaced by scroll-snap (see #4) |
| Reduced motion | No pin, no hijack; rail buttons switch films |
| Implementation | `ScrollTrigger.create({ pin: true })` in `ReelDesktop` |

**Two clocks, deliberately separate.** This is the detail that distinguishes it
from a scrubbed carousel:

1. **Scrubbed (scroll-linked):** the active index and the bubble fill.
   `index = floor(progress × 9)`, `fill = fract(progress × 9)`, written straight
   to the DOM with no transition.
2. **Timed (fixed duration):** the crossfade between films, and the rail pill's
   travel. Verified by sampling the reference at a *stationary* scroll position,
   where the outgoing film faded `0.91 → 0` over ~0.5s while `scrollY` never
   moved. Reference CSS carries `transition-duration: 0s` on every one of these
   elements — the tweens are GSAP's, not CSS's.

Scrubbing the crossfade would turn a fast flick into a smear of half-dissolved
frames. Timing it means every transition resolves cleanly at any scroll speed.

**Crossfade direction matters:** the incoming film snaps to full opacity
*underneath*, and the outgoing film fades out *on top* of it. That is why there
is never a dip to background between two films.

Verification of our build against the model, at 1440×900 (actual vs. expected
`fill`): y=1000 → 0.074/0.074 · y=2000 → 0.815/0.815 · y=3010 → 0.563/0.563 ·
y=4070 → 0.348/0.348 · y=12701 → 0.741/0.741. Release confirmed at y=13680,
where the section's `position` returns to `relative`.

### 4. Reel scroll-snap — `/` mobile

| | |
|---|---|
| Elements | Title panels + a fixed film layer behind them |
| Trigger | User scroll within a `fixed` snap container |
| Behaviour | Titles snap; the film layer crossfades to match the snapped panel |
| Duration | 0.35s crossfade (`--duration-base`) |
| Scrubbed | Snap-quantised |
| Reduced motion | Snap retained (it is navigation); crossfade shortened by the global CSS rule |
| Implementation | CSS scroll-snap + `IntersectionObserver`, `ReelMobile` |

### 5. Index rail — `/` desktop

Three separate animations on one control:

- **Active pill position** — `translateY(index × 100%)` = 36px per step, tweened
  over 500ms `ease-out` (timed, not scrubbed).
- **Progress fill** — `scaleY` from `transform-origin: 18px 0px` (top-centre),
  so it **fills downward**. Driven per-frame from scroll progress and
  deliberately *not* transitioned — it is a continuous readout, and any
  transition would make it lag the scrollbar.
- **Rail auto-scroll** — `scrollTo({behavior:'smooth'})` keeps the active
  numeral in view when the list exceeds 5.5 items.

Measured geometry: rail `36px` wide, offset `16px` from the right edge
(`--spacing-container`), items `36×36`, `max-height: 198px` (5.5 items).

**Fill styling:** the reference stacks a `white/15` fill inside a `white/15`
pill, over a `white/10` rail. The filled portion therefore reads as roughly
double the unfilled — on the near-black background this presents as a dark grey
column rising through the bubble. Clicking a numeral scrolls to that film's
segment start.

Numerals use `mix-blend-difference` so they stay legible against both the pill
and the film.

### 6. Nav indicator — header & `/studio`

| | |
|---|---|
| Element | White pill behind the active tab |
| Trigger | Route change / tab selection |
| Duration | 0.35s |
| Easing | `in-out-quart` |
| Implementation | **Motion `layoutId`** |

Chosen over measure-and-translate because Motion's FLIP handles font loading,
window resize and horizontal scrolling of the strip — all of which break the
manual approach. The reference's own indicator is a measured absolute div.

### 7. Scroll reveals — `/stories`, `/studio`, project pages

| | |
|---|---|
| Initial | `y: 24, autoAlpha: 0` |
| Final | At rest |
| Duration | 0.6s |
| Easing | `expo.out` |
| Trigger | ScrollTrigger `top 85%` |
| Repeat | No — fires once |
| Implementation | `<Reveal>` |

Grid stagger comes from each card crossing **its own** trigger point, not from
an index-based delay, so a reflowed grid never animates out of order.

### 8. Split-text reveal — project pages

| | |
|---|---|
| Element | "(Behind the Scenes)" and equivalents |
| Structure | Per-word `overflow-hidden` mask → per-character spans |
| Initial → final | `yPercent: 110` → `0` |
| Duration | 0.8s |
| Stagger | 0.025s per char, 0.06s per word |
| Easing | `expo.out` |
| Implementation | `<SplitText>` |

Split happens **in JSX, not by DOM mutation after mount** — identical server and
client markup, no flash of unsplit text. Real string on `aria-label`, fragments
`aria-hidden`.

### 9. Card hover preview — `/stories`

| | |
|---|---|
| Trigger | `mouseenter` — **gated on `(hover: hover)`**, not a width query |
| Behaviour | Preview plays, 3px white playhead fades in, frame scales `1.01`, play button fades in |
| Duration | 0.2s controls, 0.6s scale |
| Touch | Falls back to viewport-gated playback; no hover state |
| Implementation | React state + CSS, `<ProjectCard>` |

### 10. Creator backdrop crossfade — `/creators`

| | |
|---|---|
| Trigger | Hover on a name |
| Behaviour | That creator's full-bleed backdrop fades `0 → 1`; sibling names dim |
| Duration | 0.2s / 0.15s dim |
| Mobile | **Disabled entirely** (`max-md:hidden` on all backdrop layers) |
| Implementation | React state + CSS opacity |

### 11. Fullscreen player open / close

| | |
|---|---|
| Initial | `opacity: 0, scale: 1.04` |
| Final | `opacity: 1, scale: 1` |
| Exit | `opacity: 0, scale: 1.02` |
| Duration | 0.6s |
| Easing | `expo.out` |
| Side effects | Lenis stopped, `body` overflow locked, focus trapped, focus restored on close |
| Implementation | Motion `AnimatePresence` + portal |

### 12. Player control auto-hide

Controls fade out after **2500ms** idle, return on any pointer or key input,
and **never hide while paused** — a still frame with no affordances reads as a
crash.

### 13. Mobile menu

| | |
|---|---|
| Initial | `opacity: 0, scaleY: 0.92`, `origin-top` |
| Final | `opacity: 1, scaleY: 1` |
| Duration | 0.35s, `in-out-quart` |
| Items | Stagger `y: 16 → 0`, 0.08s apart |
| Implementation | Motion `AnimatePresence` |

### 14. Drag gallery

| | |
|---|---|
| Trigger | Pointer drag on a 300vw × 300vh canvas |
| Physics | Hand-rolled momentum, friction 0.92, rAF loop that exits below 0.05px/frame |
| Touch | `touch-action: none` — mandatory, or the browser claims the gesture |
| Reduced motion | Degrades to a plain scrollable grid; all content still reachable |
| Implementation | `<DragGallery>` |

Hand-rolled rather than GSAP Draggable + Inertia: ~20 lines, no plugin
availability question, and readable by whoever maintains it next.

### 15. Button / link micro-interactions

`transition-opacity` to `0.6` opacity, or `bg-white/10 → bg-white/20`, at
`--duration-fast` (0.2s). Pure CSS. No JS, no library.

---

## Reduced motion

Two layers, both required:

1. **CSS** — a global `@media (prefers-reduced-motion: reduce)` block collapses
   all durations to 0.01ms.
2. **JS** — `useReducedMotion()` is read *before building any timeline*, and
   the timeline is skipped entirely.

The rule that matters: **when motion is suppressed, render the final state.**
Never leave an element stuck at `opacity: 0`. Every primitive in
`src/components/motion/` already does this; bespoke animations must too.

Additionally under reduced motion: Lenis does not initialise at all (hijacking
the scrollbar is itself the problem), reel auto-advance stops, and video holds
at its poster.

## Cleanup

All GSAP work goes through `useGSAP({ scope })` from `@gsap/react`, which
reverts everything created in that scope on unmount — including ScrollTriggers.
This is why route changes do not leak triggers. `LenisProvider` additionally
calls `ScrollTrigger.refresh()` and resets scroll on every pathname change.
