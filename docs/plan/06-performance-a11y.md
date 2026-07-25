# Slice 06 — Performance & accessibility pass

**Goal:** a full sweep across every route. This is an audit-and-fix slice, not
a feature slice — you are not adding surfaces, you are making the existing ones
hold up.

**Depends on:** all previous slices.

---

## Performance

### Media (the dominant cost on this site)

- [ ] Confirm `AutoVideo`'s lazy attachment is actually working: on `/stories`,
      no video source should be attached until it is within one viewport.
- [ ] Confirm offscreen pause fires — scroll past a playing video and check
      `paused === true`.
- [ ] Confirm the hidden home branch (desktop tree on mobile, or vice versa)
      loads **no** media.
- [ ] Confirm tab-backgrounding pauses everything.
- [ ] `next/image` `sizes` set wherever an image renders responsively.
- [ ] Only the hero uses `priority`. Nothing else should preload.

### JavaScript

- [ ] Check the bundle: `npm run build` and review per-route First Load JS.
- [ ] Verify GSAP and Motion are not both pulled into routes that need neither.
- [ ] Confirm server components stayed server components — `MediaFrame`,
      `ProgressiveBlur`, `SiteFooter`, `PageShell`, and all page files.

### Rendering

- [ ] No layout shift: every media box reserves space via `MediaFrame`. Measure
      CLS, target < 0.1.
- [ ] `will-change` only on elements actually being transformed. It is a real
      cost when over-applied — audit `Parallax` and `DragGallery`.
- [ ] Scrubbed animations track the scrollbar with no lag when scrolling fast.
- [ ] The progressive blur stack is the most expensive thing on the hero.
      Profile it; reduce layer count if it costs frames on a low-end device.

### Targets

| Metric | Target |
|---|---|
| LCP (`/`, throttled Fast 3G) | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| First Load JS per route | < 200KB |

---

## Accessibility

### Keyboard

- [ ] Tab through every route; focus order is logical and never trapped
      (except deliberately, in the player).
- [ ] Focus ring visible on every interactive element, against both dark
      backgrounds and light footage.
- [ ] Skip link works and lands on `#main`.
- [ ] Fullscreen player: Escape closes, Tab cycles within, focus returns to the
      trigger on close.
- [ ] Player scrubber operable by arrow keys.
- [ ] Mobile menu: Escape closes, focus is managed.
- [ ] Hidden reel slides are not tabbable (`tabIndex={-1}`, `aria-hidden`).

### Screen reader

- [ ] Every route has exactly one `h1`.
- [ ] Heading order doesn't skip levels.
- [ ] `SplitText` announces the whole string, not individual characters.
- [ ] Decorative media is `aria-hidden`; meaningful media has real `alt`.
- [ ] Icon-only buttons have `aria-label` (header mute, socials, player close).
- [ ] The nav's active item exposes `aria-current`.
- [ ] The player announces as a modal dialog with a name.

### Motion & contrast

- [ ] Full pass with `prefers-reduced-motion: reduce`: no element left at
      `opacity: 0`, no parallax, no auto-advance, Lenis not initialised, drag
      gallery falls back to a grid.
- [ ] Text contrast ≥ 4.5:1 against its background — **including text over
      footage**. This is the likely failure. Check the reel titles and hero
      tagline against the brightest frame of each video, and strengthen the
      scrim rather than the type if it fails.
- [ ] `muted-foreground` on `background` meets 4.5:1.

### Semantics

- [ ] No `<button>` nested in an `<a>` anywhere.
- [ ] Lists are lists; nav is `<nav>`; the footer is `<footer>`.
- [ ] `lang="en"` set.

---

## Acceptance criteria

- [ ] Lighthouse ≥ 95 Performance and 100 Accessibility on `/` and `/stories`,
      mobile preset.
- [ ] Zero axe-core violations on every route.
- [ ] Every checkbox above ticked, or explicitly documented as a deferred
      trade-off with a reason.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build && npm run start
```

Run Lighthouse against the production build, not the dev server — dev numbers
are meaningless. Run axe on every route.

## Handoff notes

Report actual Lighthouse scores per route and list anything deliberately
deferred. **Do not report a score you did not run.**
