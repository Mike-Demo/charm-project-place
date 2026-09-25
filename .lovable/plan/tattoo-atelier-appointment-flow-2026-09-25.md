# Tattoo Atelier appointment flow

## Goal
Rebuild the supplied Tattoo Atelier session-details screen as the app’s home page, preserving its warm sketchbook aesthetic and one-question-at-a-time interaction on mobile and desktop.

## User experience
- Recreate the paper-textured canvas, corner registration marks, atelier logo, handwritten typography, progress controls, marginal notes, and ink-stamp action button.
- Start on the phone-reminder question exactly as shown in the reference.
- Provide all five states: date/time, name, phone, email, and final review.
- Let users move with the numbered controls, Previous/Continue actions, and Enter where appropriate.
- Validate name, phone, and email inline with the reference’s red pencil feedback and green valid states.
- Keep the review values synchronized with user edits and show the final booking confirmation toast.
- Preserve the reference’s demo “auto-fix / valid state” control and date/time change interaction.
- Add subtle paper-slide, logo wobble, and marginalia motion while respecting reduced-motion preferences.

## Implementation details
- Convert the supplied static HTML and JavaScript behavior into typed React state and focused reusable UI pieces.
- Use semantic design tokens in the global stylesheet for the paper, ink, cyan, red, and green palette.
- Load the supplied Google fonts from the document head and hotlink the supplied logo image, as allowed.
- Use the existing design-system button component for actions and accessible labels/tooltips for compact controls.
- Add home-page metadata specific to Tattoo Atelier, including title, description, Open Graph, and Twitter tags.
- Keep the work frontend-only; appointment details will not be persisted or sent to a service.

## Verification
- Confirm the initial phone-error state matches the reference at the current mobile viewport.
- Exercise every step, invalid and valid feedback, the auto-fix control, review screen, and final confirmation.
- Check desktop and mobile layouts for text overflow, overlap, keyboard usability, and reduced motion.
- Confirm the preview finishes without build or runtime errors.

## Rollback
The change is isolated to the home-screen presentation, its design tokens, and page metadata, so it can be reverted without affecting services or stored data.
