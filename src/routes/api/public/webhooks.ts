import { randomBytes } from "crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, identifyCaller, json, newWebhookSecret, optionsResponse, rateLimit } from "@/lib/public-api.server";

const EVENTS = ["hold.created", "booking.confirmed", "hold.expired"] as const;

const createInput = z.object({
  url: z.string().url().max(500),
  events: z.array(z.enum(EVENTS)).min(1).optional(),
});

export const Route = createFileRoute("/api/public/webhooks")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      POST: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "write");
        if (limited) return limited;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return apiError("invalid_json", "Request body must be valid JSON.", 400);
        }
        const parsed = createInput.safeParse(body);
        if (!parsed.success) {
          return apiError("invalid_input", `Provide {url} and optional events from: ${EVENTS.join(", ")}.`, 400);
        }

        const secret = newWebhookSecret();
        const manageToken = randomBytes(24).toString("base64url");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("webhook_subscriptions")
          .insert({ url: parsed.data.url, secret, manage_token: manageToken, events: parsed.data.events ?? [...EVENTS] })
          .select("id, url, events, created_at")
          .single();
        if (error) return apiError("upstream_error", error.message, 502);

        return json(
          {
            subscription: data,
            signing_secret: secret,
            manage_token: manageToken,
            verify: "Each delivery carries X-FreshInk-Signature: HMAC-SHA256 hex of the raw body with signing_secret, and X-FreshInk-Event.",
            manage: "Use manage_token as Bearer to GET or DELETE this subscription at /api/public/webhooks.",
            note: "Store signing_secret and manage_token now — they are shown once.",
          },
          201,
        );
      },
      GET: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "read");
        if (limited) return limited;

        const token = request.headers.get("authorization")?.replace(/^Bearer /, "").trim();
        if (!token) return apiError("unauthorized", "Send the manage_token as Authorization: Bearer.", 401);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("webhook_subscriptions")
          .select("id, url, events, created_at")
          .eq("manage_token", token)
          .maybeSingle();
        if (!data) return apiError("not_found", "No subscription for that token.", 404);
        return json({ subscription: data });
      },
      DELETE: async ({ request }) => {
        const caller = await identifyCaller(request);
        const limited = await rateLimit(caller, "write");
        if (limited) return limited;

        const token = request.headers.get("authorization")?.replace(/^Bearer /, "").trim();
        if (!token) return apiError("unauthorized", "Send the manage_token as Authorization: Bearer.", 401);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("webhook_subscriptions")
          .delete()
          .eq("manage_token", token)
          .select("id");
        if (error) return apiError("upstream_error", error.message, 502);
        if (!data?.length) return apiError("not_found", "No subscription for that token.", 404);
        return json({ deleted: true });
      },
    },
  },
});
