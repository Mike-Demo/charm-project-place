# $1 donation payment before a slot is locked

## What the client experiences
1. They go through the steps as they do now: name, pronouns, day, date and time, phone, code, email, review.
2. On the review page, the button changes to "Donate $1 & Lock In ✦".
3. Clicking it holds their slot for 15 minutes and opens a secure $1 checkout inside the page.
4. If the payment goes through, the slot is confirmed and they see the "Booking locked in" stamp.
5. If they cancel or 15 minutes pass without paying, the hold ends and the slot opens up for other people again.
6. In the admin ledger, each booking shows "Paid" or "Awaiting payment". Held bookings that were never paid don't count as booked.

## Important caveat (please read)
The $1 goes to your payment account, not straight to A Thousand Pansies. You would pass the money on to them yourself, for example in one monthly transfer. The checkout and receipt will say "$1 booking donation, passed on to A Thousand Pansies" so clients know how it works. Payment providers also watch for "donation" wording, so the charge will be set up as a $1 booking fee that you pass on.

## Steps
1. Run the payment eligibility check and pick one provider (Stripe or Paddle), then confirm the choice with you before turning it on. Only the test flow is set up for now, with no live payments. Payments need a Pro plan. A test mode is set up right away so you can try it with test cards and no real money. Taking real payments later needs a quick account verification.
2. Create one product: "Atelier slot lock – $1 donation to A Thousand Pansies" at $1.00, charged once.
3. Change how bookings are saved: a booking starts as "pending payment" and holds its time for 15 minutes. It becomes "confirmed" only after the payment provider confirms the payment.
4. Add the in-page checkout to the review step, with success, cancel and expired messages written in the same sketchbook style.
5. Update the admin ledger to show payment status.
6. Test the whole flow in test mode, both paying and cancelling, and remove the test bookings afterward.

## Technical details
- Migration: add `payment_status` ('pending' | 'paid' | 'expired'), `hold_expires_at`, `checkout_session_id` to `appointments`. Change the unique slot index and `get_unavailable_slots` so they count a slot as taken if it is confirmed/paid, or pending with `hold_expires_at > now()`. Add a `create_pending_appointment` SECURITY DEFINER RPC that returns an id.
- Server function `startSlotCheckout` (createServerFn): creates the pending row and the checkout session with the appointment id in its metadata, and returns the client secret for embedded checkout.
- Webhook `src/routes/api/public/payments-webhook.ts`: checks the signature, then on checkout completed marks the appointment paid/confirmed using the admin client.
- Expired holds are ignored by the queries (no cron needed). The admin ledger filters on `payment_status = 'paid'`.
- Service layer: `atelier-service.ts` gets `startSlotCheckout` and `getBookingStatus` (the success page polls it until the booking shows paid).
- Rollback: the migration only adds columns. The old direct `book_appointment` stays in place until the new flow is verified.
