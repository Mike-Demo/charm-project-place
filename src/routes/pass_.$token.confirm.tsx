import { useMutation } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { confirmAttendance } from "@/lib/atelier-service";

export const Route = createFileRoute("/pass_/$token/confirm")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Confirm Attendance — Fresh Ink: Book your session" },
      { name: "description", content: "Confirm you'll be at your Tattoo Atelier session in Saint Paul." },
      { property: "og:title", content: "Confirm Attendance — Fresh Ink: Book your session" },
      { property: "og:description", content: "Confirm you'll be at your Tattoo Atelier session in Saint Paul." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  ssr: false,
  component: ConfirmPage,
});

function ConfirmPage() {
  const { token } = Route.useParams();
  const mutation = useMutation({ mutationFn: () => confirmAttendance(token) });
  const { mutate } = mutation;
  useEffect(() => { mutate(); }, [mutate]);

  return (
    <div className="min-h-dvh px-4 py-5 sm:px-8">
      <main className="paper-sheet relative mx-auto max-w-xl space-y-4 rounded-2xl p-6 text-center sm:p-10" aria-live="polite">
        {mutation.isSuccess ? (
          <>
            <h1 className="text-4xl">You&apos;re confirmed ✓</h1>
            <p className="text-ink-pencil">Thanks! Your station will be ready. See you soon.</p>
          </>
        ) : mutation.isError ? (
          <>
            <h1 className="text-3xl">We couldn&apos;t confirm that booking.</h1>
            <p className="text-ink-pencil">The link may be incomplete, or the booking was changed. Please contact the studio.</p>
          </>
        ) : <p className="font-hand text-xl text-ink-pencil">Inking your confirmation…</p>}
        <Link to="/pass/$token" params={{ token }} className="inline-flex min-h-11 items-center font-hand text-lg underline">Open your session pass →</Link>
      </main>
    </div>
  );
}
