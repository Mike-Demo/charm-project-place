# Speed, app icons, share cards, and AI agent booking

## 1. Faster site
- Measure first: run a production build and a browser speed check on the booking, credits, and pass pages to find the biggest wins (script size, fonts, images, first paint).
- Load the animation library only when the loading sketch or step artwork actually needs it, not with the first page.
- Load the admin area, calendar, and side panel code only for admins.
- Fonts: preconnect, `display=swap`, and preload the heading font so text shows up fast.
- Desk stain images: serve smaller compressed versions, lazy-decode, and give them fixed sizes so nothing shifts.
- Keep the loading sketch short and make sure it never delays the booking form underneath.
- Re-measure and report before/after numbers.

## 2. Home screen app icons (no offline)
- Needle icon in 192, 512, maskable 512, and 180 Apple sizes, made from the current favicon.
- App manifest: name "Fresh Ink", cream background, ink theme color, full-screen launch.
- No offline caching, so there's no risk of people seeing an old version.

## 3. Social share cards
- Design one 1200x630 sketch-style card: needle drawing, "Fresh Ink: Book your session", Saint Paul address.
- Host it at a full public web address and add it to the booking, credits, and sign-in pages so links look good in texts, iMessage, Instagram DMs, Slack, etc.
- Private pass and admin pages stay unindexed with no preview image.

## 4. AI agent booking connector
Lets AI assistants (ChatGPT, Claude, etc.) book for their user.
- Tools the assistant gets:
  - `get_studio_info` — address, appointment-only hours, what to expect.
  - `list_open_times` — open slots for a date range.
  - `hold_slot` — hold a time for 15 minutes with client name, pronouns, email, phone, and idea text.
  - `get_booking_status` — check whether the held slot was paid and confirmed.
- The client still pays the $1 test deposit themselves: `hold_slot` returns a checkout link the assistant hands to its user. After payment, the normal session pass email goes out.
- No SMS code step for agents; the payment link acts as the confirmation.
- New "For AI agents" page (linked from the footer and credits page): connection address, copyable setup snippet, tool list with example calls, and the test-mode note.
- Admin ledger shows a small "Booked via agent" tag.
- Limits: per-visitor rate limit on holds and a cap on active agent holds to stop slot hoarding.

## Technical details
- Connector: MCP server over streamable HTTP at `/api/public/mcp` (TanStack server route), JSON-RPC `initialize`, `tools/list`, `tools/call`; zod-validated inputs; reuses existing hold/availability RPCs and Paddle test checkout via server-only helpers. Add `/.well-known` discovery + `llms.txt`.
- Database: `appointments.source` column (`web` | `agent`); agent hold rate-limit table (service-role only, with grants and RLS).
- Performance: dynamic `import("animejs")` in preloader/StepArtwork, lazy admin components, `vite-imagetools` WebP for desk textures, font preload links in `__root.tsx`.
- Icons/manifest in `public/`, manifest + apple-touch-icon links in `__root.tsx`; no service worker.
- OG image uploaded to hosted storage for an absolute https URL; `og:image`/`twitter:image` added per content route head, `twitter:card` = `summary_large_image`.
- Record the connector and lazy-loading decisions in `AGENTS.md`.
