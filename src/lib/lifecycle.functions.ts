import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const LIFECYCLE_EMAIL_STAGES = ["reminder", "day_of", "aftercare", "social"] as const;
export type LifecycleEmailStage = (typeof LIFECYCLE_EMAIL_STAGES)[number];

export type SendLifecycleResult = { sent: true; at: string } | { sent: false; reason: "recipient_suppressed" };

export const sendLifecycleEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid(), stage: z.enum(LIFECYCLE_EMAIL_STAGES) }).parse(data))
  .handler(async ({ data, context }): Promise<SendLifecycleResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Studio access required.");

    const { STAGE_CONFIG, LIFECYCLE_ROW_COLUMNS, sendLifecycleForRow } = await import("@/lib/lifecycle-send.server");
    const { data: row, error } = await context.supabase.from("appointments").select(LIFECYCLE_ROW_COLUMNS).eq("id", data.id).maybeSingle();
    if (error || !row) throw new Error("Booking not found.");
    if (row.status === "cancelled" || row.status === "expired") throw new Error("This booking is not active.");

    const origin = new URL(getRequest().url).origin;
    const result = await sendLifecycleForRow(row, data.stage, origin, `${data.stage}-${row.id}-${Date.now()}`);
    if (!result.sent) return { sent: false, reason: "recipient_suppressed" };

    const at = new Date().toISOString();
    const column = STAGE_CONFIG[data.stage].column;
    const { error: updateError } = await context.supabase.from("appointments").update({ [column]: at } as TablesUpdate<"appointments">).eq("id", row.id);
    if (updateError) throw new Error("Email sent, but the timeline could not be updated.");
    return { sent: true, at };
  });
