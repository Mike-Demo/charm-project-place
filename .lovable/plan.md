# Automated 9 AM reminders + SMS reminders (built, not live)

## What exists today (checked)
- The reminder endpoint is already built. It sends the sketch reminder email to confirmed, paid bookings for tomorrow (Saint Paul time) that haven't had a reminder yet.
- Two scheduled jobs exist (14:00 and 15:00 UTC, which covers 9 AM Chicago in both summer and winter time) and are marked active.
- The database shows **no recorded runs and no outgoing calls** from those jobs. So there's no proof yet that automatic reminders have ever fired.

## Plan

1. **Prove the schedule really runs**
   - Recreate both scheduled jobs cleanly, pointing at the live site (freshink.art) so they reach the published app.
   - Add a small "reminder runs" log: each run records time, whether it skipped (not 9 AM), and how many emails were sent, skipped or failed.
   - Do one forced test run against a test booking to confirm an email goes out and the "Reminder sent" check mark appears on the admin timeline.

2. **Admin visibility**
   - In the admin dashboard, show "Last automatic reminder run: <time> — X sent" so you can tell at a glance it's working, plus a warning if no run has happened in the last 26 hours.

3. **SMS reminders (built, switched off)**
   - Write the text message: "Fresh Ink reminder: your session is tomorrow at 2:00 PM, 332 Minnesota St Ste N201. Confirm: <private pass link>. Reply STOP to opt out."
   - The same 9 AM run prepares an SMS for each booking, but with texting off it only logs "SMS would have sent" instead of sending.
   - Admin timeline shows an "SMS reminder" line marked "Not live (test)".
   - Switching on later only requires connecting Twilio and flipping one setting — no rebuild.

## Needs from you
- Publishing the site after this change so the scheduled jobs reach the new code.
- Email domain (notify.freshink.art) must finish verifying for real delivery.

## Technical details
- New table `reminder_runs` (id, ran_at, skipped_reason, sent, suppressed, failed, sms_simulated) — service_role only, admin SELECT via `has_role`.
- New columns on `appointments`: `sms_reminder_status` text (null | 'simulated' | 'sent' | 'failed'), `sms_reminder_at` timestamptz.
- `src/lib/sms-reminder.server.ts`: `buildReminderSms(row)` + `sendReminderSms()` that returns `{ simulated: true }` unless `SMS_REMINDERS_ENABLED === "true"` and Twilio connector present.
- Endpoint writes a `reminder_runs` row every call (including skips); cron jobs re-scheduled via run_sql with existing hashed token, URL `https://freshink.art/api/public/hooks/send-reminders`.
- Verify with `cron.job_run_details` and `net._http_response` after a forced `?force=1` call.
