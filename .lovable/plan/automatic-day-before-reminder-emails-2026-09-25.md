# Automatic day-before reminder emails

## What you get
Every day at 9 AM studio time (Saint Paul), each client with a booking the next day gets their reminder email automatically. The timeline's "Reminder sent" check fills in on its own. You can still use "Send now" or "Resend" by hand at any time.

## Rules
- Only confirmed, paid bookings for tomorrow get a reminder.
- Skip anyone who already got one, whether it was sent by hand or automatically.
- Skip cancelled, expired and pending bookings.
- If a client has unsubscribed, don't send. Leave their reminder stage unchecked.
- If one email fails, the others still go out. The failed one is tried again the next day only if the booking is still upcoming.
- Daylight saving time is handled, so it always goes out at 9 AM local time.

## Technical details
- New route `src/routes/api/public/hooks/send-reminders.ts` (POST):
  - Verifies the caller with the existing cron auth helper and `LOVABLE_CRON_SECRET`.
  - Returns immediately unless the current America/Chicago hour is 9.
  - Uses the service-role client to select appointments where `status='confirmed'`, `payment_status='paid'`, `booking_date` = tomorrow (Chicago) and `reminder_sent_at is null`.
  - For each one, sends `session-reminder` with idempotency key `reminder-auto-${id}` so a send can't be duplicated, then stamps `reminder_sent_at`.
  - Returns counts of sent, skipped and failed.
- Move the shared "build template data and send" logic out of `lifecycle.functions.ts` into a server-only helper, so the manual button and the automatic job use the same code.
- Schedule (via run_sql, not a migration): pg_cron runs at 14:00 and 15:00 UTC, which covers 9 AM Chicago in both daylight and standard time. The route itself ignores the run that doesn't land on 9 AM local. The job calls the stable production URL with the cron secret header.
- That is 2 short checks a day, so there's no meaningful extra backend cost.
- No schema changes.

## Checks
- Call the route directly with a test booking for tomorrow and confirm the timeline shows "Reminder sent".
- Call it a second time and confirm nothing is sent again.
- Confirm a call without the secret is refused.
