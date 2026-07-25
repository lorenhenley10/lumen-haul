# Slice 01 — Creators index & detail

**Goal:** build `/creators` and `/creators/[slug]`. The nav links to
`/creators` today and it 404s, so this is a visible gap.

**Reference:** `docs/audit/routes.md` § `/creators`, `docs/audit/responsive.md`
§ Creators, `docs/audit/motion-system.md` § 10.

**Depends on:** nothing. Independent of slice 02.

---

## What you're building

A hover-driven talent index. The list of names is the entire page; hovering a
name reveals that creator's full-bleed media behind everything and dims the
other names. **On touch devices the backdrop system is removed entirely** — not
hidden with opacity, not disabled, but never mounted, because there is no hover
and the media would be dead weight.

---

## Files to create

```
src/app/creators/page.tsx              Index (server component)
src/app/creators/[slug]/page.tsx       Detail, SSG
src/components/creators/creator-index.tsx    Client — hover state + backdrops
src/components/creators/creator-backdrop.tsx Client — one media layer
```

Content already exists: `src/content/creators.ts` exports `creators` and
`getCreator(slug)`. Nine entries, mixing video and still backdrops on purpose —
your backdrop component must handle both.

---

## Index page — structure

Use `<PageShell>`; do **not** hand-roll the footer or the top padding.

```
<PageShell>                                  → container, pt-top-section, opaque
  <CreatorIndex creators={creators} />
</PageShell>
```

`CreatorIndex` renders:

1. **Backdrop stack** — one absolutely positioned layer per creator, behind the
   content (`-z-[1]`), full-bleed, `brightness-[0.8]`, crossfading on
   `--duration-fast`. The stack must extend *above* the page's top padding to
   reach the top of the viewport — the reference uses a negative offset of
   `--spacing-top-section`. Wrap it in a `hidden md:block` container so it
   never mounts on touch.
2. **Name list** — `flex justify-between gap-x-8 pb-16 max-md:flex-col
   md:flex-wrap md:items-center md:gap-y-4`.
   - Each entry: a link containing `h2.text-display` name + a
     `size-10 shrink-0 overflow-hidden rounded-full border` portrait.
   - Mobile: `w-full border-t py-3`, name and portrait pushed apart
     (`max-md:justify-between`). Desktop: `w-fit`, flowing inline and wrapping.
3. **Dimming** — when any name is hovered, non-hovered names drop to ~40%
   opacity over `--duration-instant`. Use `transition-opacity`, not GSAP.

### Backdrop component

```tsx
// Handles both asset kinds — creators.ts deliberately mixes them.
if (asset.kind === "video") → <AutoVideo asset={asset} active={isActive} />
else                        → <Image src={asset.src} … fill className="object-cover" />
```

Wrap either in `<MediaFrame placeholder={asset.placeholder}>`. Pass `active`
so `AutoVideo` plays only the hovered creator — do not let viewport detection
decide, or all nine will play at once.

---

## Detail page — structure

Keep it restrained; the index is the showpiece.

- `generateStaticParams()` from `creators`, plus `dynamicParams = false`.
- `generateMetadata()` — name as title, bio as description.
- `notFound()` when the slug misses.
- Layout: `<PageShell>` with the creator's name in the two-weight lockup
  (`font-medium` name / `font-light` role), the portrait, the bio at
  `max-w-prose`, and a grid of that creator's projects.
- Reuse `<ProjectCard>` for the project grid. For now, show all projects —
  wire a real creator↔project relation when the studio supplies one, and note
  it in the slice handoff.
- Wrap sections in `<Reveal>`.

---

## Rules specific to this slice

- **Hover gating must use `useMediaQuery("(hover: hover)")`, not a width
  breakpoint.** A touch laptop at 1440px must not get hover-only behaviour.
- The backdrop stack must be `pointer-events-none` — it sits over nothing and
  must never intercept a click meant for a name.
- Portraits are `1/1`; use the `aspect` prop, don't hardcode a ratio.
- Names are the display face; everything else on the page stays mono/uppercase.

---

## Acceptance criteria

- [ ] `/creators` renders all nine names with portraits; no 404.
- [ ] Hovering a name fades in exactly one backdrop; siblings dim; leaving
      restores.
- [ ] Video backdrops play **only** while hovered. Confirm in DevTools that
      no more than one video is playing at a time.
- [ ] At < 768px: no backdrop elements exist in the DOM at all, names stack
      with top borders, no horizontal scroll.
- [ ] At ≥ 768px: names flow inline and wrap; backdrops work.
- [ ] `/creators/[slug]` renders for all nine slugs; a bad slug 404s.
- [ ] Reduced motion: names and portraits fully visible, nothing at
      `opacity: 0`, no video fetched.
- [ ] The fixed footer does not ghost through the page content.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Confirm the build output lists `/creators` and nine `/creators/[slug]` paths.
Then check 390 / 768 / 1024 / 1440 and one reduced-motion pass.

## Handoff notes

Record in your final message: whether a real creator↔project relation is still
outstanding, and any content fields the studio must supply (real bios, roles,
portraits).
