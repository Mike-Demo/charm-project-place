---
title: "Fresh Ink — appointment-only custom linework tattoo studio"
description: "Book a tattoo session at Fresh Ink in Saint Paul, MN. Free while in proof of concept. AI agents can book via MCP."
canonical: "https://freshink.art/"
last-updated: "2026-10-03"
---

# Fresh Ink — appointment-only custom linework tattoo studio

Fresh Ink is an appointment-only custom linework tattoo studio at 332 Minnesota St Ste N201, Saint Paul, MN 55101.

Book a session in a few steps on the homepage: pick a day, lock your slot, and get a session pass. Booking is free while in proof of concept — there is no payment step right now.

## For AI agents

- Agent docs: https://freshink.art/agents
- MCP server: https://freshink.art/api/public/mcp (Streamable HTTP, no authentication; tools: `get_studio_info`, `list_open_times`, `hold_slot`, `get_booking_status`)
- OpenAPI spec: https://freshink.art/api/public/openapi.json
- Capabilities and limits: https://freshink.art/api/public/capabilities
- Auth model: https://freshink.art/auth.md (anonymous works; optional API key for higher limits)
- Pricing: https://freshink.art/pricing.md (free while in proof of concept)
- Agent skills index: https://freshink.art/.well-known/agent-skills/index.json
- Agent card: https://freshink.art/.well-known/agent-card.json
- MCP server card: https://freshink.art/.well-known/mcp/server-card.json
- Agentic Resource Discovery: https://freshink.art/.well-known/ard.json
- Developer portal: https://freshink.art/developers
- llms.txt: https://freshink.art/llms.txt

## How agent booking works

1. Call `get_studio_info` for hours, session times, and the booking flow.
2. Call `list_open_times` with a date range to find open slots.
3. Confirm the details with your user, then call `hold_slot` (idempotent via `idempotency_key`).
4. Hand the returned `checkout_url` to the user — they open it themselves to lock the session in.
5. Poll `get_booking_status`, subscribe to webhooks, or watch the SSE stream for confirmation.

## Contact

- Studio: studio@freshink.art
- About: https://freshink.art/about
