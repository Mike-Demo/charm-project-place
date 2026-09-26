import { createFileRoute } from "@tanstack/react-router";
import { TIME_SLOTS } from "@/lib/atelier";
import { APP_ORIGIN, STUDIO_ADDRESS, STUDIO_HOURS, STUDIO_MAP_URL } from "@/lib/studio-location";
import { apiError, identifyCaller, json, optionsResponse, rateLimit } from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/studio")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "read");
        if (limited) return limited;
        return json({
          studio: "Fresh Ink",
          description: "Appointment-only custom linework tattoo studio.",
          address: STUDIO_ADDRESS,
          map: STUDIO_MAP_URL,
          hours: STUDIO_HOURS,
          timezone: "America/Chicago",
          session_times: TIME_SLOTS,
          deposit: "Free while in proof of concept — the $1 donation to A Thousand Pansies returns at launch",
          booking: {
            how_it_works:
              "GET /api/public/availability → POST /api/public/holds → send the user the checkout_url → GET /api/public/bookings/{id}. Once confirmed the user gets a private session pass by email.",
            mcp: `${APP_ORIGIN}/api/public/mcp`,
            openapi: `${APP_ORIGIN}/api/public/openapi.json`,
          },
          website: APP_ORIGIN,
        });
      },
      POST: () => apiError("method_not_allowed", "Use GET for this endpoint.", 405, { Allow: "GET" }),
    },
  },
});
