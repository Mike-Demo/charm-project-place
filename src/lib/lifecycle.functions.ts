import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LIFECYCLE_EMAIL_STAGES = ["reminder", "day_of", "aftercare", "social"] as const;
export type LifecycleEmailStage = (typeof LIFECYCLE_EMAIL_STAGES)[number];

const STAGE_CONFIG = {
  reminder: { template: "session-reminder", column: "reminder_sent_at" },
  day_of: { template: "session-day-of", column: "day_of_sent_at" },
  aftercare: { template: "session-aftercare", column: "aftercare_sent_at" },
  social: { template: "session-share", column: "social_sent_at" },
} as const;

export type SendLifecycleResult = { sent: true; at: string } | { sent: false; reason: "recipient_suppressed" };

export const sendLifecycleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), stage: z.enum(LIFECYCLE_EMAIL_STAGES) }).parse(data))
  .handler(async ({ data, context }): Promise<SendLifecycleResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Studio access required.");

    const { data: row, error } = await context.supabase
      .from("appointments")
      .select("id,client_name,email,booking_date,time_slot,access_token,status")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) throw new Error("Booking not found.");
    if (row.status === "cancelled" || row.status === "expired") throw new Error("This booking is not active.");

    const config = STAGE_CONFIG[data.stage];
    const origin = new URL(getRequest().url).origin;
    const passUrl = row.access_token ? `${origin}/pass/${row.access_token}` : undefined;

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail(config.template, row.email, {
      templateData: {
        name: row.client_name.split(" ")[0],
        date: row.booking_date,
        time: row.time_slot,
        passUrl,
        confirmUrl: passUrl ? `${passUrl}/confirm` : undefined,
      },
      idempotencyKey: `${data.stage}-${row.id}`,
    });
    if (!result.sent) return { sent: false, reason: "recipient_suppressed" };

    const at = new Date().toISOString();
    const { error: updateError } = await context.supabase.from("appointments").update({ [config.column]: at } as TablesUpdate<"appointments">).eq("id", row.id);
    if (updateError) throw new Error("Email sent, but the timeline could not be updated.");
    return { sent: true, at };
  });
