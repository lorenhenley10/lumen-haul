# Reference Audit — Visual System

All values measured from computed styles on the live reference.

---

## Colour

The reference runs an OKLCH ramp with **chroma exactly 0 across the board** —
a pure neutral system. Footage is the only colour that ever appears on screen.
This is a deliberate and load-bearing decision; do not introduce an accent hue.

| Token | Value | Use |
|---|---|---|
| background | `oklch(15.43% 0 0)` | Page base — near-black, not pure black |
| foreground | `oklch(94.3% 0 0)` | Body text — off-white, not pure white |
| primary | `oklch(100% 0 0)` | Pure white: active pill, scrubber fill |
| primary-foreground | `oklch(15.43% 0 0)` | Text on the white pill |
| muted-foreground | `oklch(55.6% 0 0)` | Secondary text, captions, indices |
| border | `oklch(100% 0 0 / 0.15)` | All hairlines |
| ring | `oklch(70.8% 0 0)` | Focus ring |

Recurring surface treatments, used far more than the colour tokens themselves:

- `bg-white/10 backdrop-blur-lg` — every floating control (nav pill, icon
  buttons, index rail, email pill).
- `bg-white/20` — hover state of the above.
- `bg-black/20` — the standard scrim over footage behind text.
- `bg-background/35`–`/40` — heavier scrim on project hero reading panels.
- `brightness-80` filter on background video, *in addition* to the scrim.

Note the two-part treatment: video gets **both** a brightness reduction and a
scrim. One alone is not enough to hold text legibly over arbitrary frames.

## Shadow & radius

| Token | Value |
|---|---|
| `--shadow-base` | `0px 10px 50px rgb(0 0 0 / 0.1)` |
| `--radius` | `0.625rem` (10px) |
| card radius | `rounded-lg` (8px) on story cards |
| pill radius | `rounded-full` everywhere else |

There is exactly one shadow in the system, and it is used only on floating
controls (nav pill, index rail, studio tabs).

---

## Typography

Two families. No third.

| Role | Reference face | Our substitute | Notes |
|---|---|---|---|
| Display | PP Neue Montreal | **Inter Tight** | Licensed → substituted |
| UI / body | Commit Mono | **JetBrains Mono** | Licensed → substituted |

Both substitutes are wired through `--font-display-sans` / `--font-ui-mono` in
`layout.tsx`. Swapping in the licensed faces is a two-line change; nothing else
in the codebase names a family.

### The defining typographic decision

**Body text is monospace, uppercase, and negatively tracked.** Every paragraph,
label, caption, nav item and button on the site is set this way. The display
face appears *only* in headings. This is what gives the reference its
technical/editorial character, and it is the single easiest thing to get wrong.

Measured: `text-transform: uppercase`, `letter-spacing: -0.42px` at 14px
(≈ `-0.03em`), `line-height: 18.2px` (1.3).

### Scale

| Step | Size | Line height | Tracking | Notes |
|---|---|---|---|---|
| Display | fluid **32px → 56px** | 1.0 | `-0.0143em` | `.text-display` (−0.8px at 56px) |
| Heading (h2) | fluid **24px → 32px** | 1.15 | `-0.025em` | `.text-heading` |
| Prose | 16px | 1.5 | `-0.05em` | `.text-prose` — justified, hyphenated |
| UI / body | 14px | 1.3 | `-0.03em` | Mono, uppercase |
| Caption | 12px | 1.35 | `-0.03em` | Indices, meta, controls |

Note the **prose step is larger and tighter than the UI step**, and is set
justified with `hyphens: auto`. It carries long-form copy on /studio. The two
are easy to conflate; they are different treatments.

Tab strips (header nav, studio tabs) set their labels at the 14px UI step but
on an explicit **20px line box**, giving a 36px-tall pill. The 1.3 body ratio
would leave the strip 2px short.

The display step is fluid. Measured 32px at narrow widths and 56px at both
1280px and 1440px — i.e. it clamps at both ends. Our reproduction:

