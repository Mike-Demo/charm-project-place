import { createFileRoute } from "@tanstack/react-router";

const STUDIO_TZ = "America/Chicago";

function chicagoParts(d: Date): { hour: number; ymd: string } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")), ymd: `${get("year")}-${get("month")}-${get("day")}` };
}

function addDay(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: ok } = await supabaseAdmin.rpc("check_reminder_cron_token", { p_token: token });
        if (!ok) return new Response("Unauthorized", { status: 401 });

        const force = new URL(request.url).searchParams.get("force") === "1";
        const now = chicagoParts(new Date());
        if (!force && now.hour !== 9) return Response.json({ skipped: "not 9 AM in Saint Paul" });

        const { LIFECYCLE_ROW_COLUMNS, sendLifecycleForRow } = await import("@/lib/lifecycle-send.server");
        const { data: rows, error } = await supabaseAdmin
          .from("appointments")
          .select(LIFECYCLE_ROW_COLUMNS)
          .eq("status", "confirmed")
          .eq("payment_status", "paid")
          .eq("booking_date", addDay(now.ymd))
          .is("reminder_sent_at", null)
          .limit(200);
        if (error) return Response.json({ error: "Could not load bookings" }, { status: 500 });

        const origin = new URL(request.url).origin;
        let sent = 0, suppressed = 0, failed = 0;
        for (const row of rows ?? []) {
          try {
            const result = await sendLifecycleForRow(row, "reminder", origin, `reminder-auto-${row.id}`);
            if (!result.sent) { suppressed++; continue; }
            await supabaseAdmin.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", row.id);
            sent++;
          } catch {
            failed++;
          }
        }
        return Response.json({ sent, suppressed, failed });
      },
    },
  },
});
