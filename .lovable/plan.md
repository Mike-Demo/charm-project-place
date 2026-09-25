# Line Boil logo (replace the morph)

## Goal
Swap the messy needle-to-calendar morph for a hand-drawn "line boil". The needle stays in place, and its edges wobble slightly a few times a second, like looping hand-inked animation frames. It should look grungy and organic, never blobby.

## What will change
1. Remove the ambient morph from the header logo, including the hidden calendar path.
2. Keep the vector needle mark. Run it through a rough-ink SVG filter: turbulence plus a small displacement, about 1.5–2.5px, so the edges look like ink bleeding into paper.
3. Make the lines "boil" by switching between 3–4 turbulence seeds at a stepped rate of about 8 frames per second. Stepped switching looks hand-drawn; smooth tweening would look digital.
4. Add a very faint ink-density flicker (opacity 0.92 to 0.97) on the same beat, for a printed feel.
5. With reduced motion, show one static rough frame and no boiling.
6. Pause the boil while the tab is hidden, and start it only after the first-visit sketch entrance finishes.

## Technical details
- `src/lib/motion.ts`: replace `startAmbientMorph` with `startLineBoil(filterEl, seeds, fps)`. It uses a timer that steps the `feTurbulence` `seed` attribute and returns `{ cancel }`.
- `src/routes/index.tsx`: define the filter inside the logo's `<svg>` with a unique id and apply it to the needle path. Start the boil in the existing mount effect (after about 600ms) and clean it up on unmount. Remove the `morphTo` import and the hidden target path.
- `src/lib/logo-marks.ts`: keep `NEEDLE_MARK_D`. Remove `CALENDAR_MARK_D` if nothing else uses it.
- Colors stay on the existing design tokens (`currentColor`). The logo size stays 192px.

## Verification
- Take Playwright screenshots of the logo several frames apart. Edges should differ slightly while the shape stays clearly a needle.
- Check reduced motion (static), the `?replay=1` entrance, and that there are no console or build errors.
