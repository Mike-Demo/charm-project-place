import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TIME_SLOTS } from "@/lib/atelier";
import { apiError, identifyCaller, json, optionsResponse, rateLimit } from "@/lib/public-api.server";

const MAX_RANGE_DAYS = 31;
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const Route = createFileRoute("/api/public/availability")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "read");
        if (limited) return limited;

        const url = new URL(request.url);
        const parsed = z
          .object({ from: dateKey, to: dateKey, time_slot: z.enum(TIME_SLOTS).optional() })
          .safeParse({ from: url.searchParams.get("from"), to: url.searchParams.get("to"), time_slot: url.searchParams.get("time_slot") ?? undefined });
        if (!parsed.success) {
          return apiError("invalid_input", "Query params: from and to (YYYY-MM-DD, max 31 days), optional time_slot filter.", 400);
        }
        const { from, to, time_slot } = parsed.data;
        const start = new Date(`${from}T12:00:00Z`);
        const end = new Date(`${to}T12:00:00Z`);
        const days = Math.round((end.getTime() - start.getTime()) / 86400000);
        if (days < 0 || days > MAX_RANGE_DAYS) {
          return apiError("invalid_range", `Range must be 0–${MAX_RANGE_DAYS} days.`, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("get_unavailable_slots", { p_from: from, p_to: to });
        if (error) return apiError("upstream_error", error.message, 502);

        const taken = new Set((data ?? []).map((r) => `${r.slot_date}|${r.time_slot}`));
        const blockedDays = new Set((data ?? []).filter((r) => r.kind === "blocked" && !r.time_slot).map((r) => r.slot_date));
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
        const open: Array<{ date: string; times: string[] }> = [];
        for (let i = 0; i <= days; i += 1) {
          const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
          if (d < today || blockedDays.has(d)) continue;
          const times = TIME_SLOTS.filter((t) => !taken.has(`${d}|${t}`) && (!time_slot || t === time_slot));
          if (times.length) open.push({ date: d, times });
        }
        return json({ timezone: "America/Chicago", from, to, filter: time_slot ?? null, open });
      },
    },
  },
});
