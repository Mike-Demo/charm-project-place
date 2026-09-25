# Private booking link + reschedule option

## What the client experiences
1. After the $1 payment goes through, their booking gets its own private link, for example `/pass/k3F9...` (a long random code nobody can guess).
2. The confirmation page shows a "Save your pass link" line with a copy button.
3. The same link is sent to them by email and by text.
4. Opening the link later shows the same "Session Pass" confirmation page.
5. The page has a new "Reschedule" button. It opens the sketchbook date and time picker with live availability. Picking a new time moves the booking right away, with no second payment, and the page updates to the new date. The old time opens up for other people.
6. Rescheduling is allowed until 24 hours before the appointment. After that, the page says to contact the studio instead. A booking can be moved up to 3 times.
7. The admin ledger shows when a booking was rescheduled.

## What needs your input
- **Email:** sending emails needs a domain you own (for example notify.yourstudio.com). None is set up yet. You'll get a setup button. Until it's verified, the link is still shown on the page but no email goes out.
- **Text messages:** real texts aren't connected yet (same as the demo code step). For now the text is shown as an on-screen "demo text" preview. Real texting through Twilio can be added later.

## Steps
1. Give each booking a private random code and a public page at `/pass/<code>`.
2. Create the link when the payment is confirmed. Replace the old `?paid=<id>` return with the new link.
3. Add the Reschedule button and flow to the confirmation page.
4. Set up the email domain, then add a "Your session pass" email with the link, sent once when the payment is confirmed.
5. Add the demo text preview. Leave Twilio as a later option.
6. Test in test mode: pay, open the link in a fresh browser, reschedule, confirm the old time is free, then remove the test bookings.

## Technical details
- Migration (additive): `appointments.access_token text unique` (32 bytes from `gen_random_bytes`, base64url), `reschedule_count int default 0`, `rescheduled_at timestamptz`. Update `create_pending_appointment` so it generates the token at insert time.
- SECURITY DEFINER RPCs: `get_booking_by_token(p_token)`, which returns only confirmed/paid rows and the safe columns. `reschedule_booking(p_token, p_date, p_slot)`, which checks the 24h cutoff, count < 3, and blocked slots, updates the row, and relies on the unique slot index to reject a slot someone else just took. The UUID-based `get_confirmed_booking` stays in place for the in-flow success screen.
- New route `src/routes/pass.$token.tsx`, with its own head() and noindex. The confirmation pass is moved into a shared component used by both routes.
- The Paddle webhook, after it marks the booking paid, sends the `session-pass` template through `sendTemplateEmail`, using idempotency key `pass-<id>`. If email isn't set up yet, the error is logged and the booking still confirms.
- Service layer: `fetchBookingByToken` and `rescheduleBooking` go in `atelier-service.ts`.
- Rollback: the new columns and functions only add to the schema. The old UUID path still works.
