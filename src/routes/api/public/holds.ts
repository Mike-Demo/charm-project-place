import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TIME_SLOTS } from "@/lib/atelier";
import { APP_ORIGIN } from "@/lib/studio-location";
import {
  apiError,
  idempotencyLookup,
  idempotencyStore,
  identifyCaller,
  json,
  notifyWebhooks,
  optionsResponse,
  rateLimit,
} from "@/lib/public-api.server";

const MAX_ACTIVE_AGENT_HOLDS = 20;
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const holdInput = z.object({
  date: dateKey,
  time_slot: z.enum(TIME_SLOTS),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30),
  pronouns: z.string().trim().max(40).optional(),
  idea: z.string().trim().max(2000).optional(),
});

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}

export const Route = createFileRoute("/api/public/holds")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "write");
        if (limited) return limited;

        const idemKey = request.headers.get("idempotency-key")?.trim();
        if (idemKey) {
          const existing = await idempotencyLookup(idemKey, caller.hash);
          if (existing) return json(existing, 200, { "Idempotency-Replayed": "true" });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("invalid_json", "Request body must be valid JSON.", 400);
        }
        const parsed = holdInput.safeParse(body);
        if (!parsed.success) {
          return apiError(
            "invalid_input",
            parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
            400,
          );
        }
        const input = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { count: active } = await supabaseAdmin
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("source", "agent")
          .eq("status", "pending")
          .gt("hold_expires_at", new Date().toISOString());
        if ((active ?? 0) >= MAX_ACTIVE_AGENT_HOLDS) {
          return apiError("too_many_holds", "The studio has too many pending agent holds right now. Try again shortly.", 503);
        }

        const { data, error } = await supabaseAdmin.rpc("create_pending_appointment", {
          p_name: input.name,
          p_phone: formatPhone(input.phone),
          p_email: input.email,
          p_date: input.date,
          p_time_slot: input.time_slot,
          p_pronouns: input.pronouns ?? "",
        });
        if (error) return apiError("slot_unavailable", error.message, 409);
        const row = data?.[0];
        if (!row) return apiError("slot_unavailable", "Could not hold that slot.", 409);

        await supabaseAdmin
          .from("appointments")
          .update({ source: "agent", ...(input.idea ? { idea_description: input.idea } : {}) })
          .eq("id", row.id);
        await supabaseAdmin.from("agent_hold_log").insert({ caller_hash: caller.hash, appointment_id: row.id });

        const response = {
          booking_id: row.id,
          status: "pending",
          hold_expires_in_minutes: 15,
          checkout_url: `${APP_ORIGIN}/checkout/${row.id}?s=${encodeURIComponent(row.hold_secret)}`,
          handoff: {
            kind: "user_checkout",
            url: `${APP_ORIGIN}/checkout/${row.id}?s=${encodeURIComponent(row.hold_secret)}`,
            instructions: "Hand this URL to the user's own agent or browser. The user opens it to lock the session in (free while in proof of concept); the slot is released after 15 minutes if not locked in.",
          },
          next_step: "Send checkout_url to the user, then poll GET /api/public/bookings/{booking_id} or subscribe to webhooks for booking.confirmed.",
        };
        if (idemKey) await idempotencyStore(idemKey, caller.hash, response);
        await notifyWebhooks("hold.created", { booking_id: row.id, date: input.date, time_slot: input.time_slot });
        return json(response, 201);
      },
      GET: () => apiError("method_not_allowed", "Use POST to create a hold. See /api/public/openapi.json.", 405, { Allow: "POST" }),
    },
  },
});
