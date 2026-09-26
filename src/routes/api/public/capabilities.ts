import { createFileRoute } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { identifyCaller, json, optionsResponse, rateLimit } from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/capabilities")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "read");
        if (limited) return limited;
        return json({
          service: "fresh-ink-booking",
          version: "2.0.0",
          protocols: {
            mcp: `${APP_ORIGIN}/api/public/mcp`,
            rest: `${APP_ORIGIN}/api/public`,
            openapi: `${APP_ORIGIN}/api/public/openapi.json`,
            agent_card: `${APP_ORIGIN}/.well-known/agent.json`,
            webmcp: "Tools registered via navigator.modelContext on the booking page",
          },
          capabilities: [
            { id: "studio.info", endpoint: "GET /api/public/studio", stable: true },
            { id: "availability.search", endpoint: "GET /api/public/availability?from=&to=&time_slot=", stable: true },
            { id: "booking.hold", endpoint: "POST /api/public/holds", idempotent: true, stable: true },
            { id: "booking.status", endpoint: "GET /api/public/bookings/{id}", stable: true },
            { id: "agent.auth", endpoint: "POST /api/public/agent-keys", stable: true },
            { id: "events.stream", endpoint: "GET /api/public/events", format: "text/event-stream", stable: true },
            { id: "webhooks.subscribe", endpoint: "POST /api/public/webhooks", events: ["hold.created", "booking.confirmed", "hold.expired"], stable: true },
            { id: "handoff.user_checkout", description: "Hold responses include a handoff payload with a checkout_url to pass to the user's own agent or browser.", stable: true },
          ],
          negotiation: {
            preferred_slots: "POST /api/public/holds returns 409 slot_unavailable when the requested slot is taken; call GET /api/public/availability?time_slot= to negotiate an alternative.",
            rate_limits: "Anonymous: 60 reads/min, 5 writes/hour. With an API key: 600 reads/min, 30 writes/hour. 429 responses carry Retry-After.",
          },
        });
      },
    },
  },
});
