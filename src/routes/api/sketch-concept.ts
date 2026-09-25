import { createFileRoute } from "@tanstack/react-router";
import { buildSketchPrompt, editImage, imageSettings } from "@/lib/image-gateway.server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;
const PER_CLIENT_DAILY = 6;
const GLOBAL_DAILY = 150;

export const Route = createFileRoute("/api/sketch-concept")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Sketching is not configured yet.", { status: 500 });
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin) {
          return new Response("Forbidden", { status: 403 });
        }
        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [perClient, global] = await Promise.all([
          supabaseAdmin.rpc("consume_sketch_quota", { p_key: `ip:${ip}`, p_limit: PER_CLIENT_DAILY }),
          supabaseAdmin.rpc("consume_sketch_quota", { p_key: "global", p_limit: GLOBAL_DAILY }),
        ]);
        if (perClient.error || global.error) return new Response("Sketching is unavailable right now.", { status: 503 });
        if (perClient.data !== true || global.data !== true) {
          return new Response("Daily sketch limit reached. You can still book without a sketch.", { status: 429 });
        }
        const incoming = await request.formData();
        const image = incoming.get("image");
        if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type) || image.size === 0 || image.size > MAX_BYTES) {
          return new Response("Please upload a JPG, PNG or WEBP photo under 10 MB.", { status: 400 });
        }
        const rawDescription = incoming.get("description");
        const description = typeof rawDescription === "string" ? rawDescription.slice(0, 1000) : "";
        const form = new FormData();
        form.set("image", image, image.name || "reference.png");
        form.set("prompt", buildSketchPrompt(description));
        const stream = incoming.get("stream");
        if (stream === "false") form.set("stream", "false");
        const upstream = await editImage({ ...imageSettings, apiKey }, form);
        return new Response(upstream.body, {
          status: upstream.status,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
