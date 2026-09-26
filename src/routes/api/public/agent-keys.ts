import { createHash, randomBytes } from "crypto";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { apiError, identifyCaller, json, optionsResponse, rateLimit } from "@/lib/public-api.server";

export const Route = createFileRoute("/api/public/agent-keys")({
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
        const parsed = z
          .object({ email: z.string().trim().email().max(200), label: z.string().trim().max(80).optional() })
          .safeParse(body);
        if (!parsed.success) return apiError("invalid_input", "Provide a valid email (and optional label).", 400);

        const key = `fk_${randomBytes(24).toString("base64url")}`;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("agent_api_keys").insert({
          key_hash: createHash("sha256").update(key).digest("hex"),
          email: parsed.data.email,
          label: parsed.data.label ?? null,
        });
        if (error) return apiError("upstream_error", error.message, 502);

        return json(
          {
            api_key: key,
            usage: "Send as Authorization: Bearer <api_key> on any /api/public/* endpoint for higher rate limits.",
            note: "Store this key now — it is shown once and cannot be recovered.",
          },
          201,
        );
      },
      GET: () => apiError("method_not_allowed", "Use POST with {email} to mint an API key.", 405, { Allow: "POST" }),
    },
  },
});
