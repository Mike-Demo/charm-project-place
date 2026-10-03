# Authentication — Fresh Ink

Fresh Ink's agent surfaces work without OAuth, OpenID Connect, or mandatory API keys. There are two access levels: anonymous, and keyed (higher rate limits).

## Discover

- MCP server: `https://freshink.art/api/public/mcp` (Streamable HTTP)
- REST API: `https://freshink.art/api/public/openapi.json` (OpenAPI 3.1)
- Capabilities: `https://freshink.art/api/public/capabilities`
- Agent docs: `https://freshink.art/agents`
- This file: `https://freshink.art/auth.md`

## Pick a method

**Anonymous (no credentials).** Every public endpoint works anonymously: MCP tools, REST reads, and hold creation. Limits: 60 reads/minute, 5 writes/hour per IP.

**API key (optional, higher limits).** Mint a key with `POST /api/public/agent-keys` (`{ "email": "...", "label": "..." }`); the key is shown once. Send it as `Authorization: Bearer <key>`. Limits: 600 reads/minute, 30 writes/hour. There is no OAuth authorization server and no `/.well-known/oauth-authorization-server` because no OAuth flow exists.

## Register

To register for a key: `POST https://freshink.art/api/public/agent-keys` with your email. No OAuth client registration, no redirects.

## Claim / Exchange / Use the access_token

Not applicable — there are no OAuth tokens to claim or exchange. Use the API key as a Bearer token, or nothing at all.

## Errors

All endpoints return structured JSON errors: `{ "error": { "code": "...", "message": "..." } }` with an appropriate HTTP status. Rate limiting returns HTTP `429` with a `Retry-After` header. There is no `WWW-Authenticate` challenge because no credentials are ever required.

## Webhook authentication

Webhooks you register (`POST /api/public/webhooks`) are signed with HMAC-SHA256 using your subscription's `signing_secret`. Manage a subscription by sending its `manage_token` as a Bearer token.

## Revocation

API keys: contact studio@freshink.art to revoke a key. Webhook subscriptions: `DELETE /api/public/webhooks` with your `manage_token` as Bearer.
