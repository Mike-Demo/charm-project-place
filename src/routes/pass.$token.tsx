import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ConfirmedPass } from "@/components/ConfirmedPass";
import { fetchBookingByToken } from "@/lib/atelier-service";

export const Route = createFileRoute("/pass/$token")({
  head: () => ({
    meta: [
      { title: "Your Session Pass — Tattoo Atelier" },
      { name: "description", content: "Your private Tattoo Atelier session pass: details, calendar invite, and rescheduling." },
      { property: "og:title", content: "Your Session Pass — Tattoo Atelier" },
      { property: "og:description", content: "Private session pass for your Tattoo Atelier booking." },
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
    <div className="min-h-screen px-4 py-5 sm:px-8">
      <main className="paper-sheet relative mx-auto max-w-3xl rounded-2xl p-6 sm:p-10">
        {query.isPending ? (
          <p className="font-hand text-xl text-ink-pencil">Pulling your pass from the drawer…</p>
        ) : query.data ? (
          <ConfirmedPass booking={query.data} token={token} onRescheduled={() => void query.refetch()} />
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
