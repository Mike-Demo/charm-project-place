import { createHash } from "crypto";
import { z } from "zod";
import { TIME_SLOTS } from "@/lib/atelier";
import { APP_ORIGIN, STUDIO_ADDRESS, STUDIO_HOURS, STUDIO_MAP_URL } from "@/lib/studio-location";
import { idempotencyLookup, idempotencyStore, notifyWebhooks } from "@/lib/public-api.server";

const HOLDS_PER_CALLER_PER_HOUR = 5;
const MAX_ACTIVE_AGENT_HOLDS = 20;
const MAX_RANGE_DAYS = 31;

export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const AGENT_TOOLS = [
  {
    name: "get_studio_info",
    description: "Studio name, address, hours, prices and how booking works. Call first.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "list_open_times",
    description: "List open appointment times between two dates (YYYY-MM-DD, max 31 days, America/Chicago).",
    inputSchema: {
      type: "object",
      properties: { from: { type: "string", description: "Start date YYYY-MM-DD" }, to: { type: "string", description: "End date YYYY-MM-DD" } },
      required: ["from", "to"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "hold_slot",
    description:
      "Hold an open time for 15 minutes on behalf of the user. Returns a checkout_url the USER must open to lock the session in (free while in proof of concept — no payment). Confirm the details with the user before calling.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD" },
        time_slot: { type: "string", enum: [...TIME_SLOTS] },
        name: { type: "string", description: "Client full name" },
        email: { type: "string" },
        phone: { type: "string", description: "US phone, 10 digits" },
        pronouns: { type: "string", description: "Optional, e.g. she/her" },
        idea: { type: "string", description: "Optional short description of the tattoo idea" },
        idempotency_key: { type: "string", description: "Optional unique key so retrying the same hold never books twice" },
      },
      required: ["date", "time_slot", "name", "email", "phone"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_booking_status",
    description: "Check a held booking: pending (awaiting payment), confirmed, expired or cancelled.",
    inputSchema: {
      type: "object",
      properties: { booking_id: { type: "string" } },
      required: ["booking_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
] as const;

function text(value: Record<string, unknown>, isError = false): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value, isError };
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function callAgentTool(name: string, args: unknown, callerId: string): Promise<ToolResult> {
  try {
    switch (name) {
      case "get_studio_info":
        return text({
          studio: "Fresh Ink",
          address: STUDIO_ADDRESS,
          map: STUDIO_MAP_URL,
          hours: STUDIO_HOURS,
          timezone: "America/Chicago",
          session_times: TIME_SLOTS,
          deposit: "Free while in proof of concept — the $1 donation to A Thousand Pansies returns at launch",
          how_it_works: "list_open_times → confirm details with the user → hold_slot → give the user the checkout_url to lock in → poll get_booking_status. Once confirmed the user gets a private session pass by email.",
          website: APP_ORIGIN,
        });
      case "list_open_times": {
        const { from, to } = z.object({ from: dateKey, to: dateKey }).parse(args);
        const start = new Date(`${from}T12:00:00Z`);
        const end = new Date(`${to}T12:00:00Z`);
        const days = Math.round((end.getTime() - start.getTime()) / 86400000);
        if (days < 0 || days > MAX_RANGE_DAYS) return text({ error: `Range must be 0–${MAX_RANGE_DAYS} days.` }, true);
        const db = await admin();
        const { data, error } = await db.rpc("get_unavailable_slots", { p_from: from, p_to: to });
        if (error) throw new Error(error.message);
        const taken = new Set((data ?? []).map((r) => `${r.slot_date}|${r.time_slot}`));
        const blockedDays = new Set((data ?? []).filter((r) => r.kind === "blocked" && !r.time_slot).map((r) => r.slot_date));
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
        const open: Array<{ date: string; times: string[] }> = [];
        for (let i = 0; i <= days; i += 1) {
          const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
          if (d < today || blockedDays.has(d)) continue;
          const times = TIME_SLOTS.filter((t) => !taken.has(`${d}|${t}`));
          if (times.length) open.push({ date: d, times });
        }
        return text({ timezone: "America/Chicago", open });
      }
      case "hold_slot": {
        const input = z
          .object({
            date: dateKey,
            time_slot: z.enum(TIME_SLOTS),
            name: z.string().trim().min(2).max(120),
            email: z.string().trim().email().max(200),
            phone: z.string().trim().max(30),
            pronouns: z.string().trim().max(40).optional(),
            idea: z.string().trim().max(2000).optional(),
            idempotency_key: z.string().trim().min(8).max(120).optional(),
          })
          .parse(args);
        if (input.idempotency_key) {
          const replayed = await idempotencyLookup(input.idempotency_key, callerId);
          if (replayed) return replayed as ToolResult;
        }
        const db = await admin();
        const hourAgo = new Date(Date.now() - 3600000).toISOString();
        const { count: recent } = await db.from("agent_hold_log").select("id", { count: "exact", head: true }).eq("caller_hash", callerId).gte("created_at", hourAgo);
        if ((recent ?? 0) >= HOLDS_PER_CALLER_PER_HOUR) return text({ error: "Too many holds from this agent. Try again in an hour." }, true);
        const { count: active } = await db.from("appointments").select("id", { count: "exact", head: true }).eq("source", "agent").eq("status", "pending").gt("hold_expires_at", new Date().toISOString());
        if ((active ?? 0) >= MAX_ACTIVE_AGENT_HOLDS) return text({ error: "The studio has too many pending agent holds right now. Try again shortly." }, true);

        const { data, error } = await db.rpc("create_pending_appointment", {
          p_name: input.name,
          p_phone: formatPhone(input.phone),
          p_email: input.email,
          p_date: input.date,
          p_time_slot: input.time_slot,
          p_pronouns: input.pronouns ?? "",
        });
        if (error) return text({ error: error.message }, true);
        const row = data?.[0];
        if (!row) return text({ error: "Could not hold that slot." }, true);
        await db.from("appointments").update({ source: "agent", ...(input.idea ? { idea_description: input.idea } : {}) }).eq("id", row.id);
        await db.from("agent_hold_log").insert({ caller_hash: callerId, appointment_id: row.id });
        const result = text({
          booking_id: row.id,
          status: "pending",
          hold_expires_in_minutes: 15,
          checkout_url: `${APP_ORIGIN}/checkout/${row.id}?s=${encodeURIComponent(row.hold_secret)}`,
          next_step: "Send checkout_url to the user. The slot is released if they don't lock in within 15 minutes.",
        });
        if (input.idempotency_key) await idempotencyStore(input.idempotency_key, callerId, result);
        await notifyWebhooks("hold.created", { booking_id: row.id, date: input.date, time_slot: input.time_slot });
        return result;
      }
      case "get_booking_status": {
        const { booking_id } = z.object({ booking_id: z.string().uuid() }).parse(args);
        const db = await admin();
        const { data, error } = await db.rpc("get_booking_status", { p_id: booking_id });
        if (error) throw new Error(error.message);
        return text({ booking_id, status: data ?? "not_found" });
      }
      default:
        return text({ error: `Unknown tool ${name}` }, true);
    }
  } catch (err) {
    if (err instanceof z.ZodError) return text({ error: "Invalid input", issues: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, true);
    return text({ error: err instanceof Error ? err.message : "Unexpected error" }, true);
  }
}

export function callerHash(request: Request): string {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`agent:${ip}`).digest("hex");
}
