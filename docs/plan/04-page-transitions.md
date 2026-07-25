# Slice 04 — Page transitions

**Goal:** replace hard route cuts with a designed transition, without breaking
scroll restoration, ScrollTrigger cleanup, or the back button.

**Depends on:** slices 01 and 02 — every route must exist first, or you will
be testing transitions into 404s.

---

## Why this is its own slice

Page transitions in the App Router are the single most common source of subtle
breakage in sites like this: leaked ScrollTriggers, scroll position landing
mid-page, double-mounted video, and a back button that animates the wrong way.
Doing it last, once every route is real, is deliberate.

---

## The approach

**A curtain, not an exit animation.** React's App Router cannot reliably
animate an unmounting page — `AnimatePresence` around `{children}` fights the
router's own reconciliation. Instead:

1. Intercept navigation on internal links.
2. Play a short cover animation (a `--color-background` panel wiping or fading
   in over the page), ~`--duration-base`.
3. `router.push()` once covered.
4. On the new pathname, play the cover out, ~`--duration-slow`.

This is robust, it works with the back button, and it never leaves a page
half-faded if navigation fails.

### Files to create

```
src/components/providers/transition-provider.tsx   Curtain state + overlay
src/components/ui/transition-link.tsx              Link that routes through it
```

Add `TransitionProvider` inside `LenisProvider` in `layout.tsx`.

### Requirements

- **Respect modifier clicks.** Cmd/Ctrl/Shift/middle-click and any link with a
  target must fall through to default browser behaviour. Getting this wrong
  breaks "open in new tab" for every link on the site.
- **External links and hash links bypass the curtain entirely.**
- **Back/forward** must play the transition too — listen for `popstate`.
- Scroll reset already happens in `LenisProvider` on pathname change; make sure
  it fires while the curtain is *covering*, not after it lifts, or the visitor
  watches the page jump.
- Under reduced motion, skip the animation and navigate immediately.
- Add a timeout guard: if navigation hasn't completed in ~1.5s, lift the
  curtain anyway rather than trapping the visitor behind it.

### Where to use `TransitionLink`

Header nav, mobile menu, footer, story cards, reel slides, next-project link.
Leave `mailto:` and external social links as plain anchors.

---

## Acceptance criteria

- [ ] Navigating between all routes plays cover-in → route change → cover-out.
- [ ] The new page always starts at scroll 0, with no visible jump.
- [ ] Browser back and forward both animate and land correctly.
- [ ] Cmd-click / middle-click opens a new tab and plays **no** transition.
- [ ] External links and `mailto:` are unaffected.
- [ ] Navigating rapidly (click three links fast) never leaves the curtain
      stuck down.
- [ ] `ScrollTrigger.getAll().length` returns to a stable baseline after
      navigating through every route and back — no leaks.
- [ ] No video keeps playing after leaving a route.
- [ ] Reduced motion: instant navigation, no curtain.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Navigate the full route graph twice, then check `ScrollTrigger.getAll().length`
and `document.querySelectorAll('video').length` in the console — both should be
stable, not growing.

## Handoff notes

Report the stable ScrollTrigger and video-element counts, and confirm the
modifier-click behaviour was tested rather than assumed.
