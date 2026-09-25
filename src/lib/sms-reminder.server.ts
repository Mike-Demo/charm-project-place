import { STUDIO_ADDRESS } from "@/lib/studio-location";

export interface SmsReminderInput {
  phone: string;
  time_slot: string;
  access_token: string | null;
}

export type SmsResult = { status: "simulated" | "sent" | "failed" };

export function buildReminderSms(row: SmsReminderInput, origin: string): string {
  const street = STUDIO_ADDRESS.split(",")[0];
  const link = row.access_token ? ` Confirm: ${origin}/pass/${row.access_token}/confirm.` : "";
  return `Fresh Ink reminder: your session is tomorrow at ${row.time_slot}, ${street}.${link} Reply STOP to opt out.`;
}

/**
 * SMS is built but not live. Real sending requires SMS_REMINDERS_ENABLED="true"
 * plus a connected Twilio account; until then every message is only simulated.
 */
export async function sendReminderSms(row: SmsReminderInput, origin: string): Promise<SmsResult> {
  const body = buildReminderSms(row, origin);
  const enabled = process.env["SMS_REMINDERS_ENABLED"] === "true";
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const twilioKey = process.env["TWILIO_API_KEY"];
  const from = process.env["TWILIO_FROM_NUMBER"];
  if (!enabled || !lovableKey || !twilioKey || !from) return { status: "simulated" };

  const digits = row.phone.replace(/\D/g, "");
  const to = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  return { status: res.ok ? "sent" : "failed" };
}
