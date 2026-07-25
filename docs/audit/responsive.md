# Reference Audit — Responsive Behaviour

Inspected at 390×844, 768, 1024, 1280×720 and 1440×900.

> **The headline finding: the mobile home page is not a narrow desktop home
> page.** It is a different component tree with a different interaction model.
> Any agent who tries to make one responsive tree serve both will produce
> something that works at neither end. This is the single most important
> structural fact in the whole audit.

---

## The two breakpoints that matter

| Breakpoint | Width | Responsibility |
|---|---|---|
| `md` | 768px | **Content architecture.** Home tree swaps; stories grid 1→2 columns; creator backdrops enable |
| `lg` | 1024px | **Chrome.** Header pill nav appears, mobile menu retires, footer becomes `fixed` |

These do different jobs, which creates a band between 768px and 1024px where
you get the **desktop content tree with mobile chrome**. Test that band
explicitly — it is where regressions hide.

---

## Home — the architectural split

| | Desktop (≥ md) | Mobile (< md) |
|---|---|---|
| Scroll owner | The window (Lenis-smoothed) | A `fixed inset-0` snap container |
| Hero | `sticky top-0 h-dvh` | `h-svh snap-start` panel |
| Reel transport | **Auto-advance on a timer** | **User scroll** |
| Reel visual | 9 slides crossfading in one frame | Titles snap past a *fixed* film layer |
| Film layer | Inside each slide | Separate, `position: fixed`, `-z-1` |
| Index rail | Yes — right edge, doubles as playhead | None |
| Progressive blur | Yes | No |
| "Scroll to explore" | Yes | No |
| Footer | Revealed from behind (`fixed`) | Final snap panel (`static`) |
| Viewport unit | `dvh` | `svh` |

The inversion is the point: on desktop the user watches, on mobile the user
drives. A timer that advances while a thumb is mid-swipe would feel broken, so
mobile has no timer at all.

`svh` rather than `dvh` on mobile is deliberate — `dvh` changes as browser
chrome collapses, which shifts scroll-snap points mid-gesture.

### How we render both without cost

Both trees are rendered and one is hidden with a CSS breakpoint
(`max-md:hidden` / `md:hidden`), **not** a JS media query. This keeps server
and client markup identical — no hydration mismatch, no first-paint flash of
the wrong layout.

A `display: none` subtree never intersects the viewport, so `AutoVideo` never
attaches its sources. **The hidden branch costs markup, not bandwidth.**

---

## Per-surface behaviour

### Header

| Width | Behaviour |
|---|---|
| < 1024 | Wordmark link left; mute + "Menu" right. Full-screen menu overlay |
| ≥ 1024 | 6-column grid: wordmark, centred pill nav (`col-span-4`), icon cluster right |

Never a solid bar at any width — always the gradient wash.

### Stories grid

| Width | Columns |
|---|---|
| < 768 | 1 |
| 768–1279 | 2 |
| ≥ 1280 | 3 |

`gap-x-4 gap-y-16` throughout — rows breathe, columns nearly touch. Cards keep
their `16/9` ratio at every width; nothing reflows inside a card.

Hover preview is gated on `(hover: hover)`, **not on width**. A touch laptop at
1440px and a phone at 390px are both "no hover" in the ways that matter here.

### Project page

| Width | Behaviour |
|---|---|
| All | Sticky hero, reading panel, gradient dissolve, split-text, drag gallery |
| < 1024 | Footer static; no reveal spacer |
| Drag gallery | Same canvas; `touch-action: none` makes the gesture work on touch |

The reading panel is `max-w-prose` at every width — it does not widen on large
displays. Long-form copy stays at a readable measure even though the page
itself is full-bleed.

### Creators

| Width | Behaviour |
|---|---|
| < 768 | Names stack, `border-t` dividers, `py-3`. **Backdrops disabled entirely** |
| ≥ 768 | Names flow inline and wrap (`flex-wrap`), backdrops crossfade on hover |

This is a genuine feature removal, not a style change — there is no hover on
touch, so the entire backdrop layer is `max-md:hidden` and never loads.

### Studio

| Width | Behaviour |
|---|---|
| All | Tab strip scrolls horizontally with a right-edge gradient fade |
| < 768 | Rows stack |
| 768–1023 | Rows `grid-cols-2` |
| ≥ 1024 | Rows `grid-cols-4` |

### Footer

| Width | Behaviour |
|---|---|
| < 640 | Meta row stacks (`max-sm:flex-col`) |
| < 1024 | `position: static`, normal block flow |
| ≥ 1024 | `position: fixed` bottom, revealed as content scrolls off it |
| Links | `grid-cols-3` → `lg:grid-cols-6` |

The fixed reveal requires page content to be opaque and to reserve scroll room
below it. Both are handled by `PageShell` so no page has to remember.

### Fullscreen player

| Width | Behaviour |
|---|---|
| < 1024 | Film title shown above scrubber; play + time full-width; mute/fullscreen hidden |
| ≥ 1024 | No title; play + time left, mute + fullscreen right; `px-8` inset |

---

## Gutters and type

The page gutter is **`1rem` at every breakpoint** — it does not grow with the
viewport, and there is no container max-width. Wide displays get more image,
not more margin.

Display type is the only fluid step: 32px at ≤640px rising to 56px at ≥1280px.
Everything else (14px UI, 12px caption) is fixed at all widths — the mono UI
text never scales.

---

## Test matrix

Verify every slice at these widths before handing off:

| Width | What to confirm |
|---|---|
| 390 | Mobile home tree only; snap works; no horizontal scroll; footer is the last panel |
| 430 | As above; no text clipping in the two-weight lockup |
| 768 | **Desktop content tree + mobile chrome.** Stories at 2 columns |
| 1024 | Pill nav appears; footer becomes fixed; reveal spacer engages |
| 1280 | Stories at 3 columns; display type at its 56px cap |
| 1440 | Gutters still 16px; no max-width kicks in |

Also verify, at any width: `prefers-reduced-motion: reduce` renders all content
in its final state with nothing stuck invisible.
