<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Lumen Haul — agent entry point

**Read these, in this order, before writing code:**

1. **`docs/ARCHITECTURE.md`** — the decisions that are already made. This is the
   contract. Do not re-decide anything in it.
2. **`docs/plan/00-OVERVIEW.md`** — what is built, what is left, which slice is
   yours.
3. Your slice file in `docs/plan/`.
4. The relevant audit doc in `docs/audit/`.

## The ten rules

1. **No magic values.** Colours, durations, easings, gutters, radii and
   z-indexes come from tokens in `src/app/globals.css` or `src/lib/motion.ts`.
2. **No media paths in components.** All media is declared in `src/content/`
   and referenced through typed assets.
3. **No copy in components.** All strings live in `src/content/`.
4. **Reuse the primitives.** `Reveal`, `SplitText`, `Parallax`, `AutoVideo`,
   `MediaFrame`, `PageShell`, `TabNav` exist and already handle reduced motion,
   cleanup, lazy loading and the reveal-footer trap.
5. **Respect the animation boundary.** GSAP for scroll and timelines; Motion
   for mount/unmount and layout transitions; CSS for hover and small state.
   See `ARCHITECTURE.md` §1.
6. **Reduced motion renders the final state.** Never leave content at
   `opacity: 0`. Check `useReducedMotion()` before building a timeline.
7. **Use `<PageShell>` for every route except home.** It handles the opaque
   background and scroll room the fixed reveal footer requires. Skipping it
   ghosts the footer wordmark through your page.
8. **Never nest a `<button>` inside an `<a>`.**
9. **Server components by default.** `"use client"` only where a browser API,
   GSAP, Motion or React state actually requires it.
10. **Verify before claiming done.** `npx tsc --noEmit && npm run lint &&
    npm run build`, then check 390 / 768 / 1024 / 1440 and one reduced-motion
    pass. Report real results, including failures.

## Two facts that surprise people

- **The mobile home page is a different component tree, not a narrow desktop
  one.** Desktop auto-advances a crossfade reel on a timer; mobile scroll-snaps
  titles past a fixed film layer. Do not try to unify them.
- **All media and copy is placeholder** and clearly marked. Placeholder video
  assets carry an empty `sources` array so only posters render and nothing is
  fetched. This is intended behaviour, not a bug.

## Commands

```bash
npm run dev     # http://localhost:3000
npm run build   # static build, must pass before handoff
npm run lint
```
