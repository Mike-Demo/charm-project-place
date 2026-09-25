import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const envSchema = z.enum(["sandbox", "live"]);
const customDataSchema = z.object({ appointmentId: z.string().uuid() });

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsedEnv = envSchema.safeParse(new URL(request.url).searchParams.get("env") ?? "sandbox");
        if (!parsedEnv.success) return new Response("Bad env", { status: 400 });
        const { verifyWebhook, EventName } = await import("@/lib/paddle.server");
        try {
          const event = await verifyWebhook(request, parsedEnv.data);
          if (event.eventType === EventName.TransactionCompleted) {
            const custom = customDataSchema.safeParse(event.data.customData);
            if (custom.success) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { error } = await supabaseAdmin
                .from("appointments")
                .update({
                  status: "confirmed",
                  payment_status: "paid",
                  paddle_transaction_id: event.data.id,
                  hold_expires_at: null,
                })
                .eq("id", custom.data.appointmentId)
                .in("status", ["pending", "expired"]);
              if (error) console.error("Failed to confirm appointment", error.message);
            }
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook error", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
