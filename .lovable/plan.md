# Full booking walkthrough screenshots

## Goal
Run the current $0 proof-of-concept booking flow from start to confirmation on mobile, tablet, and desktop, saving a screenshot after each completed step.

## Booking, simulated email, and simulated SMS capture set
For each device size, capture:
1. Name filled out
2. Pronouns selected
3. Day selected
4. Available date and time selected
5. Phone number formatted
6. Demo SMS code accepted
7. Email filled out
8. Tattoo idea description plus an uploaded test reference image
9. Completed review screen before submission
10. Final private session confirmation pass

This produces 30 screenshots total.

## Execution
- Use clearly labeled test-client details and future available slots so the run does not collide with elapsed or occupied times.
- Generate one harmless test reference image solely for the walkthrough upload.
- Complete one real proof-of-concept booking per device size because the confirmation page only exists after submission.
- Capture at mobile, tablet, and desktop dimensions with consistent naming and ordering.
- Check every screenshot for clipping, overlaps, two-line controls, missing artwork, loading overlays, and incorrect confirmation details.
- Record any functional or visual issue encountered; do not change the app unless separately requested.

## Deliverables — standalone and device-framed versions
- Save organized `mobile`, `tablet`, and `desktop` folders in Files.
- Save a ZIP containing the complete screenshot set and generated test reference image.
- Group the files into a booking walkthrough collection when collection tooling is available.
- Report the three test bookings created, the flows verified, and any issues found.

## Technical details
- Drive the live local preview with Playwright, waiting for the sketch preloader and availability data before each interaction.
- Use stable accessible controls rather than fixed coordinates.
- Verify the current build status before and after the run; this task creates test booking data but does not modify application code.
