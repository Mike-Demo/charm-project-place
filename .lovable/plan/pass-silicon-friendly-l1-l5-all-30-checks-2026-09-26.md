# Pass Silicon Friendly: L1 → L5 (all 30 checks)

The verification report scored freshink.art at L1: L1 4/6, L2 3/6, L3 0/6, L4 2/6, L5 1/6. This plan fixes every failing check so a re-verification passes all five levels (need 4/6 per level; we target 6/6).

## L1 — Readable without JavaScript (fix 2 fails)
- **Server-rendered content + semantic HTML:** the homepage HTML body currently contains only the preloader. Make the booking page render real content in the initial HTML (server-side rendering of the intro/first step inside semantic `header`/`main`/`section`/`footer` elements), with the preloader as an overlay that never replaces the page content in the HTML source. This also fixes L2's "text content" fail.

## L2 — Discoverability (fix 3 fails)
- **OpenAPI spec:** publish `/api/public/openapi.json` (OpenAPI 3.1) describing every public endpoint below; link it from `llms.txt` and `/agents`.
- **Machine-readable docs:** expand `/agents` with a structured docs section and add `/docs.json` (machine-readable endpoint list); reference both in `llms.txt`.
- **Text content:** solved by the L1 server-rendering fix.

## L3 — Structured API (fix 6 fails)
New JSON REST endpoints under `/api/public/` (alongside the existing MCP connector):
- `GET /api/public/studio` — address, hours, session times, prices.
- `GET /api/public/availability?from=&to=` — open slots with date-range **search/filter parameters**.
- `POST /api/public/holds` — create a 15-minute hold (write).
- `GET /api/public/bookings/{id}` — booking status.
- All return **consistent JSON**, **structured errors** (`{"error": {"code", "message"}}` with proper status codes, including JSON 404s for unknown `/api/` paths).
- **Rate limits:** per-caller limits returning `429` with `Retry-After` header; documented in `llms.txt` and the OpenAPI spec.
- **A2A agent card:** `/.well-known/agent.json` describing capabilities, protocols (MCP + REST), and endpoints.

## L4 — Agent integration (fix 4 fails)
- **WebMCP:** register the booking tools for browser-based agents via the WebMCP API (`navigator.modelContext`) on the booking page, with a declarative fallback script tag.
- **Agent auth:** optional API keys — `POST /api/public/agent-keys` (email → key) granting higher rate limits via `Authorization: Bearer`; documented in `llms.txt`.
- **Webhooks:** `POST /api/public/webhooks` to register a callback URL; we POST signed event notifications on booking confirmed/expired/cancelled.
- **Idempotency:** holds accept an `Idempotency-Key` header (and MCP `hold_slot` an `idempotency_key` arg); duplicate keys replay the original response instead of double-booking.

## L5 — Autonomous operation (fix 5 fails)
- **Event streaming:** `GET /api/public/events` (SSE) streaming slot-availability and booking-status changes.
- **Capability negotiation:** agent card + `GET /api/public/capabilities` listing versioned capabilities; `hold_slot` returns alternative slots when the requested one is taken.
- **Subscription API:** webhook subscriptions become full management endpoints (create/list/delete) — doubles as the subscription/management API.
- **Proactive notifications:** webhook + SSE events push changes to subscribed agents.
- **Cross-service handoff:** agent card documents the handoff flow — the agent books, then hands the `checkout_url`/session pass to the user's own agent or browser, with a `handoff` capability entry and machine-readable handoff payload in hold responses.

## Also update
- `llms.txt` and `/agents` page: document all new endpoints, auth, rate limits, webhooks, SSE, and the OpenAPI spec URL.
- Database: tables for agent API keys, webhook subscriptions, and idempotency keys (service-role only, with grants + RLS).
- `AGENTS.md`: record the public API architecture decision.

## Verification
- Curl each endpoint for JSON shape, error format, 429 + Retry-After, and idempotent replay.
- Fetch the homepage HTML and confirm real text content and semantic elements are present without JavaScript.
- Walk the 30-check criteria list and confirm each passes before resubmitting for verification.

## Technical details
- All endpoints are TanStack server routes under `src/routes/api/public/`, reusing the existing `agent-booking.server.ts` helpers and availability/hold RPCs; no new client bundle weight.
- SSE via a streaming `Response` on a server route; webhook delivery signed with HMAC using a per-subscription secret.
- Rate limiting keyed by hashed caller IP or API key, stored in a service-role table (same pattern as the existing agent hold log).
