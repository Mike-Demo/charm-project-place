# Step-aware field-note illustrations

## Goal
Replace the single needle above the form with a stable, centered illustration stage whose hand-drawn subject changes with each booking step. Keep the selected **Narrative field notes** look and the existing paper-and-ink styling.

## Illustration sequence
1. **Name** — tattoo needle, preserving the current opening mark.
2. **Pronouns** — two overlapping flash-label ribbons, suggesting a personal label without gendered imagery.
3. **Preferred day** — small tear-off day card with a circled mark.
4. **Date & time** — the selected little black date book, including rough page lines, elastic, and needle bookmark.
5. **Phone** — vintage handset with a loosely curled cord.
6. **SMS verification** — folded message slip with six hand-marked boxes.
7. **Email** — sealed studio envelope with a small needle emblem.
8. **Review** — completed appointment sheet with a bold approval stamp.

## Transition behavior
- Keep one fixed-size frame so the form never shifts.
- On step changes, erase the current drawing through a quick reverse stroke, then draw the next mark in line-by-line.
- Use a short ink crossfade beneath the redraw so unrelated silhouettes change cleanly instead of producing the messy path warping seen previously.
- Resume the existing subtle line-boil after each drawing settles.
- Reverse the stroke order when moving backward for a natural flipbook feel.
- Reduced-motion visitors receive an immediate crossfade without line tracing or boil.

## Technical details
- Define the eight drawings as reusable inline SVG path groups sharing one `viewBox`, stroke treatment, and semantic color tokens.
- Add a focused step-art component that selects the drawing from the current step while keeping the existing SVG filters local and collision-free.
- Extend the current Anime.js helper with a cancellable erase/draw sequence based on measured SVG path lengths; cancel an active sequence if someone changes steps quickly.
- Preserve the current first-load studio-draft animation, then coordinate it with the initial needle drawing so both effects do not compete.
- Keep the artwork decorative and hidden from screen readers; existing step labels remain the accessible description.

## Validation
- Check forward, backward, and rapid step changes on desktop and phone widths.
- Confirm the illustration frame does not move or resize the form.
- Confirm every mark stays legible at mobile size and the date-book state matches the chosen visual direction.
- Verify reduced-motion behavior and the first-load replay option.
- Check the latest build and browser console before completion.
