# Site-wide sketch preloader

## Goal
Give the site a short, graceful first-load sequence using the uploaded SVG, while keeping the finished page laid out behind it so the transition does not cause visible layout shifts.

## Experience
1. Show a full-viewport paper-toned preloader on the first visit in each browser tab, across every page.
2. Place the uploaded black SVG mark in a stable, responsive frame at the center. It will enter with a soft ink-settle rather than popping into place.
3. Add a small ink-point/needle accent that follows a hidden copy of the mark’s primary SVG path using Anime.js `createMotionPath`, while the mark reveals with a restrained sketch-in effect.
4. Keep the sequence brief and overlap its phases: settle in, trace, then fade/lift away. Do not hold the visitor for an artificial network delay; include a short safety timeout so the overlay can never become stuck.
5. Play only once per tab using session storage. Refreshes and in-site navigation appear immediately.
6. With reduced motion enabled, show the mark briefly without path travel, then remove the overlay with no spatial animation.

## Preventing layout shift
- Render the real page in its final layout beneath a fixed overlay from the first server response; the preloader will never occupy document flow or change page dimensions.
- Fix the booking page’s current browser-only URL read during initial rendering so the server and browser begin with matching markup, then detect payment-return state after hydration.
- Give the SVG frame fixed responsive dimensions and preserve its view box, preventing image-size changes while it initializes.
- Sequence the existing booking-page sketch entrance after the preloader exits, avoiding two animations fighting over the same first frame.

## Technical details
- Create a reusable site-level preloader mounted in the shared page shell, with the uploaded SVG paths kept inline so Anime.js can access the path geometry.
- Add typed Anime.js helpers for the entry, `createMotionPath` travel, and exit; cancel animations and timers on cleanup.
- Keep the preloader decorative except for one concise screen-reader status announcement, and prevent it from trapping keyboard focus.
- Preserve the separate post-payment confirmation animation; this change is only for the site’s initial load.
- Record the site-shell preloader decision in the project architecture notes during implementation.

## Verification
- Measure layout-shift entries during first load and confirm no unexpected content movement.
- Check first visit, refresh, in-site navigation, and a fresh tab.
- Check the booking page, private pass, Open Source page, sign-in, and admin shell on desktop and mobile.
- Verify reduced motion, keyboard access, SSR hydration, animation cleanup, and no console or build errors.

## Rollback
The preloader is isolated to one shared visual component, motion helpers, and the shell mount; removing those restores immediate page display. The hydration correction should remain because it independently prevents first-render instability.
