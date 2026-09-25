import { EmailAPIError } from "@lovable.dev/email-js";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export const STAGE_CONFIG = {
  reminder: { template: "session-reminder", column: "reminder_sent_at" },
  day_of: { template: "session-day-of", column: "day_of_sent_at" },
  aftercare: { template: "session-aftercare", column: "aftercare_sent_at" },
  social: { template: "session-share", column: "social_sent_at" },
} as const;

export type LifecycleStage = keyof typeof STAGE_CONFIG;

export interface LifecycleRow {
  id: string;
  client_name: string;
  email: string;
  booking_date: string;
  time_slot: string;
  access_token: string | null;
  idea_description: string | null;
}

export const LIFECYCLE_ROW_COLUMNS = "id,client_name,email,booking_date,time_slot,access_token,status,idea_description";

/** Sends one lifecycle email; throws a friendly Error on failure. */
export async function sendLifecycleForRow(row: LifecycleRow, stage: LifecycleStage, origin: string, idempotencyKey: string): Promise<{ sent: boolean }> {
  const passUrl = row.access_token ? `${origin}/pass/${row.access_token}` : undefined;
  try {
    return await sendTemplateEmail(STAGE_CONFIG[stage].template, row.email, {
      templateData: {
        name: row.client_name.split(" ")[0],
        date: row.booking_date,
        time: row.time_slot,
        passUrl,
        confirmUrl: passUrl ? `${passUrl}/confirm` : undefined,
        idea: row.idea_description ?? undefined,
      },
      idempotencyKey,
    });
  } catch (err) {
    if (err instanceof EmailAPIError) {
      if (err.code === "domain_not_verified") throw new Error("Not sent yet: the studio email domain is still being verified.");
      if (err.code === "emails_disabled") throw new Error("Not sent: studio emails are turned off.");
      if (err.status === 429) throw new Error(`Too many emails right now. Try again in ${err.retryAfterSeconds ?? 60} seconds.`);
    }
    throw new Error("Email could not be sent. Please try again.");
  }
}