```css
--text-display: clamp(2rem, 0.5rem + 3.75vw, 3.5rem);
```

which passes through 32px at 640px and 56px at 1280px exactly.

Display line-height varies by context: `1.0` for the `/studio` statement,
`1.15` where `tracking-tighter` is also applied (home reel titles). Treat 1.0
as the token default and override locally.

### The two-weight lockup

Project titles are consistently built as:

```
<span class="font-medium">{client}</span><br>
<span class="font-light tracking-tight">{title}</span>
```

Medium client name over light campaign title. This lockup appears in the home
reel (desktop and mobile), the project hero, and the fullscreen player title.
It is the site's signature typographic device — reuse it verbatim.

---

## Layout & grid

### Container

**There is no max-width.** The container is `width: 100%` with a symmetric
gutter. Measured at 1440px viewport: container width 1425px, padding-inline
16px. Wide displays get more image, not more margin.

> **Implementation trap, already hit.** Our `.container` must be declared with
> `@utility container`, not as a `.container` rule inside `@layer components`.
> Tailwind v4 ships its own `container` utility with per-breakpoint
> max-widths, and the utility layer outranks the components layer — declared as
> a component, the override silently loses and every page is capped at 1280px.

| Token | Value |
|---|---|
| `--spacing-container` | `1rem` (16px) — the page gutter, at every breakpoint |
| `--spacing-top-section` | `16rem` (256px) — header clearance on inner pages |

A 16px gutter at 1440px is aggressive and intentional — it is what makes the
site read as full-bleed rather than as a document.

### Grids

- Header inner: `lg:grid lg:grid-cols-6`, nav occupying `col-span-4 mx-auto`.
- Stories: `grid-cols-1 → md:grid-cols-2 → xl:grid-cols-3`, `gap-x-4 gap-y-16`.
- Card meta: `grid-cols-8` with the index in column 1, content in `col-span-7`.
- Studio rows: `md:grid-cols-2 lg:grid-cols-4`.
- Footer links: `grid-cols-3 lg:grid-cols-6`.

### Breakpoints

Tailwind defaults, used with a specific division of labour:

| Breakpoint | Width | What changes |
|---|---|---|
| `sm` | 640px | Footer meta row stops stacking |
| `md` | 768px | **The desktop/mobile tree split.** Stories → 2 columns. Creators backdrops enable |
| `lg` | 1024px | Header pill nav appears, mobile menu retires, **footer becomes fixed** |
| `xl` | 1280px | Stories → 3 columns |

Note `md` and `lg` do different jobs: `md` switches the *content architecture*,
`lg` switches the *chrome*. Between 768 and 1024 you get the desktop content
tree with mobile chrome. Test that band explicitly.

### Aspect ratios

- `16/9` — story cards, all inline media. The dominant ratio by far.
- `1/1` — creator portraits (`size-10 rounded-full`).
- Full-bleed `h-dvh` / `h-svh` — hero and reel sections.

Note `h-dvh` on desktop but `h-svh` on the mobile snap panels: `svh` is what
keeps snap points stable while mobile browser chrome collapses.

---

## Layering

Measured z-index usage, normalised into our named scale:

| Layer | Reference | Our token |
|---|---|---|
| Backdrop media | `-z-1` | `--z-below: -1` |
| Media / active slide | `z-1` | `--z-media: 1` |
| Content over media | `z-10` | `--z-content: 10` |
| Index rail | `z-1`/`z-11` local | `--z-rail: 20` |
| Header | `z-50` | `--z-header: 50` |
| Mobile menu | above header | `--z-menu: 60` |
| Fullscreen player | `z-999` | `--z-player: 999` |

The reveal footer sits *below* page content — page sections carry
`bg-background` to occlude it until scrolled past. This is enforced for us by
`PageShell` (see `ARCHITECTURE.md`); getting it wrong ghosts the giant footer
wordmark through the middle of a page.

## Light / dark

There is no light mode. The site is dark-only; `colorScheme: dark` and a fixed
`themeColor` are declared. Do not add a theme toggle.
