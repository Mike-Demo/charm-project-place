import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactElement } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { openSlotCheckout } from "@/lib/paddle";

export const Route = createFileRoute("/checkout/$id")({
  staticData: { sitemap: false },
  validateSearch: z.object({ s: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Checkout — Fresh Ink: Book your session" },
      { name: "description", content: "Finish locking in the tattoo session your assistant held for you at Fresh Ink." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgentCheckout,
});

async function fetchHold(id: string, secret: string) {
  const { data, error } = await supabase.rpc("get_hold_for_checkout", { p_id: id, p_secret: secret });
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

function AgentCheckout(): ReactElement {
  const { id } = Route.useParams();
  const { s } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const hold = useQuery({ queryKey: ["agent-hold", id], queryFn: () => fetchHold(id, s ?? ""), enabled: Boolean(s) });

  const pay = async () => {
    if (!hold.data) return;
    setOpening(true);
    setError(null);
    try {
      await openSlotCheckout({ appointmentId: id, email: hold.data.email });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed to open.");
    } finally {
      setOpening(false);
    }
  };

  const h = hold.data;
  return (
    <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 py-12">
      <div className="paper-sheet rounded-sm border border-ink-dim/30 bg-card p-6 shadow-sm">
        <h1 className="font-hand text-3xl font-bold text-foreground">Your held session</h1>
        {!s || (hold.isSuccess && !h) ? (
          <p className="mt-4 text-sm text-muted-foreground">This checkout link isn't valid. Ask your assistant to hold a new time, or <Link className="underline" to="/">book directly</Link>.</p>
        ) : hold.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">Finding your hold…</p>
        ) : h ? (
          <>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-mono text-sm">
              <dt className="text-muted-foreground">Name</dt><dd>{h.client_name}</dd>
              <dt className="text-muted-foreground">Date</dt><dd>{h.booking_date}</dd>
              <dt className="text-muted-foreground">Time</dt><dd>{h.time_slot}</dd>
              <dt className="text-muted-foreground">Status</dt><dd>{h.status}</dd>
            </dl>
            {h.status === "pending" ? (
              <button className="mt-6 min-h-11 w-full rounded-sm bg-primary px-4 py-3 font-mono text-sm text-primary-foreground" disabled={opening} onClick={pay} type="button">
                {opening ? "Opening checkout…" : "Donate $1 & Lock In"}
              </button>
            ) : h.status === "confirmed" ? (
              <p className="mt-6 text-sm">Already locked in — check your email for your session pass.</p>
            ) : (
              <p className="mt-6 text-sm">This hold has expired. <Link className="underline" to="/">Pick a new time</Link>.</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Test mode: no real charge.</p>
          </>
        ) : null}
        {error || hold.error ? <p className="mt-3 text-sm text-destructive" role="alert">{error ?? hold.error?.message}</p> : null}
      </div>
    </main>
  );
}
