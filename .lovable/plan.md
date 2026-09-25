# Sketch-style booking email

## Goal
Make the session-pass email feel like the booking page and confirmation pass, rather than a plain text block. The attached inbox screenshot is the current-state reference; preserve its useful information and private pass link.

## Changes
- Redesign the existing “Session Pass // Studio Copy” email with an ink-and-paper layout: a small illustrated needle mark, hand-drawn dividers and labels, a prominent booked date and time, a stamped pass-link button, and restrained cyan/green accents.
- Keep the message concise and easy to read on phones and in common inboxes. Include the recipient’s name, a clear confirmation, the private-link reminder, and the 24-hour rescheduling note. Improve the raw booking-date presentation to a readable date without changing the booking itself.
- Keep a white outer email background, use email-safe inline styling and font fallbacks, and ensure the plain-text version remains useful if images or styling are unavailable.
- Preview the rendered email at desktop and phone widths, check the pass link and fallback data, and confirm that only the email presentation changed.

## Technical details
The existing `session-pass` React Email template already receives name, date, time and pass URL when payment confirms. Update that template and, only if needed for date display, its data formatting at the send point. Keep the current sending infrastructure, private URL, and idempotency behavior untouched. Do not add promotional content, change the payment flow, or add real SMS sending.
