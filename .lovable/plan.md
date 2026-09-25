# Finish and connect the four session emails

## Where things stand
The four emails are already set up in a basic form: session reminder, day-of briefing, aftercare, and social showcase. They use the shared sketchbook layout, and each "Send now" button on the timeline already sends its email and stamps the date. So this work is about making them complete, not starting over.

## What changes
1. **Reminder email**: add a stamped date/time card, a large "Yes, I'll be there" button, a text link as a backup, a note about the 24-hour reschedule cutoff, and a short "what to bring" list.
2. **Day-of briefing**: add an address card with a map link, arrival tips, what to bring, how to prep (eat, hydrate, no alcohol), a link to the session pass, and the idea summary if one was given.
3. **Aftercare**: split the care steps into "First 48 hours", "Weeks 1–2" and "Warning signs". Keep the Mayo Clinic button and a fallback link. Add a small hand-drawn divider.
4. **Social showcase**: add a caption box that's easy to copy, Instagram and Facebook buttons, a note to tag the studio, and a gentle "only if you want to" tone. It stays a thank-you note for this one client, with no promotions.
5. **Shared layout**: add plain-text versions, use one consistent footer, and make sure every email reads well on phones.
6. **Send now buttons**: show a clear message after each tap: sent, not sent because the client unsubscribed, or waiting on email domain setup. Keep the "Resend" option.

## Checks
- Preview all four emails at desktop and phone widths.
- From the admin panel, tap "Send now" for each stage on a test booking. Confirm the timeline updates and the delivery log shows each send.
- Tap the confirm button in the reminder email and confirm stage 3 gets checked.

## Technical details
- Edit `session-reminder.tsx`, `session-day-of.tsx`, `session-aftercare.tsx`, `session-share.tsx`, and `lifecycle-layout.tsx`.
- Pass `idea` from `sendLifecycleEmail` into the day-of email.
- Map `EmailAPIError` codes (`domain_not_verified`, `emails_disabled`, 429) to friendly errors in the server function.
- Leave the idempotency key as `${stage}-${id}`. Resend reuses that same key, so if a resend is blocked as a duplicate, add a resend counter to the key.
- No database changes and no automatic scheduling.
