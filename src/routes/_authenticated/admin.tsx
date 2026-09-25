import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  TIME_SLOTS,
  addDays,
  formatLongDate,
  slotMinutes,
  startOfDay,
  toDateKey,
  type Appointment,
  type BlockedSlot,
} from "@/lib/atelier";
import {
  blockSlot,
  claimAdmin,
  fetchAppointments,
  fetchBlockedSlots,
  isAdmin,
  setAppointmentStatus,
  unblockSlot,
} from "@/lib/atelier-service";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio Ledger — Tattoo Atelier" },
      { name: "description", content: "Manage sessions and studio availability." },
      { property: "og:title", content: "Studio Ledger — Tattoo Atelier" },
      { property: "og:description", content: "Manage sessions and studio availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const RANGE_DAYS = 60;

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeStart = useMemo(() => addDays(today, -14), [today]);
  const rangeEnd = useMemo(() => addDays(today, RANGE_DAYS), [today]);
  const [focusDate, setFocusDate] = useState<Date>(today);
  const [actionError, setActionError] = useState<string | null>(null);

  const roleQuery = useQuery({
    queryKey: ["admin-role"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return { admin: false, email: "" };
      return { admin: await isAdmin(userId), email: data.user?.email ?? "" };
    },
  });

  const allowed = roleQuery.data?.admin === true;

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", toDateKey(rangeStart), toDateKey(rangeEnd)],
    queryFn: () => fetchAppointments(rangeStart, rangeEnd),
    enabled: allowed,
  });

  const blockedQuery = useQuery({
    queryKey: ["blocked", toDateKey(rangeStart), toDateKey(rangeEnd)],
    queryFn: () => fetchBlockedSlots(rangeStart, rangeEnd),
    enabled: allowed,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["blocked"] });
  };

  const claimMutation = useMutation({
    mutationFn: claimAdmin,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-role"] }),
    onError: (error: Error) => setActionError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => setAppointmentStatus(id, status),
    onSuccess: refresh,
    onError: (error: Error) => setActionError(error.message),
  });

  const blockMutation = useMutation({
    mutationFn: ({ date, slot }: { date: Date; slot: string | null }) =>
      blockSlot(date, slot, slot === null ? "Atelier closed" : "Artist hold"),
    onSuccess: refresh,
    onError: (error: Error) => setActionError(error.message),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockSlot(id),
    onSuccess: refresh,
    onError: (error: Error) => setActionError(error.message),
  });

  const appointments = appointmentsQuery.data ?? [];
  const blocked = blockedQuery.data ?? [];
  const focusKey = toDateKey(focusDate);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.booking_date === focusKey)
        .sort((a, b) => slotMinutes(a.time_slot) - slotMinutes(b.time_slot)),
    [appointments, focusKey],
  );

  const dayBlocks = useMemo(
    () => blocked.filter((item) => item.blocked_date === focusKey),
    [blocked, focusKey],
  );

  const dayClosed = dayBlocks.some((item) => item.time_slot === null);
  const upcoming = useMemo(
    () =>
      appointments
        .filter((item) => item.booking_date >= toDateKey(today) && item.status === "confirmed")
        .sort(
          (a, b) =>
            a.booking_date.localeCompare(b.booking_date) ||
            slotMinutes(a.time_slot) - slotMinutes(b.time_slot),
        ),
    [appointments, today],
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth" });
  };

  if (roleQuery.isLoading) {
    return <Shell><p className="text-lg text-ink-pencil">Opening the ledger…</p></Shell>;
  }

  if (!allowed) {
    return (
      <Shell>
        <h1 className="text-3xl font-normal sm:text-4xl">Studio access required</h1>
        <p className="mt-3 text-lg text-ink-pencil">
          Signed in as {roleQuery.data?.email || "unknown"}. This account is not yet a studio artist.
        </p>
        <p className="mt-2 text-base text-ink-pencil">
          If you are the studio owner and nobody has claimed the ledger yet, claim it now.
        </p>
        {actionError !== null && <p className="mt-3 text-pencil-red">{actionError}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            disabled={claimMutation.isPending}
            onClick={() => claimMutation.mutate()}
            className="ink-stamp-btn h-auto rounded-2xl px-6 py-3 font-hand text-lg font-bold"
          >
            Claim studio access ✦
          </Button>
          <Button variant="outline" onClick={() => void signOut()} className="h-auto rounded-2xl px-6 py-3 font-hand text-lg">
            Sign out
          </Button>
        </div>
        {claimMutation.data === false && (
          <p className="mt-3 text-pencil-red">The ledger already has an owner. Ask them to add you.</p>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">
            Tattoo Atelier // Studio Ledger
          </p>
          <h1 className="mt-1 text-3xl font-normal sm:text-4xl">Sessions &amp; availability</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-auto rounded-2xl border-ink-dim/40 px-4 py-2 font-hand text-base"
            onClick={() => downloadIcs(upcoming, "tattoo-atelier.ics")}
          >
            Export calendar
          </Button>
          <Button
            variant="outline"
            className="h-auto rounded-2xl border-ink-dim/40 px-4 py-2 font-hand text-base"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </div>
      </div>

      {actionError !== null && <p className="mt-4 text-pencil-red">{actionError}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-2xl border border-ink-dim/30 bg-paper-deep/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-normal">Next 14 days</h2>
            <span className="font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">
              {upcoming.length} booked
            </span>
          </div>
          <div className="space-y-1">
            {Array.from({ length: 14 }, (_, index) => addDays(today, index)).map((date) => {
              const key = toDateKey(date);
              const count = appointments.filter(
                (item) => item.booking_date === key && item.status !== "cancelled" && item.status !== "expired",
              ).length;
              const closed = blocked.some((item) => item.blocked_date === key && item.time_slot === null);
              const active = key === focusKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFocusDate(date)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    active ? "bg-foreground text-background" : "hover:bg-paper-line"
                  }`}
                >
                  <span className="text-lg">{formatLongDate(date)}</span>
                  <span className="font-mono text-xs">
                    {closed ? "closed" : `${count}/${TIME_SLOTS.length}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-ink-dim/30 bg-paper-deep/50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-normal">{formatLongDate(focusDate)}</h2>
            {dayClosed ? (
              <Button
                variant="outline"
                className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
                onClick={() => {
                  const entry = dayBlocks.find((item) => item.time_slot === null);
                  if (entry) unblockMutation.mutate(entry.id);
                }}
              >
                Reopen the day
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
                onClick={() => blockMutation.mutate({ date: focusDate, slot: null })}
              >
                Close the day
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const appointment = dayAppointments.find(
                (item) => item.time_slot === slot && item.status !== "cancelled" && item.status !== "expired",
              );
              const block = dayBlocks.find((item) => item.time_slot === slot);
              return (
                <SlotRow
                  key={slot}
                  slot={slot}
                  closed={dayClosed}
                  appointment={appointment}
                  block={block}
                  onBlock={() => blockMutation.mutate({ date: focusDate, slot })}
                  onUnblock={(id: string) => unblockMutation.mutate(id)}
                  onStatus={(id: string, status: string) => statusMutation.mutate({ id, status })}
                />
              );
            })}
          </div>

          {dayAppointments.some((item) => item.status === "cancelled") && (
            <div className="mt-4 border-t border-dashed border-ink-dim/30 pt-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">Cancelled</p>
              {dayAppointments
                .filter((item) => item.status === "cancelled")
                .map((item) => (
                  <p key={item.id} className="text-base text-ink-pencil line-through">
                    {item.time_slot} — {item.client_name}
                  </p>
                ))}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}

function SlotRow({
  slot,
  closed,
  appointment,
  block,
  onBlock,
  onUnblock,
  onStatus,
}: {
  slot: string;
  closed: boolean;
  appointment: Appointment | undefined;
  block: BlockedSlot | undefined;
  onBlock: () => void;
  onUnblock: (id: string) => void;
  onStatus: (id: string, status: string) => void;
}) {
  const state = appointment ? "booked" : closed || block ? "blocked" : "open";
  return (
    <div className="rounded-xl border border-ink-dim/25 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-sm text-ink-pencil">{slot}</span>
        <span
          className={`font-mono text-[11px] uppercase tracking-widest ${
            state === "booked" ? "text-cyan-draft" : state === "blocked" ? "text-pencil-red" : "text-pencil-green"
          }`}
        >
          {state}
        </span>
      </div>

      {appointment && (
        <div className="mt-1">
          <strong className="text-lg">{appointment.client_name}</strong>
          {appointment.pronouns && (
            <span className="ml-2 rounded-full border border-ink-dim/30 bg-paper-deep/80 px-2 py-0.5 font-mono text-xs text-ink-pencil">
              {appointment.pronouns}
            </span>
          )}
          <p className="text-sm text-ink-pencil">
            {appointment.phone} · {appointment.email}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {appointment.status === "confirmed" && (
              <Button
                variant="outline"
                className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
                onClick={() => onStatus(appointment.id, "completed")}
              >
                Mark completed
              </Button>
            )}
            <Button
              variant="outline"
              className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
              onClick={() => onStatus(appointment.id, "cancelled")}
            >
              Cancel
            </Button>
            <a
              className="rounded-full border border-ink-dim/40 px-3 py-1 font-hand text-sm text-foreground hover:bg-paper-line"
              href={googleCalendarUrl(appointment)}
              rel="noreferrer noopener"
              target="_blank"
            >
              Add to Google Calendar
            </a>
          </div>
          {appointment.status !== "confirmed" && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-pencil/70">
              {appointment.status === "pending" ? "Awaiting payment" : appointment.status}
            </p>
          )}
          {appointment.rescheduled_at && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-cyan-draft">
              Rescheduled ×{appointment.reschedule_count ?? 1} · {new Date(appointment.rescheduled_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {!appointment && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {block ? (
            <>
              <span className="text-sm text-ink-pencil">{block.reason ?? "Held"}</span>
              <Button
                variant="outline"
                className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
                onClick={() => onUnblock(block.id)}
              >
                Open this slot
              </Button>
            </>
          ) : closed ? (
            <span className="text-sm text-ink-pencil">Studio closed this day</span>
          ) : (
            <Button
              variant="outline"
              className="h-auto rounded-full border-ink-dim/40 px-3 py-1 font-hand text-sm"
              onClick={onBlock}
            >
              Block this slot
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sketchbook-canvas relative min-h-screen px-5 py-8 font-hand text-foreground sm:px-10">
      <div aria-hidden="true" className="paper-fiber" />
      <div className="relative z-10 mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}
