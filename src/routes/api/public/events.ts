import { createFileRoute } from "@tanstack/react-router";
import { TIME_SLOTS } from "@/lib/atelier";
import { apiError, identifyCaller, optionsResponse, rateLimit } from "@/lib/public-api.server";

/**
 * Server-sent events stream for agents: an initial availability snapshot,
 * a booking-events snapshot, then heartbeat comments. Clients reconnect to
 * poll fresh state; each connection is bounded so the Worker stays healthy.
 */
export const Route = createFileRoute("/api/public/events")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "stream");
        if (limited) return limited;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
        const to = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const { data: unavailable } = await supabaseAdmin.rpc("get_unavailable_slots", { p_from: today, p_to: to });
        const taken = new Set((unavailable ?? []).map((r) => `${r.slot_date}|${r.time_slot}`));
        const blockedDays = new Set((unavailable ?? []).filter((r) => r.kind === "blocked" && !r.time_slot).map((r) => r.slot_date));
        const open: Array<{ date: string; times: string[] }> = [];
        for (let i = 0; i <= 14; i += 1) {
          const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
          if (d < today || blockedDays.has(d)) continue;
          const times = TIME_SLOTS.filter((t) => !taken.has(`${d}|${t}`));
          if (times.length) open.push({ date: d, times });
        }
        const { count: pendingHolds } = await supabaseAdmin
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .gt("hold_expires_at", new Date().toISOString());

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const send = (event: string, data: unknown) => {
              controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
            };
            send("availability", { timezone: "America/Chicago", open });
            send("studio_pulse", { pending_holds: pendingHolds ?? 0, timestamp: new Date().toISOString() });
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
      POST: () => apiError("method_not_allowed", "Use GET to open the event stream.", 405, { Allow: "GET" }),
    },
  },
});
