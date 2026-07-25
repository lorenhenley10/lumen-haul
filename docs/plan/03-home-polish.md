# Slice 03 — Home polish

**Goal:** close the gap between "the home page works" and "the home page feels
expensive." The structure is built; this slice adds the choreography that makes
it read as authored.

**Reference:** `docs/audit/motion-system.md` §§ 1, 2, 3, 5.

**Depends on:** nothing. Independent of 01 and 02.

---

## What to add

### 1. Hero exit choreography

Today the reel simply scrolls up over a static sticky hero. Add a scrubbed
ScrollTrigger on the hero so it recedes as the reel arrives:

- Hero media scales `1 → 1.08` and drops to ~60% opacity across the handoff.
- The wordmark and tagline drift up slightly and fade.
- `scrub: true`, trigger the hero, `start: "top top"`, `end: "bottom top"`.

Keep it subtle. The purpose is depth, not spectacle — if the hero is visibly
"animating" rather than receding, it's too much.

### 2. Reel hover previews on the index rail

The reference's rail buttons each contain a hover preview layer
(`opacity-0 group-hover:opacity-100`). Add a small poster thumbnail that fades
in on hover over each numeral, so scrubbing the rail previews destinations.

Use the project's `loop.poster` — a still, not a playing video. Nine playing
previews in a 36px rail would be indefensible.

### 3. Parallax on the reel titles

Wrap reel slide titles in `<Parallax amount={0.08} direction={-1}>` so they
drift against the footage. Small values only; past ~0.15 it reads as a glitch.

### 4. ~~Reel pause affordances~~ — NO LONGER APPLICABLE

This item described pausing an auto-advance timer. **The reel no longer has
one.** It is a scroll-driven pinned sequence (`ScrollTrigger` pin, 1.5 viewport
heights per film), so the visitor already controls pacing completely — there is
nothing to pause, and nothing runs while the section is offscreen.

Do not reintroduce a timer. See `docs/audit/motion-system.md` §3.

### 5. Mobile hero scroll cue

The mobile hero has no affordance indicating there is more below. Add a
subtle animated cue (a short repeating drift, respecting reduced motion) that
disappears once the user has scrolled past the first panel.

---

## Rules specific to this slice

- Use `<Parallax>`; do not write a new scrubbed trigger.
- The reel clock must remain **wall-clock driven** — do not switch it to the
  video `ended` event. See `docs/audit/motion-system.md` § 3 for why.
- Everything added here must be skipped under reduced motion, with the final
  state rendered.
- Do not add a scroll-progress indicator, a custom cursor, or a preloader.
  None of those are in the reference and each is a common way to make a site
  like this feel generic.

---

## Acceptance criteria

- [ ] Hero recedes smoothly as the reel arrives; no jump at the handoff.
- [ ] Scrubbed animation tracks the scrollbar exactly — no lag or overshoot
      when scrolling fast (this is what `lagSmoothing(0)` protects).
- [ ] Rail hover shows a poster thumbnail; no additional video plays.
- [ ] Reel pauses on hover and resumes from where it stopped.
- [ ] Reel clock stops when the section is scrolled offscreen.
- [ ] Mobile scroll cue appears on the hero and retires after the first panel.
- [ ] Reduced motion: no scrub, no drift, no cue animation; everything visible.
- [ ] No console errors; no ScrollTrigger warnings about missing elements.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Scroll the home page top to bottom and back up at 1440 and 390. Then navigate
away and back twice and confirm no duplicate ScrollTriggers accumulate
(`ScrollTrigger.getAll().length` should be stable).

## Handoff notes

Report the stable ScrollTrigger count for the home route, and whether the
scrubbed hero holds up on a low-end device.
