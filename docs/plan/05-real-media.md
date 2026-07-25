# Slice 05 — Real media pipeline

**Goal:** replace placeholder posters with the studio's real footage and
stills, and put an encoding standard in place so future additions are
consistent.

**Depends on:** slices 01–03 (every media surface should exist before you
start filling them).

**Blocked on the studio supplying masters.** If they haven't, do the encoding
tooling and the documentation half, and leave the config pointing at
placeholders.

---

## Current state

Placeholder `VideoAsset`s carry an **empty `sources` array**, so `AutoVideo`
renders the poster only and issues zero network requests. Nothing is broken and
no 404s are being eaten — the site is simply running on posters.

Declared `duration` values already drive reel pacing, so timing will not change
when real files land.

---

## Encoding standard

Establish and document these. Every asset added later must match.

| Use | Codec | Container | Max dimension | Target bitrate | Audio |
|---|---|---|---|---|---|
| Ambient loop (hero, reel, card) | H.264 High | `.mp4` | 1920×1080 | 3–5 Mbps | **None — strip the track** |
| Ambient loop, mobile encode | H.264 | `.mp4` | 1280×720 | 1.5–2.5 Mbps | None |
| Full film (player) | H.264 High | `.mp4` | 1920×1080 | 6–8 Mbps | AAC 128kbps stereo |
| Modern alternate (optional) | VP9/AV1 | `.webm` | as above | ~30% lower | as above |

Rules that matter:

- **Strip audio from every ambient loop.** They are never audible, and the
  track is pure waste on every autoplay surface.
- **`-movflags +faststart`** on every mp4, or the browser waits for the whole
  file before first frame.
- Loops should be cut to loop cleanly; no fade to black at the tail.
- Keep loops short — 8–15s. `duration` in config must match the real file.

Posters: extract a representative frame (not frame 0 — it's usually black),
export at 1920×1080, and compress to WebP or a well-optimised JPEG.

Add a script (`scripts/encode-media.sh` or similar) wrapping ffmpeg so the
studio can run it themselves. Note in the README that ffmpeg is **not** present
in the current dev environment and must be installed.

---

## Wiring real assets

Everything is a config change:

```ts
// src/content/media.ts — pass src + poster, and `placeholder` clears itself
video("northwind-loop", {
  alt: "…",
  duration: 12,
  src: "/media/projects/northwind/loop.mp4",
  poster: "/media/projects/northwind/poster.webp",
})
```

Add `mobileSources` where a lighter encode exists. **No component changes.**

Suggested layout under `public/media/`:

```
projects/<slug>/loop.mp4, loop-mobile.mp4, film.mp4, poster.webp
projects/<slug>/stills/01.webp …
creators/<slug>/backdrop.mp4, portrait.webp
hero/reel.mp4, reel-mobile.mp4, poster.webp
```

---

## Also in this slice

- Set real `duration` values from the encoded files.
- Replace `still()` placeholders for project galleries and creator portraits.
- Remove the dev placeholder badge only when an asset is genuinely real — the
  flag drives it automatically, so this should require no code edit.
- Add `sizes` to any `next/image` that renders responsively, so the browser
  doesn't fetch a 4K portrait for a 40px avatar.

---

## Acceptance criteria

- [ ] Encoding standard documented and a runnable script committed.
- [ ] Every real asset has a poster; no `<video>` renders without one.
- [ ] Ambient loops contain no audio track (verify with `ffprobe`).
- [ ] All mp4s are faststart.
- [ ] `duration` in config matches the real files within ~0.5s.
- [ ] No placeholder badge appears on any page in dev once assets are real.
- [ ] Home page: only one video ever plays at a time (check DevTools).
- [ ] `/stories` with 18 cards: nothing loads until scrolled near; nothing
      plays on touch until in view.
- [ ] Total transferred bytes on first paint of `/` stays under ~2.5MB.
- [ ] Save-data and reduced-motion still hold at the poster and fetch nothing.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Then, in DevTools Network, hard-reload `/` and `/stories` and confirm request
counts and byte totals against the criteria above.

## Handoff notes

Report actual first-paint transfer size for `/` and `/stories`, and list any
assets still outstanding from the studio.
