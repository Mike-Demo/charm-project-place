import { AdminIdea } from "@/components/IdeaGallery";
import { AdminBookingDetails } from "@/components/AdminBookingDetails";
import { Search } from "lucide-react";
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
  fetchAdminBooking,
  fetchBookingPage,
  fetchBlockedSlots,
  isAdmin,
  setAppointmentStatus,
  unblockSlot,
  type BookingPeriod,
} from "@/lib/atelier-service";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";

export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Studio Ledger — Fresh Ink: Book your session" },
      { name: "description", content: "Tattoo Atelier studio ledger: manage sessions and availability. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:title", content: "Studio Ledger — Fresh Ink: Book your session" },
      { property: "og:description", content: "Tattoo Atelier studio ledger: manage sessions and availability. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const RANGE_DAYS = 60;
const PAGE_SIZE = 12;

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = useMemo(() => startOfDay(new Date()), []);
  const rangeStart = useMemo(() => addDays(today, -14), [today]);
  const rangeEnd = useMemo(() => addDays(today, RANGE_DAYS), [today]);
  const [focusDate, setFocusDate] = useState<Date>(today);
  const [actionError, setActionError] = useState<string | null>(null);
  const [period, setPeriod] = useState<BookingPeriod>("upcoming");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const bookingPageQuery = useQuery({
    queryKey: ["booking-page", period, status, search, page, toDateKey(today)],
    queryFn: () => fetchBookingPage({ period, status, search, page, pageSize: PAGE_SIZE, today: toDateKey(today) }),
    enabled: allowed,
  });

  const selectedBookingQuery = useQuery({
    queryKey: ["admin-booking", selectedId],
    queryFn: () => selectedId ? fetchAdminBooking(selectedId) : Promise.resolve(null),
    enabled: allowed && selectedId !== null,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["blocked"] });
    void queryClient.invalidateQueries({ queryKey: ["booking-page"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-booking"] });
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
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
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

      <section aria-labelledby="bookings-heading" className="mt-8 border-t-2 border-foreground pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase text-cyan-draft">01 / Session preparation</p>
            <h2 id="bookings-heading" className="mt-1 text-2xl sm:text-3xl">Bookings</h2>
          </div>
          <span className="font-mono text-xs text-ink-pencil">{bookingPageQuery.data?.total ?? 0} matching</span>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-44 flex-1 sm:max-w-xs">
            <span className="font-mono text-[11px] uppercase text-ink-pencil">Search by name</span>
            <span className="mt-1 flex items-center gap-2 border-b border-ink-dim px-2"><Search aria-hidden="true" className="size-4 text-ink-pencil" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Client name" className="min-h-11 w-full min-w-0 bg-transparent outline-none placeholder:text-ink-pencil" /></span>
          </label>
          <label className="min-w-32 flex-1 sm:max-w-44">
            <span className="font-mono text-[11px] uppercase text-ink-pencil">Date</span>
            <select value={period} onChange={(event) => { setPeriod(event.target.value as BookingPeriod); setPage(0); }} className="mt-1 min-h-11 w-full border-b border-ink-dim bg-transparent px-2">
              <option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All dates</option>
            </select>
          </label>
          <label className="min-w-32 flex-1 sm:max-w-44">
            <span className="font-mono text-[11px] uppercase text-ink-pencil">Status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="mt-1 min-h-11 w-full border-b border-ink-dim bg-transparent px-2">
              <option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option>
            </select>
          </label>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            {bookingPageQuery.isPending ? <p role="status" className="py-8 text-ink-pencil">Loading bookings…</p> :
              bookingPageQuery.isError ? <div role="alert" className="py-8 text-pencil-red">Bookings could not load. <Button variant="outline" onClick={() => void bookingPageQuery.refetch()}>Retry</Button></div> :
              bookingPageQuery.data.bookings.length === 0 ? <p className="py-8 text-ink-pencil">No bookings match these filters.</p> : (
                <div className="divide-y divide-dashed divide-ink-dim/40 border-y border-ink-dim/50">
                  {bookingPageQuery.data.bookings.map((booking) => (
                    <Button key={booking.id} variant="ghost" aria-pressed={selectedId === booking.id} onClick={() => setSelectedId(booking.id)} className={`h-auto min-h-19 w-full justify-between gap-3 rounded-none px-2 py-3 text-left font-hand hover:bg-paper-line/40 ${selectedId === booking.id ? "bg-cyan-soft" : ""}`}>
                      <span className="min-w-0 flex-1"><span className="block truncate text-lg text-foreground">{booking.client_name}</span><span className="block truncate text-sm font-normal text-ink-pencil">{booking.pronouns || "Pronouns not provided"} · {booking.idea_description || booking.reference_image_path || booking.concept_sketch_path ? "Idea attached" : "No idea"}</span></span>
                      <span className="shrink-0 text-right font-mono text-xs font-normal text-ink-pencil"><span className="block">{booking.booking_date}</span><span className="block">{booking.time_slot}</span></span>
                    </Button>
                  ))}
                </div>
              )}
            <div className="mt-4 flex items-center justify-between gap-3 font-mono text-xs text-ink-pencil">
              <Button variant="outline" disabled={page === 0 || bookingPageQuery.isFetching} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</Button>
              <span>Page {page + 1} / {Math.max(1, Math.ceil((bookingPageQuery.data?.total ?? 0) / PAGE_SIZE))}</span>
              <Button variant="outline" disabled={bookingPageQuery.isFetching || (page + 1) * PAGE_SIZE >= (bookingPageQuery.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
          <AdminBookingDetails booking={selectedBookingQuery.data ?? null} loading={selectedBookingQuery.isPending && selectedId !== null} error={selectedBookingQuery.isError} busy={statusMutation.isPending} onStatus={(id, nextStatus) => statusMutation.mutate({ id, status: nextStatus })} onClose={() => setSelectedId(null)} />
        </div>
      </section>

      <h2 className="mt-12 border-t-2 border-foreground pt-5 text-2xl sm:text-3xl"><span className="mr-3 font-mono text-[11px] text-cyan-draft">02 / Availability</span>Studio calendar</h2>
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
          <AdminIdea id={appointment.id} description={appointment.idea_description ?? null} referencePath={appointment.reference_image_path ?? null} sketchPath={appointment.concept_sketch_path ?? null} />
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
              Add to Google Calendar<span className="sr-only"> (opens in a new tab)</span>
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
    <div className="sketchbook-canvas relative min-h-dvh px-5 py-8 font-hand text-foreground sm:px-10">
      <div aria-hidden="true" className="paper-fiber" />
      <div className="relative z-10 mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}
