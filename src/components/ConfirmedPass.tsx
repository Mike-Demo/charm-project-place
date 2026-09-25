import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  TIME_SLOTS,
  addDays,
  buildAvailability,
  formatLongDate,
  formatPhone,
  fromDateKey,
  isDayFull,
  isSlotTaken,
  sameDay,
  startOfDay,
  toDateKey,
  type Appointment,
} from "@/lib/atelier";
import { fetchUnavailableSlots, rescheduleBooking } from "@/lib/atelier-service";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";

const MAX_RESCHEDULES = 3;

function PassRow({ label, value, last = false }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div className={`flex flex-col justify-between gap-1 pb-2 sm:flex-row sm:items-center ${last ? "" : "border-b border-ink-dim/20"}`}>
      <span className="shrink-0 font-mono text-sm text-ink-pencil">{label}</span>
      <strong className="break-words text-left sm:text-right">{value}</strong>
    </div>
  );
}

export interface ConfirmedPassProps {
  booking: Appointment;
  token: string | null;
  onReset?: () => void;
  onRescheduled?: () => void;
}

export function ConfirmedPass({ booking, token, onReset, onRescheduled }: ConfirmedPassProps) {
  const sessionDate = fromDateKey(booking.booking_date);
  const firstName = booking.client_name.trim().split(/\s+/)[0] ?? "";
  const [copied, setCopied] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const passUrl = token && typeof window !== "undefined" ? `${window.location.origin}/pass/${token}` : null;

  const hoursUntil = (sessionDate.getTime() - Date.now()) / 36e5;
  const count = booking.reschedule_count ?? 0;
  const canReschedule = token !== null && hoursUntil >= 24 && count < MAX_RESCHEDULES;

  const copyLink = async () => {
    if (!passUrl) return;
    await navigator.clipboard.writeText(passUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div data-review-row="" className="flex min-h-[420px] flex-col justify-center">
      <p className="mb-2 font-mono text-sm text-ink-pencil/60">Session Pass // Studio Copy</p>
      <div className="relative mb-6 w-fit">
        <h2 className="text-3xl font-normal leading-snug sm:text-4xl">
          You&apos;re on the books{firstName ? `, ${firstName}` : ""}!
        </h2>
        <span aria-hidden="true" className="absolute -right-8 -top-6 hidden rotate-12 rounded-lg border-2 border-pencil-green px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-pencil-green sm:inline-block">
          ✦ Paid ✦
        </span>
      </div>

      <div className="space-y-3 rounded-lg border border-ink-dim/30 bg-paper-deep/50 p-4 text-lg sm:p-5">
        <PassRow label="Session:" value={`${formatLongDate(sessionDate)} @ ${booking.time_slot} (Station 03)`} />
        <PassRow label="Client:" value={<span className="inline-flex flex-wrap items-center gap-2">{booking.client_name}{booking.pronouns ? <span className="rounded-full border border-ink-dim/30 px-2 py-0.5 text-xs text-ink-pencil">{booking.pronouns}</span> : null}</span>} />
        <PassRow label="SMS Reminder:" value={formatPhone(booking.phone)} />
        <PassRow label="Linework & Stencil:" value={booking.email} />
        <PassRow label="Donation:" value={<span className="text-pencil-green">$1 to A Thousand Pansies — received, thank you ✦</span>} last />
      </div>

      {passUrl && (
        <div className="mt-4 rounded-lg border border-dashed border-cyan-draft/50 p-3">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-draft">Save your pass link</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded bg-paper-deep px-2 py-1 text-xs text-ink-pencil">{passUrl}</code>
            <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl border-ink-dim/40 bg-transparent font-hand">
              {copied ? "Copied ✓" : "Copy link"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-pencil">
            ✉ Demo text to {formatPhone(booking.phone)}: &ldquo;Your Atelier pass: {passUrl}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => window.open(googleCalendarUrl(booking), "_blank", "noopener")} className="ink-stamp-btn h-auto rounded-2xl px-5 py-3 font-hand text-lg font-bold">
          Add to Google Calendar<span className="text-cyan-draft">✦</span>
        </Button>
        <Button variant="outline" onClick={() => downloadIcs([booking], "tattoo-session.ics")} className="h-auto rounded-2xl border-ink-dim/40 bg-transparent px-5 py-3 font-hand text-lg text-foreground hover:bg-paper-deep">
          Download .ics invite
        </Button>
        {token && (
          <Button
            variant="outline"
            disabled={!canReschedule}
            onClick={() => setRescheduling((value) => !value)}
            className="h-auto rounded-2xl border-ink-dim/40 bg-transparent px-5 py-3 font-hand text-lg text-foreground hover:bg-paper-deep"
          >
            {rescheduling ? "Keep current time" : "Reschedule ✎"}
          </Button>
        )}
      </div>

      {token && !canReschedule && (
        <p className="mt-2 text-sm text-ink-pencil">
          {count >= MAX_RESCHEDULES
            ? "This booking has been moved 3 times — please contact the studio to change it again."
            : "Rescheduling closes 24 hours before your session — please contact the studio."}
        </p>
      )}

      {rescheduling && token && (
        <ReschedulePicker
          token={token}
          current={booking}
          onDone={() => {
            setRescheduling(false);
            onRescheduled?.();
          }}
        />
      )}

      <div className="mt-6 space-y-1.5 text-sm text-ink-pencil">
        <p className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✎</span>Your stencil &amp; prep guide are on their way to {booking.email}.</p>
        <p className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✎</span>We&apos;ll text a reminder to {formatPhone(booking.phone)} the day before your session.</p>
        <p className="flex items-start gap-2"><span className="mt-0.5 shrink-0">✎</span>Free rescheduling up to 24h prior, up to {MAX_RESCHEDULES} times.</p>
      </div>

      {onReset && (
        <div className="mt-8 border-t border-dashed border-ink-dim/30 pt-5">
          <Button variant="link" onClick={onReset} className="group h-auto p-0 font-hand text-lg text-ink-pencil hover:text-foreground">
            <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span><span className="underline decoration-ink-dim/40 underline-offset-4">Book another session</span>
          </Button>
        </div>
      )}
    </div>
  );
}

function ReschedulePicker({ token, current, onDone }: { token: string; current: Appointment; onDone: () => void }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeEnd = useMemo(() => addDays(today, 60), [today]);
  const days = useMemo(() => Array.from({ length: 28 }, (_, index) => addDays(today, index + 1)), [today]);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["availability-reschedule", toDateKey(today)],
    queryFn: () => fetchUnavailableSlots(today, rangeEnd),
  });
  const availability = useMemo(() => buildAvailability(query.data ?? []), [query.data]);
  const currentDate = fromDateKey(current.booking_date);

  const mutation = useMutation({
    mutationFn: () => {
      if (!date || !slot) throw new Error("Pick a new day and time.");
      return rescheduleBooking(token, date, slot);
    },
    onSuccess: onDone,
    onError: () => void query.refetch(),
  });

  return (
    <div className="mt-4 rounded-lg border border-ink-dim/30 bg-paper-deep/40 p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-pencil">Pick a new day</p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day) => {
          const full = isDayFull(availability, day);
          const active = date !== null && sameDay(day, date);
          return (
            <button
              key={toDateKey(day)}
              type="button"
              disabled={full}
              onClick={() => { setDate(day); setSlot(null); }}
              className={`rounded-lg border px-1 py-2 text-center font-hand text-sm transition ${active ? "border-foreground bg-paper text-foreground" : "border-ink-dim/30 text-ink-pencil hover:bg-paper"} disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through`}
            >
              <span className="block text-[10px] uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
              {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </button>
          );
        })}
      </div>

      {date && (
        <>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-ink-pencil">Pick a time on {formatLongDate(date)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_SLOTS.map((option) => {
              const isCurrent = sameDay(date, currentDate) && option === current.time_slot;
              const taken = isCurrent || isSlotTaken(availability, date, option);
              return (
                <button
                  key={option}
                  type="button"
                  disabled={taken}
                  onClick={() => setSlot(option)}
                  className={`rounded-full border px-3 py-1 font-hand ${slot === option ? "border-foreground bg-paper" : "border-ink-dim/30 text-ink-pencil hover:bg-paper"} disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </>
      )}

      {mutation.error && <p className="mt-3 text-sm text-pencil-red">{mutation.error.message}</p>}

      <Button
        disabled={!date || !slot || mutation.isPending}
        onClick={() => mutation.mutate()}
        className="ink-stamp-btn mt-4 h-auto rounded-2xl px-5 py-2 font-hand text-lg font-bold"
      >
        {mutation.isPending ? "Moving…" : "Move my session ✦"}
      </Button>
    </div>
  );
}
