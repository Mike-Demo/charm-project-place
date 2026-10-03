import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Pricing — Fresh Ink: Book your session" },
      { name: "description", content: "Fresh Ink pricing: booking is free while in proof of concept. No payment step right now." },
      { property: "og:title", content: "Pricing — Fresh Ink: Book your session" },
      { property: "og:description", content: "Free proof-of-concept booking at Fresh Ink. No payment step right now." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/pricing` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/pricing` }],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/" className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground">
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>
        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // The Tab</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">Pricing</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            Booking a session is currently free. There is no payment step right now.
          </p>
        </header>
        <section className="mt-8 space-y-4 font-hand text-lg leading-relaxed text-ink-pencil">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Proof of concept</h2>
          <p>
            Fresh Ink is in a free proof-of-concept phase: holds lock in directly and confirmed
            bookings carry no charge. Paid checkout is not currently offered, so don't expect a
            working payment step. Pricing will be published here — and in machine-readable form at{" "}
            <a href="/pricing.md" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">/pricing.md</a> — if
            and when paid booking launches.
          </p>
        </section>
        <section className="mt-8 space-y-4 font-hand text-lg leading-relaxed text-ink-pencil">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">API usage</h2>
          <p>
            The public booking API and MCP server are free: anonymous access (60 reads/min, 5
            writes/hour) or an optional API key (600 reads/min, 30 writes/hour) minted via{" "}
            <span className="font-mono text-sm">POST /api/public/agent-keys</span>. No billing is
            attached to API keys.
          </p>
        </section>
      </main>
    </div>
  );
}
