import { createFileRoute } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { json, optionsResponse } from "@/lib/public-api.server";

const API_BASE = `${APP_ORIGIN}/api/public`;

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Fresh Ink Booking API",
    version: "2.0.0",
    description:
      "Public API for booking tattoo sessions at Fresh Ink (Saint Paul, MN). Companion to the MCP connector at /api/public/mcp. All endpoints accept an optional Authorization: Bearer <api_key> (POST /api/public/agent-keys) for higher rate limits. Rate limits: anonymous 60 reads/min and 5 writes/hour; keyed 600 reads/min and 30 writes/hour; 429 responses carry Retry-After. Errors use {\"error\": {\"code\", \"message\"}}.",
  },
  servers: [{ url: APP_ORIGIN }],
  paths: {
    "/api/public/studio": {
      get: {
        operationId: "getStudioInfo",
        summary: "Studio info: address, hours, session times, booking flow.",
        tags: ["studio"],
        responses: {
          "200": { description: "Studio details" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/public/availability": {
      get: {
        operationId: "listAvailability",
        summary: "List open appointment times between two dates.",
        tags: ["availability"],
        parameters: [
          { name: "from", in: "query", required: true, schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, description: "Start date YYYY-MM-DD" },
          { name: "to", in: "query", required: true, schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, description: "End date YYYY-MM-DD (max 31 days after from)" },
          { name: "time_slot", in: "query", required: false, schema: { type: "string", enum: ["9:00 AM", "1:00 PM", "5:00 PM"] }, description: "Filter to one session time" },
        ],
        responses: {
          "200": { description: "Open slots grouped by date" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/public/holds": {
      post: {
        operationId: "createHold",
        summary: "Hold an open time for 15 minutes on behalf of the user.",
        description: "Idempotent via the Idempotency-Key header: duplicate requests replay the original response. Returns a checkout_url the USER must open to lock the session in (free while in proof of concept).",
        tags: ["booking"],
        parameters: [
          { name: "Idempotency-Key", in: "header", required: false, schema: { type: "string" }, description: "Unique key per logical hold" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date", "time_slot", "name", "email", "phone"],
                properties: {
                  date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  time_slot: { type: "string", enum: ["9:00 AM", "1:00 PM", "5:00 PM"] },
                  name: { type: "string", maxLength: 120 },
                  email: { type: "string", format: "email" },
                  phone: { type: "string", description: "US phone, 10 digits" },
                  pronouns: { type: "string", maxLength: 40, nullable: true },
                  idea: { type: "string", maxLength: 2000, nullable: true },
                },
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          "201": { description: "Hold created, with checkout_url and handoff payload" },
          "400": { $ref: "#/components/responses/BadRequest" },
          "409": { description: "Slot unavailable (also returned as slot_unavailable error)" },
          "429": { $ref: "#/components/responses/RateLimited" },
          "503": { description: "Too many pending agent holds" },
        },
      },
    },
    "/api/public/bookings/{id}": {
      get: {
        operationId: "getBookingStatus",
        summary: "Check a held booking: pending, confirmed, expired or cancelled.",
        tags: ["booking"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Booking status" },
          "404": { $ref: "#/components/responses/NotFound" },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/api/public/agent-keys": {
      post: {
        operationId: "mintAgentKey",
        summary: "Mint an agent API key (email required). The key is shown once.",
        tags: ["auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" }, label: { type: "string", nullable: true } } } } },
        },
        responses: { "201": { description: "API key created" }, "400": { $ref: "#/components/responses/BadRequest" } },
      },
    },
    "/api/public/webhooks": {
      post: {
        operationId: "createWebhookSubscription",
        summary: "Register a webhook. We POST signed events (hold.created, booking.confirmed, hold.expired) to your URL.",
        tags: ["events"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: { url: { type: "string", format: "uri" }, events: { type: "array", items: { type: "string", enum: ["hold.created", "booking.confirmed", "hold.expired"] } } },
              },
            },
          },
        },
        responses: { "201": { description: "Subscription created; returns signing_secret and manage_token, shown once" } },
      },
      get: {
        operationId: "getWebhookSubscription",
        summary: "Get your subscription. Send the manage_token as Bearer.",
        tags: ["events"],
        security: [{ manageToken: [] }],
        responses: { "200": { description: "Subscription details" }, "401": { $ref: "#/components/responses/NotFound" } },
      },
      delete: {
        operationId: "deleteWebhookSubscription",
        summary: "Delete your subscription. Send the manage_token as Bearer.",
        tags: ["events"],
        security: [{ manageToken: [] }],
        responses: { "200": { description: "Deleted" }, "401": { description: "Missing token" }, "404": { $ref: "#/components/responses/NotFound" } },
      },
    },
    "/api/public/events": {
      get: {
        operationId: "streamEvents",
        summary: "Server-sent events stream: availability snapshot, studio pulse, heartbeat.",
        tags: ["events"],
        responses: { "200": { description: "text/event-stream" }, "429": { $ref: "#/components/responses/RateLimited" } },
      },
    },
    "/api/public/capabilities": {
      get: {
        operationId: "getCapabilities",
        summary: "Versioned capability list for agent negotiation.",
        tags: ["discovery"],
        responses: { "200": { description: "Capabilities" } },
      },
    },
    "/api/public/mcp": {
      post: {
        operationId: "mcpJsonRpc",
        summary: "MCP connector (Streamable HTTP, JSON-RPC): initialize, tools/list, tools/call.",
        description: "Tools: get_studio_info, list_open_times, hold_slot (accepts idempotency_key), get_booking_status.",
        tags: ["discovery"],
        responses: { "200": { description: "JSON-RPC response" } },
      },
    },
  },
  components: {
    securitySchemes: { manageToken: { type: "http", scheme: "bearer" }, apiKey: { type: "http", scheme: "bearer" } },
    responses: {
      RateLimited: { description: "Rate limited — carries Retry-After header" },
      BadRequest: { description: "Invalid input — structured error body" },
      NotFound: { description: "Not found — structured error body" },
    },
  },
  "x-freshink": {
    entry_point: `${APP_ORIGIN}/.well-known/agent.json`,
    docs: `${APP_ORIGIN}/agents`,
    llms_txt: `${APP_ORIGIN}/llms.txt`,
  },
};

export const Route = createFileRoute("/api/public/openapi.json")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: () => json(spec),
    },
  },
});
