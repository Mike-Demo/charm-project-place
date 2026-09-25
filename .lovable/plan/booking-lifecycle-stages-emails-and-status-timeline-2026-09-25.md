# Booking lifecycle stages, emails, and status timeline

## What you get
A checkmark timeline on each booking in the admin dashboard, with six stages and a "Send now" button for each email stage.

```text
[1] Booked            -> recorded when the slot is paid for
[2] Reminder sent     -> email the day before, with a one-click "I'll be there" button
[3] Client confirmed  -> recorded when the client clicks that button
[4] Day-of email      -> address, hours, what to bring
[5] Aftercare email   -> care tips + link to the Mayo Clinic tattoo care page
[6] Share email       -> easy share buttons and a suggested caption tagging the studio
```

Each stage shows a check mark and the date/time it happened; stages not reached yet show an empty circle. Cancelled bookings show the timeline greyed out.

## How it works
- Emails are sent manually from the admin booking panel for now ("Send now"), so you can test each one. Automatic daily sending can be added later.
- The confirm button in the reminder email opens a small "You're confirmed" page using the client's private pass link, and marks stage 3.
- The client's session pass page also shows a "Confirm attendance" button once the reminder has gone out.
- Emails reuse the current sketchbook style, studio address, and the private pass link.
- The share email offers Instagram, Facebook, and copy-caption options (Instagram has no direct share link, so it copies the caption and opens Instagram).

## Technical details
- Migration: add nullable `reminder_sent_at`, `client_confirmed_at`, `day_of_sent_at`, `aftercare_sent_at`, `social_sent_at` timestamps to `appointments`.
- RPC `confirm_attendance(p_token)` (security definer, token length check, confirmed+paid only, idempotent).
- Admin server function `sendLifecycleEmail({ id, stage })` guarded by auth + `has_role(admin)`; sends the fixed template for that stage via `sendTemplateEmail` with idempotency key `${stage}-${id}`, then stamps the timestamp.
- New templates in `src/lib/email-templates/`: `session-reminder`, `session-day-of`, `session-aftercare`, `session-share`; registered in `registry.ts`.
- Route `/pass/$token/confirm` calls the RPC and shows the result.
- `LifecycleTimeline` component rendered inside `AdminBookingDetails`; stage data added to the admin detail query.
- Suppressed recipients shown as "Not sent: client unsubscribed" rather than an error.
