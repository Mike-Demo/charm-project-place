import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, idempotency-key",
} as const;

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", ...CORS, ...extraHeaders },
  });
}

export function apiError(code: string, message: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return json({ error: { code, message } }, status, extraHeaders);
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export interface Caller {
  hash: string;
  viaApiKey: boolean;
}

/**
 * Identifies the caller by Bearer API key when present, otherwise by hashed IP.
 * API-key callers get higher rate limits.
 */
export async function identifyCaller(request: Request): Promise<Caller> {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const keyHash = sha256(auth.slice(7).trim());
    const db = await admin();
    const { data } = await db.from("agent_api_keys").select("id").eq("key_hash", keyHash).maybeSingle();
    if (data) {
      await db.from("agent_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
      return { hash: `key:${keyHash}`, viaApiKey: true };
    }
  }
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return { hash: `ip:${sha256(ip)}`, viaApiKey: false };
}

const LIMITS: Record<string, { anonymous: number; keyed: number; windowSec: number }> = {
  read: { anonymous: 60, keyed: 600, windowSec: 60 },
  write: { anonymous: 5, keyed: 30, windowSec: 3600 },
  stream: { anonymous: 10, keyed: 60, windowSec: 60 },
};

/**
 * Sliding-window rate limit. Returns null when allowed, or a 429 Response with Retry-After.
 */
export async function rateLimit(caller: Caller, bucket: keyof typeof LIMITS): Promise<Response | null> {
  const config = LIMITS[bucket];
  const limit = caller.viaApiKey ? config.keyed : config.anonymous;
  const db = await admin();
  const since = new Date(Date.now() - config.windowSec * 1000).toISOString();
  const { count } = await db
    .from("api_rate_log")
    .select("id", { count: "exact", head: true })
    .eq("caller_hash", caller.hash)
    .eq("bucket", bucket)
    .gte("created_at", since);
  if ((count ?? 0) >= limit) {
    return apiError("rate_limited", `Rate limit exceeded. Try again in ${config.windowSec} seconds.`, 429, {
      "Retry-After": String(config.windowSec),
    });
  }
  await db.from("api_rate_log").insert({ caller_hash: caller.hash, bucket });
  return null;
}

/**
 * Returns the stored response for an idempotency key, or null if unseen.
 * Stores `response` under the key when `store` is provided.
 */
export async function idempotencyLookup(key: string, callerHash: string): Promise<unknown | null> {
  const db = await admin();
  const { data } = await db.from("idempotency_keys").select("response").eq("key", key).eq("caller_hash", callerHash).maybeSingle();
  return data?.response ?? null;
}

export async function idempotencyStore(key: string, callerHash: string, response: unknown): Promise<void> {
  const db = await admin();
  await db.from("idempotency_keys").upsert({ key, caller_hash: callerHash, response: response as Json });
}

export type WebhookEvent = "hold.created" | "booking.confirmed" | "hold.expired";

/**
 * Delivers a signed event to every subscribed webhook URL. Best-effort: failures are ignored.
 */
export async function notifyWebhooks(event: WebhookEvent, payload: Record<string, unknown>): Promise<void> {
  const db = await admin();
  const { data: subs } = await db.from("webhook_subscriptions").select("url, secret, events");
  if (!subs?.length) return;
  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
  await Promise.all(
    subs
      .filter((sub) => sub.events.includes(event))
      .map(async (sub) => {
        const signature = createHmac("sha256", sub.secret).update(body).digest("hex");
        await fetch(sub.url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-freshink-signature": signature, "x-freshink-event": event },
          body,
        }).catch(() => undefined);
      }),
  );
}

export function newWebhookSecret(): string {
  return randomBytes(24).toString("base64url");
}

export function verifySignature(secret: string, body: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
