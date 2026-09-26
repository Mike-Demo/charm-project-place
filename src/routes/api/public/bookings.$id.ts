import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, identifyCaller, json, optionsResponse, rateLimit } from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/bookings/$id")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request, params }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "read");
        if (limited) return limited;

        const parsed = z.string().uuid().safeParse(params.id);
        if (!parsed.success) return apiError("invalid_id", "Booking id must be a UUID.", 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("get_booking_status", { p_id: parsed.data });
        if (error) return apiError("upstream_error", error.message, 502);
        if (!data) return apiError("not_found", "No booking with that id.", 404);
        return json({ booking_id: parsed.data, status: data });
      },
    },
  },
});
