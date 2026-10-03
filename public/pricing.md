---
title: "Pricing — Fresh Ink"
description: "Fresh Ink pricing: free while in proof of concept; no payment step right now."
canonical: "https://freshink.art/pricing.md"
last-updated: "2026-10-03"
---

# Pricing — Fresh Ink

## Current status: free proof of concept

Booking a session at Fresh Ink is currently free. There is no payment step right now — holds lock in directly, and confirmed bookings carry no charge.

This is a proof-of-concept phase. Paid checkout is not currently offered: do not expect a working payment step, and treat any historical mention of deposits as outdated.

## What this means for agents

- `hold_slot` (MCP) and `POST /api/public/holds` (REST) create holds that the user locks in free via the returned `checkout_url`.
- No payment credentials, no deposit collection, and no checkout integration are active.
- Pricing will be published here if and when paid booking launches.

## API usage pricing

The public API and MCP server are free to use: anonymous access (60 reads/min, 5 writes/hour) or an optional API key (600 reads/min, 30 writes/hour) minted via `POST /api/public/agent-keys`. No billing is attached to API keys.

## Plan tiers

| Tier | Price | What you get |
|---|---|---|
| Proof of concept (current) | $0 | Session holds lock in free via the checkout link; confirmed bookings carry no charge |
| Paid booking (future) | To be announced | Pricing will be published here before any charges exist |

There are no other tiers, no seat pricing, and no usage-based billing today.

## Feature breakdown

| Capability | Included |
|---|---|
| Browse availability (`list_open_times`, `GET /api/public/open-times`) | Free, anonymous |
| Hold a slot (`hold_slot`, `POST /api/public/holds`) | Free, anonymous (5/hour) |
| Booking status checks | Free, anonymous |
| MCP server (`/api/public/mcp`) | Free, anonymous |
| Higher rate limits via API key | Free, self-minted |
| Webhooks for booking events | Documented in the API reference |

## Questions

- **Is there really no charge right now?** Correct — this is a proof-of-concept phase. Holds lock in free; treat any historical mention of deposits as outdated.
- **Will the API stay free?** The public read-only API and MCP server are free with no announced end date. API keys carry no billing.
- **When paid booking launches, what changes?** Pricing will be published on this page and at `/pricing` before any payment step goes live.
