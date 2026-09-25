# Open Source & Credits page + sketch footer

## Goal
Port the QueerCade Connect "Open Source & Credits" page and site footer into Tattoo Atelier, restyled to match this site's warm sketchbook aesthetic (paper canvas, handwritten type, ink-stamp buttons, line-boil details).

## User experience

### New page: `/licenses` ("Open Source & Credits")
- Same paper-textured canvas, registration marks, and Coming Soon / JetBrains Mono typography as the booking flow.
- Header with a small sketch (reuse `StepArtwork`-style inline SVG), the title "Open source & credits", and a short handwritten intro note.
- "← Back to the booking desk" stamp-style link back to `/`.
- Credits grouped into sections, each entry on a hand-drawn paper card (uneven border radius like `.code-box`, pencil underlines, subtle ink bloom on hover):
  - **Typefaces** — Coming Soon (Google Fonts, OFL), JetBrains Mono (OFL)
  - **Framework & tooling** — React, TanStack Start/Router/Query, Vite, TypeScript, Tailwind CSS, Zod, anime.js (line-boil + step-sketch animations)
  - **Platform** — Lovable Cloud (database, auth, email), Paddle (test checkout)
  - **Studio** — A Thousand Pansies (the $1 donation), needle logo & step sketches (all rights reserved, drawn for the atelier)
- Each card: name, author · license, a one-line note, and a "License source" external link.
- Full route metadata: unique title/description, og:title/og:description, og:type, twitter:card (no og:image — no absolute image URL available).

### New shared footer (sketch style)
- New `src/components/SketchFooter.tsx`, mounted once in `src/routes/__root.tsx` so it appears on every page (booking, pass, admin, licenses).
- Contents, mirroring QueerCade's footer but hand-drawn:
  - "Made by MikeDemo" + © year (year resolved after hydration to avoid SSR mismatch)
  - "Open Source" link to `/licenses` with a small sketch icon
  - Social links (open in new tab): LinkedIn, X, tweet.app, Threads — same URLs as QueerCade, with hand-drawn pencil icons instead of pixel icons
  - Keep the existing atelier footer lines ("Atelier Session Protocol // Ink & Needle", "$1 donation to A Thousand Pansies…") merged into this footer so nothing is duplicated; remove the old inline footer markup from `index.tsx`.

## Implementation details
- `src/routes/licenses.tsx`: new file route, static data arrays (`LicenseGroup`/`LicenseEntry` pattern from QueerCade), semantic tokens only, no backend.
- `src/components/SketchFooter.tsx`: shared footer; social URLs carried over from QueerCade's `SiteFooter`.
- `src/routes/__root.tsx`: render `<SketchFooter />` under `<Outlet />`.
- `src/routes/index.tsx`: delete the old inline footer block (footer now comes from root).
- Reuse existing tokens/classes (`paper-*`, `ink-*`, `font-hand`, `ink-stamp-btn`, `.doodle-hover`); add only minimal CSS if a sketch-card style is needed.
- Route tree regenerates automatically; no manual edits to `routeTree.gen.ts`.

## Verification
- `tsgo --noEmit` and build log clean.
- Playwright: open `/licenses` (desktop + mobile), confirm cards, back link, footer links, and that the booking page shows the new footer once with no duplicate studio lines.
- Confirm `/`, `/pass/<token>`, and `/admin` all render the footer.

## Rollback
Isolated to one new route, one new component, and footer wiring in root/index — revertible without touching booking logic or data.
