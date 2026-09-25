# Full Studio Draft entrance

## Goal
Give the booking page a brief, tactile sketch-in on a visitor’s first visit in a tab, without delaying the form or replaying on refresh.

## What will change
1. Add thin, scalable SVG registration corners and drafting guides around the existing booking layout. Keep them decorative and non-interactive, replacing the current CSS corner marks rather than layering duplicate corners.
2. Add a small, traceable needle-line SVG detail near the existing needle image. The current logo is an image, so its pixels cannot be traced as SVG strokes; preserve that logo and use the new line detail for the drawing effect.
3. Add `animateStudioDraftEntrance()` to the existing Anime.js motion helpers. Trace linework in roughly 0–240ms; settle the booking area subtly in roughly 100–380ms; then stagger the header, step indicator, and first question into view through roughly 420ms. These phases overlap, rather than making visitors wait through three separate sequences.
4. Play the entrance only on the first visit in a tab, tracked with session storage. Later visits and refreshes appear immediately. With reduced motion enabled, show everything immediately without traced strokes or spatial movement.
5. Preserve the existing animation for subsequent question changes, but prevent it and the current logo animation from competing with the first-visit entrance. Inputs and buttons stay usable throughout.

## Technical details
- Work only in the booking page, motion helper, and related visual styles. No changes to availability, booking, authentication, or administration.
- Keep content visible in the server-rendered page and set animation starting values only when the browser begins the intro, avoiding an empty or hidden form if JavaScript is delayed.
- Scope animated targets to refs/data attributes in the booking page; use semantic design colors and make SVG guides scale across mobile and desktop.

## Verification
- Check first visit, refresh, and a second visit in the same tab; confirm the intro runs only once.
- Check reduced-motion behavior, initial focus/click responsiveness, and that continuing to the next question still animates normally.
- Visually inspect mobile and desktop and confirm there are no console or build errors.
