# Tattoo idea step with AI pencil concept sketch

## What clients will see
- A new optional booking step, "Your idea", placed just before Review (steps become nine).
- A hand-lined notes box to describe the tattoo (placement, size, style, meaning).
- A sketchy drop zone to upload one reference photo (JPG/PNG/WEBP, up to 10 MB) with a preview and remove option.
- A "Sketch my concept" button that turns the photo into a rough graphite tattoo concept using your uploaded prompt. While it works, the ink-bottle sketching animation shows; the result appears on a paper card with "Redraw" and "Use this sketch".
- "Skip for now" keeps the step fully optional.
- Review shows the description, reference thumbnail and concept sketch.
- The artist sees the idea, photo and sketch on each appointment in the admin view, and on the session pass.
- A new header drawing for this step (pencil over a sketchbook page) in the existing field-notes style.

## Limits and safety
- Up to 3 sketch generations per booking hold to control AI credit use.
- Clear messages for failed uploads, rate limits or used-up credits; the booking still continues without a sketch.
- Photos and sketches are stored privately; only the client (via their booking) and admins can view them.

## Technical details
- Storage: private bucket `tattoo-ideas`; uploads go through a server function tied to the pending appointment id; signed URLs for display.
- Database migration: add `idea_description`, `reference_image_path`, `concept_sketch_path`, `sketch_attempts` to `appointments`; update the pending-hold, confirmed-booking, token and admin reads to return them (with grants unchanged/extended as needed).
- Order change: the slot hold currently happens at payment; the idea step saves to the booking after the hold is created, or is cached client-side and attached when the hold is created, so no orphan rows appear.
- Image generation: TanStack server route (`/api/sketch-concept`) calling the Lovable AI image edit endpoint with default model `openai/gpt-image-2.5-sunburst`, streaming partial previews with blur; prompt text taken verbatim from the uploaded file (open-source workflow note kept as the adherence line). Status handling for 402/429/403 per gateway rules.
- Service layer in `src/lib/idea-service.ts`; UI components `IdeaStep`, `ConceptSketchCard`; new artwork added to `StepArtwork`.
- Record the storage/generation decision in `AGENTS.md`.

## Validation
- Upload a photo, generate, redraw, skip, and complete a test booking end-to-end; confirm the idea appears on Review, session pass and admin.
- Check mobile layout, keyboard access, and that the header art does not shift the form.
