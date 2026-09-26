import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ConfirmedPass } from "@/components/ConfirmedPass";
import { confirmAttendance, fetchAttendanceState, fetchBookingByToken } from "@/lib/atelier-service";

export const Route = createFileRoute("/pass/$token")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Session Pass — Fresh Ink: Book your session" },
      { name: "description", content: "Your private session pass: Fresh Ink details, calendar invite, and rescheduling. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:title", content: "Session Pass — Fresh Ink: Book your session" },
      { property: "og:description", content: "Your private session pass: Fresh Ink details, calendar invite, and rescheduling. Appointment-only custom linework studio in Saint Paul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: PassPage,
});

function PassPage() {
  const { token } = Route.useParams();
  const query = useQuery({ queryKey: ["pass", token], queryFn: () => fetchBookingByToken(token) });

  return (
    <div className="min-h-dvh px-4 py-5 sm:px-8">
      <main className="paper-sheet relative mx-auto max-w-3xl rounded-2xl p-6 sm:p-10">
        {query.isPending ? (
          <p className="font-hand text-xl text-ink-pencil">Pulling your pass from the drawer…</p>
        ) : query.data ? (
          <>
            <AttendanceBar token={token} />
            <ConfirmedPass booking={query.data} token={token} onRescheduled={() => void query.refetch()} />
          </>
        ) : (
          <div className="space-y-3">
            <h1 className="text-3xl">We couldn&apos;t find that pass.</h1>
            <p className="text-ink-pencil">The link may be incomplete, or the booking was cancelled.</p>
            <Link to="/" className="font-hand text-lg underline">Book a session →</Link>
          </div>
        )}
      </main>
    </div>
  );
}

function AttendanceBar({ token }: { token: string }) {
  const state = useQuery({ queryKey: ["attendance", token], queryFn: () => fetchAttendanceState(token) });
  const confirm = useMutation({ mutationFn: () => confirmAttendance(token), onSuccess: () => void state.refetch() });
  if (!state.data?.reminder_sent_at) return null;
  if (state.data.client_confirmed_at) {
    return <p className="mb-6 border-b border-dashed border-ink-dim/50 pb-4 font-hand text-lg">✓ You confirmed you&apos;ll be there.</p>;
  }
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-ink-dim/50 pb-4">
      <p className="font-hand text-lg">Still good for your session?</p>
      <button type="button" disabled={confirm.isPending} onClick={() => confirm.mutate()} className="min-h-11 rounded border border-foreground bg-foreground px-4 font-hand text-lg text-background">
        Yes, I&apos;ll be there
      </button>
      {confirm.isError && <p className="w-full text-sm text-pencil-red" role="alert">Could not confirm. Please try again.</p>}
    </div>
  );
}
