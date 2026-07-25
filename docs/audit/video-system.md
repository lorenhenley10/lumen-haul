# Reference Audit — Video System

Video is the site's primary content. Getting playback policy right is the
difference between a site that feels expensive and one that stalls a laptop.

The reference streams everything through Mux (`<mux-video>` web components,
`min-resolution=720p max-resolution=1440p`, HLS, poster frames served from
`image.mux.com`). **We use native HTML5 `<video>` instead** — see
`ARCHITECTURE.md` for the reasoning and the migration path back to a streaming
provider if the studio adopts one.

---

## Placement inventory

| Placement | Route | Autoplay | Loop | Muted | Poster | Ratio | Crop | Notes |
|---|---|---|---|---|---|---|---|---|
| Hero background | `/` | Yes | Yes | Yes* | Yes | Full-bleed `h-dvh` | `object-cover` | `brightness-80` + `bg-black/20` scrim |
| Reel slide | `/` desktop | Active slide only | Yes | Yes | Yes | Full-bleed | `object-cover` | 9 stacked; only the visible one loads |
| Reel film layer | `/` mobile | Snapped panel only | Yes | Yes | Yes | Full-bleed `h-svh` | `object-cover` | Fixed behind snapping titles |
| Card preview | `/stories` | On hover (desktop) | Yes | Yes | Yes | `16/9` | `object-cover` | 3px playhead overlay |
| Creator backdrop | `/creators` | On hover | Yes | Yes | Yes | Full-bleed | `object-cover` | Desktop only; some entries are stills |
| Project hero | `/stories/[slug]` | **No — still image** | — | — | — | Full-bleed | `object-cover` | Deliberately a held frame |
| Fullscreen film | Global overlay | Yes on open | No | Starts muted | Yes | `object-contain` | Letterboxed | The only audible video |

\* The hero is the one ambient video wired to the global audio toggle.

**Key observation:** the project page hero is a *still*, not a playing film.
The film is something the visitor chooses to start. That restraint is what
makes the "Play film" button a real action rather than a redundant one — keep
it.

---

## Playback policy

These rules are implemented once in `AutoVideo` and must not be re-litigated
per component.

### Lazy source attachment

`src` is **not attached** until the element is within one viewport of the fold
(`IntersectionObserver`, `rootMargin: "100% 0px"`). An unattached `<video>`
costs nothing; twenty attached ones cost twenty connections. Confirmed in the
reference: all nine reel videos sat with no `playback-id` and only a `poster`
until their slide became active.

### Offscreen pause

A second observer at `threshold: 0.25` pauses video that scrolls out of view.
`visibilitychange` pauses everything when the tab is backgrounded — a
backgrounded tab keeps decoding otherwise.

**This was verified accidentally during the audit:** with the browser pane
hidden, the reference's reel stalled completely and no video loaded, which is
exactly the correct behaviour.

### Simultaneous playback

At most **one** full-bleed video plays at a time on the home page. On
`/stories`, at most one preview plays (hover-gated on pointer devices;
viewport-gated on touch). The reference never plays 18 cards at once, and
neither do we.

### Controlled vs. automatic

`AutoVideo`'s `active` prop **overrides** viewport detection. The home reel
uses it so that only the current slide plays even though all nine are
technically on screen. Passing `undefined` hands control back to the observer.

### Poster as floor

The poster is always rendered *underneath* the video element and is never
removed. It covers: initial load, buffering, decode, autoplay rejection,
network error, reduced-motion suppression and save-data suppression. A video
that fails for any reason still renders as a designed frame, never a black box.

Autoplay rejection is caught and ignored — it is an expected outcome of browser
policy or low-power mode, not an error state.

### Reduced motion & save-data

Both hold at the poster and **never fetch**. `useSaveData()` reads
`navigator.connection.saveData`.

### Mobile media

`VideoAsset` carries an optional `mobileSources` for a lighter or reframed
encode. When absent, the desktop sources are used at every width. The reference
serves one adaptive stream and lets Mux pick the rendition; our equivalent is
this field plus, eventually, HLS.

---

## Placeholder pipeline

No real footage exists yet, and no `ffmpeg` was available to synthesise a
stand-in clip. The chosen behaviour:

**A placeholder `VideoAsset` carries an empty `sources` array.** `AutoVideo`
skips rendering the `<video>` element entirely, so the poster *is* the whole
component and **zero network requests are issued**. This is strictly better
than pointing at a missing file and eating a 404 per tile.

- Posters: `/public/media/placeholder/poster.svg` (16:9, framed, labelled).
- Stills: `/public/media/placeholder/still.svg`.
- `placeholder: true` renders a dev-only "Placeholder" badge via `MediaFrame`,
  so stand-in media cannot silently reach production.
- `duration` is still declared on placeholder assets — it drives reel pacing
  and progress UI, so the sequence runs correctly with no files present.

**To swap in real media:** edit `src/content/media.ts` and the project/creator
config. Pass `src` and `poster`; the `placeholder` flag clears itself. No
component changes, anywhere.

---

## Fullscreen player specification

Measured from the reference overlay, reproduced in
`src/components/media/fullscreen-player.tsx`.

**Shell:** `fixed inset-0 z-999 bg-background`, video at `object-contain`.

**Control bar:** `absolute bottom-0 inset-x-0`, gradient
`from-transparent to-background/50`, `pb-8`, `lg:px-8`. Auto-hides after 2.5s
idle.

**Controls are words, not icons** — `PLAY` / `PAUSE`, `UNMUTE` / `MUTE`,
`FULLSCREEN`, at `text-xs uppercase`. This reads as a cutting-room monitor and
sidesteps icon legibility over moving footage entirely. Keep it.

Layout:
- Mobile only: the film title, `text-display`, above the scrubber.
- Scrubber: `h-0.5 bg-white/25` track with an `origin-left` white fill
  (`scaleX`), inside a `py-3` hit area.
- Left group: play/pause button, then `00:00 / 00:30` elapsed/duration.
- Right group (`max-lg:hidden`): mute toggle, native fullscreen.

**Behaviour we implement beyond the reference's observable surface:**

| Requirement | Implementation |
|---|---|
| Animated open/close | Motion `AnimatePresence`, scale 1.04 → 1 |
| Escape to close | `keydown` handler |
| Focus trap | Tab/Shift-Tab cycle within the dialog |
| Focus restore | Previously focused element refocused on close |
| Scroll lock | `body.overflow: hidden` **and** `lenis.stop()` — both needed |
| Keyboard | Space/K play-pause, ←/→ seek 5s, M mute, F fullscreen, Esc close |
| Scrub by drag | Pointer capture with `pointermove` / `pointerup` |
| Loading indicator | Spinner on `waiting`, cleared on `playing` / `canplay` |
| Accessibility | `role="dialog"`, `aria-modal`, labelled; scrubber is a real `role="slider"` with `aria-valuetext` |
| Mobile | Title shown, mute/fullscreen hidden, controls full-width |

**Audio policy:** the site starts muted (browsers require it for autoplay) and
the header toggle flips one global flag every player reads. Closing the
fullscreen player **re-mutes the site**, so ambient loops don't start speaking
over the page the visitor returns to.
