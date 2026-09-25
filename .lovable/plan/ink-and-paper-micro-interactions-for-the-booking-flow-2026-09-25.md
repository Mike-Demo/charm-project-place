# Ink-and-paper micro-interactions for the booking flow

## Goal
Add the Anime.js motion ideas from the design note to the booking page. Motion should feel like ink settling on paper. It must never slow down typing or block a click, and it should switch to simple fades when the visitor has reduced motion turned on.

## What visitors will see
1. **Question sheet transitions** – each question settles into place (slight lift and fade, about 200ms). It moves one way going forward and the other way going back.
2. **Progress dots** – the current dot gives a small "stamp" pulse. Finished dots show a quick cyan registration mark.
3. **Living underline** – the line under the name, phone and email fields draws in on focus. It turns green when the answer is valid and gives a small red wobble when it isn't.
4. **Day option cards** – a gentle press when a card (Today, Tomorrow, This weekend, Another day) is picked, and a checkmark drawn in ink.
5. **Calendar and time chips** – the chosen day and time get an ink-circle stroke. Taken times stay still, with no motion.
6. **Validation nudges** – an invalid field gives a small sideways shake (no shake with reduced motion).
7. **Review page** – the summary rows appear one after another, 40ms apart.
8. **Lock In button** – a stamp press on click, a pulsing "Locking in…" state, then a green seal when the booking succeeds.
9. **Confirmation toast** – drops in like a note laid on paper.
10. **Logo** – the existing wobble moves to Anime.js so it only plays on hover and on the first load.

## Technical details
- Install `animejs` (v4) and keep all motion helpers in `src/lib/motion.ts` as named, typed functions such as `animateSheetIn`, `stampPill`, `drawUnderline`, `shakeField` and `sealButton`.
- Add a small `usePrefersReducedMotion` hook. Every helper checks it and falls back to an instant or 100ms opacity change.
- Call the helpers from effects and refs in `src/routes/index.tsx`. Booking, validation and service code stay unchanged.
- Remove the old CSS keyframes (`paper-in-*`, `organic-wobble`) that Anime.js replaces. Keep the global reduced-motion rule.
- Browser-only: helpers run only after the page loads in the browser, never during server rendering.

## Verification
- Walk the full flow with Playwright and check for console errors, and confirm the booking still saves.
- Run it again with reduced motion turned on to confirm there is no movement.
- Confirm the build is clean.

## Rollback
The changes are limited to one new helper file and the booking page's visual layer. Removing the package and the helper calls brings back the current behavior.
