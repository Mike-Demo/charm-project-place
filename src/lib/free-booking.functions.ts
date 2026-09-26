import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Sends the session pass email for a booking that was confirmed without payment.
 * The caller must know the hold secret, so it cannot be triggered for arbitrary bookings.
 */
export const sendFreePassEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ appointmentId: z.string().uuid(), holdSecret: z.string().min(16) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("appointments")
      .select("client_name,email,booking_date,time_slot,access_token,status,hold_secret")
      .eq("id", data.appointmentId)
      .maybeSingle();

    if (!row || row.hold_secret !== data.holdSecret || row.status !== "confirmed" || !row.access_token) {
      return { sent: false };
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { APP_ORIGIN } = await import("@/lib/studio-location");
    const { notifyWebhooks } = await import("@/lib/public-api.server");
    try {
      await sendTemplateEmail("session-pass", row.email, {
        templateData: {
          name: row.client_name.split(" ")[0],
          date: row.booking_date,
          time: row.time_slot,
          passUrl: `${APP_ORIGIN}/pass/${row.access_token}`,
        },
        idempotencyKey: `pass-${data.appointmentId}`,
      });
    } catch (error) {
      console.error("Session pass email failed", error);
    }
    await notifyWebhooks("booking.confirmed", { booking_id: data.appointmentId, date: row.booking_date, time_slot: row.time_slot }).catch(() => undefined);
    return { sent: true };
  });
