# Studio booking dashboard

## What you’ll get
- Turn the existing Studio Ledger into a practical preparation dashboard: an upcoming-bookings list ordered by date and time, with search and status/date filters so past or cancelled sessions remain findable.
- Open any booking to see the client’s name, pronouns, date, time, contact details, payment/booking status, reschedule history, idea description, uploaded reference, and generated sketch when present. Show a clear “No idea provided” state otherwise.
- Keep the current day-by-day availability controls, calendar export, and booking status actions available without crowding the preparation view. Match the existing paper-and-ink style on desktop and phone.

## Technical approach
- Extend the existing protected `/admin` page and its appointment query rather than creating a second dashboard. The current page already checks the admin role, retrieves bookings within a limited date range, and displays ideas inside selected-day slot rows; the new list will make all relevant sessions discoverable independently of the 14-day selector.
- Use the existing admin-only appointment access and private-image signed URLs. Fetch historical and future bookings with bounded/paginated queries so the list remains useful as the studio grows; do not expose booking data on public pages or use a public read policy.
- Keep current mutations and calendar export working. Add loading, empty, and error states, and verify a signed-in admin can open a real booking and view its details and images on desktop and mobile. No payment, email, or booking-flow changes.
