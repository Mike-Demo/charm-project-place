import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/lib/atelier";
import { sendLifecycleEmail, type LifecycleEmailStage } from "@/lib/lifecycle.functions";

interface Stage {
  label: string;
  at: string | null | undefined;
  send?: LifecycleEmailStage;
}

function stamp(value: string): string {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function LifecycleTimeline({ booking }: { booking: Appointment }) {
  const queryClient = useQueryClient();
  const send = useServerFn(sendLifecycleEmail);
  const [note, setNote] = useState<string | null>(null);
  const inactive = booking.status === "cancelled" || booking.status === "expired" || booking.status === "pending";

  const mutation = useMutation({
    mutationFn: (stage: LifecycleEmailStage) => send({ data: { id: booking.id, stage } }),
    onSuccess: (result) => {
      setNote(result.sent ? "Email sent." : "Not sent: client unsubscribed from studio emails.");
      void queryClient.invalidateQueries({ queryKey: ["admin-booking"] });
    },
    onError: (error: Error) => setNote(error.message),
  });

  const stages: Stage[] = [
    { label: "Booked", at: booking.payment_status === "paid" ? booking.created_at : null },
    { label: "Reminder sent", at: booking.reminder_sent_at, send: "reminder" },
    { label: "Client confirmed", at: booking.client_confirmed_at },
    { label: "Day-of email sent", at: booking.day_of_sent_at, send: "day_of" },
    { label: "Aftercare email sent", at: booking.aftercare_sent_at, send: "aftercare" },
    { label: "Share email sent", at: booking.social_sent_at, send: "social" },
  ];

  return (
    <div className={`border-t border-dashed border-ink-dim/50 pt-5 ${inactive ? "opacity-50" : ""}`}>
      <h4 className="text-xl">Status timeline</h4>
      <ol className="mt-3">
        {stages.map((stage, index) => {
          const done = Boolean(stage.at);
          return (
            <li key={stage.label} className="relative flex gap-3 pb-4 last:pb-0">
              {index < stages.length - 1 && <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px ${done ? "bg-ink" : "border-l border-dashed border-ink-dim/60"}`} />}
              <span aria-hidden className={`relative mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${done ? "border-ink bg-ink text-paper" : "border-ink-dim bg-paper"}`}>
                {done && <Check className="size-4" />}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="leading-tight">{stage.label}<span className="sr-only">{done ? " (done)" : " (not yet)"}</span></p>
                  <p className="font-mono text-[11px] uppercase text-ink-pencil">{stage.at ? stamp(stage.at) : "Not yet"}</p>
                </div>
                {stage.send && !inactive && (
                  <Button variant="outline" size="sm" className="min-h-11" disabled={mutation.isPending} onClick={() => { setNote(null); mutation.mutate(stage.send as LifecycleEmailStage); }}>
                    <Send className="size-3.5" />{done ? "Resend" : "Send now"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {note && <p className="mt-3 text-sm text-ink-pencil" role="status">{note}</p>}
    </div>
  );
}
