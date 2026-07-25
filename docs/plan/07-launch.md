# Slice 07 — SEO, metadata & launch readiness

**Goal:** everything that has to be true before this site is public.

**Depends on:** all previous slices.

---

## Metadata

The root layout already sets `metadataBase`, a title template, description,
OpenGraph and Twitter card defaults. Finish the job:

- [ ] Per-route `generateMetadata` on `/stories`, `/creators`,
      `/creators/[slug]`, `/studio` — title and description that read well in
      a search result, not just a slug echoed back.
- [ ] OG images. Project and creator pages should use their poster; static
      routes need a designed default. Consider Next's `opengraph-image` file
      convention rather than hand-rolling.
- [ ] Confirm the real production domain in `src/content/site.ts` — `site.url`
      currently points at a placeholder, and `metadataBase` derives from it, so
      every OG URL is wrong until this is set.
- [ ] `canonical` on every route.

## Crawlability

- [ ] `app/sitemap.ts` generating entries for all static routes plus every
      project and creator slug.
- [ ] `app/robots.ts`.
- [ ] Structured data: `Organization` on the studio page, `VideoObject` on
      project pages. Only add fields that are genuinely true — do not invent
      ratings or dates.

## Assets

- [ ] Favicon set and `apple-touch-icon` from the Lumen Haul mark.
- [ ] `manifest.webmanifest` with name, theme colour `#1c1c1c`, icons.
- [ ] Replace the default `favicon.ico` still shipped by create-next-app.
- [ ] Delete the unused create-next-app SVGs in `public/` (`next.svg`,
      `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).

## Content sign-off

**This is a blocker, not a checklist item.**

- [ ] Every placeholder string replaced with real studio copy. Search the repo
      for "placeholder" and "PLACEHOLDER CONTENT" before claiming this.
- [ ] All 18 projects have real client names, titles, summaries and credits.
- [ ] All creators have real names, roles and bios.
- [ ] Studio contact details, addresses and partners are real.
- [ ] Legal: confirm the studio has clearance to publish every frame of
      footage and every client name shown.
- [ ] Copyright year in the footer is generated, not hardcoded — verify.

## Fonts

- [ ] Decide: license the intended display and mono faces, or ship the
      substitutes deliberately. If licensing, swap to `next/font/local` keeping
      the same CSS variable names (see `layout.tsx`).
- [ ] Confirm no licensed font file is committed without a license.

## Analytics & error reporting

- [ ] Add analytics only if the studio wants it, and prefer a cookieless
      provider — the site currently sets no cookies and therefore needs no
      consent banner. **Adding a cookie-setting analytics script means adding a
      consent flow.** Raise this rather than deciding it silently.

## Deployment

- [ ] Confirm the build output is fully static.
- [ ] Caching headers: immutable for `/_next/static`, sensible for `/media`.
- [ ] Verify video files are served with range-request support — seeking in the
      fullscreen player depends on it.
- [ ] HTTPS, HSTS, and a 404 that renders the styled `not-found.tsx`.

## Final pass

- [ ] Every route loads with no console errors or warnings.
- [ ] No horizontal scrollbar at 320, 390, 768, 1024, 1440, 1920.
- [ ] Test on real iOS Safari and real Android Chrome — autoplay policy,
      `svh` behaviour and scroll-snap all differ from desktop emulation, and
      the mobile home page depends on all three.
- [ ] Reduced-motion pass.
- [ ] Keyboard-only pass.

## Verification

```bash
npx tsc --noEmit && npm run lint && npm run build && npm run start
```

Then crawl the production build and confirm sitemap coverage matches the built
route list.

## Handoff notes

State plainly what is still outstanding, especially anything on the content
sign-off list. A site that looks finished but ships placeholder client names is
worse than one that is obviously unfinished.
