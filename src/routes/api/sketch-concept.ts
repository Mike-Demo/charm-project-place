import { createFileRoute } from "@tanstack/react-router";
import { buildSketchPrompt, editImage, imageSettings } from "@/lib/image-gateway.server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;
const PER_HOLD_LIMIT = 3;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
        const incoming = await request.formData();
        const appointmentId = incoming.get("appointmentId");
        const holdSecret = incoming.get("holdSecret");
        if (typeof appointmentId !== "string" || !UUID_RE.test(appointmentId) || typeof holdSecret !== "string" || holdSecret.length < 16 || holdSecret.length > 200) {
          return new Response("Hold a time slot before sketching.", { status: 401 });
        }
        const image = incoming.get("image");
        if (!(image instanceof File) || !ALLOWED_TYPES.has(image.type) || image.size === 0 || image.size > MAX_BYTES) {
          return new Response("Please upload a JPG, PNG or WEBP photo under 10 MB.", { status: 400 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Each live hold gets a few sketches; the global cap backstops total spend.
        const perHold = await supabaseAdmin.rpc("consume_hold_sketch", { p_id: appointmentId, p_secret: holdSecret, p_limit: PER_HOLD_LIMIT });
        if (perHold.error) return new Response("Sketching is unavailable right now.", { status: 503 });
        if (perHold.data !== true) {
          return new Response("Sketches need a live slot hold, with up to 3 tries per booking.", { status: 429 });
        }
        const global = await supabaseAdmin.rpc("consume_sketch_quota", { p_key: "global", p_limit: GLOBAL_DAILY });
        if (global.error) return new Response("Sketching is unavailable right now.", { status: 503 });
        if (global.data !== true) {
          return new Response("Daily sketch limit reached. You can still book without a sketch.", { status: 429 });
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
