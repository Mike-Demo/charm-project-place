import { useQuery } from "@tanstack/react-query";
import { getLastReminderRun } from "@/lib/atelier-service";

const STALE_MS = 26 * 60 * 60 * 1000;

export function ReminderRunStatus() {
  const { data } = useQuery({ queryKey: ["reminder-runs"], queryFn: getLastReminderRun });
  if (!data) return null;
  const stale = !data.lastPing || Date.now() - new Date(data.lastPing).getTime() > STALE_MS;
  const last = data.last;
  return (
    <p role="status" className={`mt-4 font-mono text-xs ${stale ? "text-pencil-red" : "text-ink-pencil"}`}>
      {last
        ? `Last automatic reminder run: ${new Date(last.ran_at).toLocaleString()} — ${last.sent} emailed, ${last.failed} failed, ${last.sms_simulated} SMS simulated (not live).`
        : "No automatic reminder run has sent yet."}
      {stale && " Warning: the reminder schedule hasn't checked in during the last 26 hours."}
    </p>
  );
}
