# Developer portal — Fresh Ink

Build on Fresh Ink's booking platform: MCP server, REST API, API keys, and limits.

## MCP server

Connect any MCP-capable assistant to `https://freshink.art/api/public/mcp` (Streamable HTTP, no authentication required).

Tools: `get_studio_info`, `list_open_times`, `hold_slot`, `get_booking_status`.

Full walkthrough on the agent docs page (/agents).

## REST API

Machine-readable spec: `https://freshink.art/api/public/openapi.json`

- `GET /api/public/open-times` — availability between dates
- `POST /api/public/holds` — hold a slot (idempotent — safe to retry with the same key)
- `GET /api/public/bookings/{id}` — booking status
- `POST /api/public/agent-keys` — mint an API key for higher limits

Responses use a structured envelope on success and a typed error body on failure.

## API keys and limits

- Anonymous: 60 reads/min, 5 writes/hour
- API key: 600 reads/min, 30 writes/hour
- No billing is attached to API keys.

## Discovery documents

- `/.well-known/ard.json` — Agentic Resource Discovery catalog
- `/.well-known/ai-catalog.json` — AI Catalog manifest
- `/.well-known/agent-card.json` — agent card
- `/.well-known/agent-skills/` — Agent Skills discovery index
- `/.well-known/mcp/server-card.json` — MCP server card
- `/llms.txt` — agent guide to this site
- `/auth.md` — authentication model (anonymous + optional key)
